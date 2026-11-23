package com.medivault.service;

import com.medivault.dto.gemini.GeminiExtractionResponse.GeminiLabResultItem;
import com.medivault.dto.gemini.GeminiExtractionResponse.GeminiMedicationItem;
import com.medivault.model.LabResult;
import com.medivault.model.MedicalDocument;
import com.medivault.model.Medication;
import com.medivault.model.Patient;
import com.medivault.model.enums.LabFlag;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Clinical data clean-up done in pure Java code (NOT by the AI):
 * - Number cleaning (thousands commas, scientific notation "7.2 x 10^3", non-numeric strings).
 * - Reference range splitting (ref_low and ref_high, handling "< 200", "> 40", "12.0 - 15.5").
 * - Clinical flag determination (LOW, HIGH, NORMAL, UNKNOWN).
 * - Standard test name canonicalization via built-in alias dictionary.
 * - De-duplication of identical test rows.
 */
@Service
@Slf4j
public class ClinicalDataCleaner {

    // ── Number parsing regex patterns ───────────────────────────────────
    // Matches scientific / exponent notation: e.g. "7.2 x 10^3", "7.2 x10³", "7.2*10^3", "7.2e3"
    private static final Pattern SCIENTIFIC_PATTERN = Pattern.compile(
            "(?i)^([+-]?\\d+(?:\\.\\d+)?)\\s*(?:x|\\*|e)\\s*(?:10\\s*(?:\\^|\\*\\*)?\\s*)?([+-]?\\d+|[³²¹⁰]+)$"
    );

    // Matches standard numbers with possible thousands commas: e.g. "7,200", "2,85,000", "96.5"
    private static final Pattern NUMBER_WITH_COMMAS_PATTERN = Pattern.compile(
            "^[+-]?\\d[\\d,]*(?:\\.\\d+)?$"
    );

    // ── Reference range regex patterns ───────────────────────────────────
    // Less than: "< 200", "<=200", "<200"
    private static final Pattern LESS_THAN_PATTERN = Pattern.compile(
            "(?i)^<[=\\s]*([+-]?\\d[\\d,]*(?:\\.\\d+)?)"
    );

    // Greater than: "> 40", ">=40", ">40"
    private static final Pattern GREATER_THAN_PATTERN = Pattern.compile(
            "(?i)^>[=\\s]*([+-]?\\d[\\d,]*(?:\\.\\d+)?)"
    );

    // Range: "12.0 - 15.5", "70-100", "12.0 to 15.5"
    private static final Pattern TWO_SIDED_RANGE_PATTERN = Pattern.compile(
            "(?i)^([+-]?\\d[\\d,]*(?:\\.\\d+)?)\\s*(?:-|–|—|to)\\s*([+-]?\\d[\\d,]*(?:\\.\\d+)?)"
    );

    // ── Built-in Lab Test Aliases (Normalized lower-case -> Standard Name)
    private static final Map<String, String> LAB_TEST_ALIASES = new HashMap<>();

    static {
        // Glucose / Sugar
        registerAlias("Fasting Blood Sugar",
                "fbs", "fbs (plasma)", "glucose - fasting", "fasting blood glucose",
                "fasting blood sugar", "fasting glucose", "blood glucose fasting",
                "plasma glucose fasting", "fasting plasma glucose", "fbg", "glucose fasting");
        registerAlias("Postprandial Blood Sugar",
                "ppbs", "ppbg", "postprandial blood glucose", "postprandial blood sugar",
                "glucose - postprandial", "post prandial glucose", "postprandial glucose",
                "plasma glucose pp", "blood glucose pp");
        registerAlias("HbA1c",
                "hba1c", "glycated hemoglobin", "glycosylated hemoglobin", "a1c", "glycohemoglobin");

        // Complete Blood Count (CBC)
        registerAlias("Total WBC Count",
                "tlc", "total wbc count", "total leukocyte count", "wbc count", "total wbc",
                "wbc", "total white blood count", "white blood cells", "leukocytes");
        registerAlias("Hemoglobin",
                "hemoglobin", "haemoglobin", "hb", "hgb");
        registerAlias("Platelet Count",
                "platelets", "platelet count", "total platelets", "platelet", "plt");
        registerAlias("RBC Count",
                "rbc", "rbc count", "red blood cell count", "total rbc", "erythrocytes");
        registerAlias("Hematocrit",
                "hematocrit", "haematocrit", "pcv", "packed cell volume", "hct");
        registerAlias("MCV", "mcv", "mean corpuscular volume");
        registerAlias("MCH", "mch", "mean corpuscular hemoglobin");
        registerAlias("MCHC", "mchc", "mean corpuscular hemoglobin concentration");
        registerAlias("RDW", "rdw", "red cell distribution width", "rdw-cv", "rdw-sd");

        // Differential Count
        registerAlias("Neutrophils", "neutrophils", "neutrophil", "polymorphs", "segs");
        registerAlias("Lymphocytes", "lymphocytes", "lymphocyte", "lymphs");
        registerAlias("Monocytes", "monocytes", "monocyte");
        registerAlias("Eosinophils", "eosinophils", "eosinophil");
        registerAlias("Basophils", "basophils", "basophil");
        registerAlias("ESR", "esr", "erythrocyte sedimentation rate");

        // Kidney Function / Renal
        registerAlias("Serum Creatinine",
                "serum creatinine", "creatinine", "creat", "creatinine serum");
        registerAlias("Blood Urea Nitrogen",
                "blood urea nitrogen", "bun", "urea", "serum urea", "blood urea");
        registerAlias("Uric Acid",
                "uric acid", "serum uric acid");
        registerAlias("Calcium",
                "calcium", "serum calcium", "ca");

        // Liver Function / Hepatic
        registerAlias("Total Bilirubin",
                "total bilirubin", "bilirubin total", "bili total", "t. bilirubin");
        registerAlias("Direct Bilirubin",
                "direct bilirubin", "bilirubin direct", "conjugated bilirubin", "d. bilirubin");
        registerAlias("Indirect Bilirubin",
                "indirect bilirubin", "bilirubin indirect", "unconjugated bilirubin");
        registerAlias("SGPT / ALT",
                "sgpt", "sgpt/alt", "alt (sgpt)", "alanine aminotransferase", "alt", "alanine transaminase");
        registerAlias("SGOT / AST",
                "sgot", "sgot/ast", "ast (sgot)", "aspartate aminotransferase", "ast", "aspartate transaminase");
        registerAlias("Alkaline Phosphatase",
                "alkaline phosphatase", "alp", "alk phos");
        registerAlias("Total Protein",
                "total protein", "protein total", "serum total protein");
        registerAlias("Albumin",
                "albumin", "serum albumin");
        registerAlias("Globulin",
                "globulin", "serum globulin");

        // Lipid Profile
        registerAlias("Total Cholesterol",
                "total cholesterol", "cholesterol", "cholesterol total", "serum cholesterol");
        registerAlias("HDL Cholesterol",
                "hdl", "hdl cholesterol", "high density lipoprotein", "hdl-c", "good cholesterol");
        registerAlias("LDL Cholesterol",
                "ldl", "ldl cholesterol", "low density lipoprotein", "ldl-c", "bad cholesterol");
        registerAlias("Triglycerides",
                "triglycerides", "triglyceride", "tg", "trigs");
        registerAlias("VLDL Cholesterol",
                "vldl", "vldl cholesterol", "very low density lipoprotein");
        registerAlias("TC / HDL Ratio",
                "tc/hdl ratio", "cholesterol/hdl ratio", "tc/hdl", "chol/hdl ratio");

        // Thyroid
        registerAlias("TSH",
                "tsh", "thyroid stimulating hormone", "ultrasensitive tsh");
        registerAlias("Free T3", "free t3", "ft3");
        registerAlias("Free T4", "free t4", "ft4");
    }

    private static void registerAlias(String canonical, String... variations) {
        for (String v : variations) {
            LAB_TEST_ALIASES.put(normalizeKey(v), canonical);
        }
    }

    private static String normalizeKey(String s) {
        if (s == null) return "";
        return s.toLowerCase().replaceAll("[^a-z0-9]", " ").replaceAll("\\s+", " ").trim();
    }

    // ───────────────────────────────────────────────────────────────────
    //  1. Number Parsing
    // ───────────────────────────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ValueParseResult {
        private BigDecimal number;
        private String text;
    }

    /**
     * Parses numeric strings, scientific exponents ("7.2 x 10^3"), and non-numeric labels.
     */
    public ValueParseResult parseValue(String raw) {
        if (raw == null || raw.isBlank()) {
            return new ValueParseResult(null, null);
        }
        String s = raw.trim();

        // 1. Try scientific / exponent notation: "7.2 x 10^3", "7.2 x10³", "7.2*10^3"
        Matcher sciMatcher = SCIENTIFIC_PATTERN.matcher(s);
        if (sciMatcher.matches()) {
            try {
                double base = Double.parseDouble(sciMatcher.group(1));
                String expStr = sciMatcher.group(2)
                        .replace("³", "3")
                        .replace("²", "2")
                        .replace("¹", "1")
                        .replace("⁰", "0");
                double exp = Double.parseDouble(expStr);
                double total = base * Math.pow(10, exp);
                BigDecimal bd = BigDecimal.valueOf(total).setScale(3, RoundingMode.HALF_UP);
                return new ValueParseResult(bd, null);
            } catch (Exception ignored) {}
        }

        // 2. Try standard number with thousands comma: "7,200", "2,85,000", "96.5"
        String stripped = s.replace(",", "");
        try {
            BigDecimal bd = new BigDecimal(stripped).setScale(3, RoundingMode.HALF_UP);
            return new ValueParseResult(bd, null);
        } catch (NumberFormatException ignored) {}

        // 3. Fallback: non-numeric string (e.g. "Negative", "Reactive", "Trace", "Normal")
        return new ValueParseResult(null, s);
    }

    // ───────────────────────────────────────────────────────────────────
    //  2. Reference Range Parsing
    // ───────────────────────────────────────────────────────────────────

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RefRangeResult {
        private BigDecimal refLow;
        private BigDecimal refHigh;
    }

    /**
     * Parses reference intervals like "12.0 - 15.5", "< 200", "> 40", "70-100 mg/dL".
     */
    public RefRangeResult parseRefRange(String rawRange) {
        if (rawRange == null || rawRange.isBlank()) {
            return new RefRangeResult(null, null);
        }

        // Strip units like mg/dL, %, cells/mcL, etc.
        String clean = rawRange.replaceAll("(?i)\\b(mg/dl|g/dl|cells/mcl|10\\^3/mcl|/cumm|u/l|%|mmol/l|μiu/ml|miu/l)\\b", "").trim();

        // Less than: "< 200", "<= 200"
        Matcher ltMatcher = LESS_THAN_PATTERN.matcher(clean);
        if (ltMatcher.find()) {
            try {
                BigDecimal high = new BigDecimal(ltMatcher.group(1).replace(",", "")).setScale(3, RoundingMode.HALF_UP);
                return new RefRangeResult(null, high);
            } catch (Exception ignored) {}
        }

        // Greater than: "> 40", ">= 40"
        Matcher gtMatcher = GREATER_THAN_PATTERN.matcher(clean);
        if (gtMatcher.find()) {
            try {
                BigDecimal low = new BigDecimal(gtMatcher.group(1).replace(",", "")).setScale(3, RoundingMode.HALF_UP);
                return new RefRangeResult(low, null);
            } catch (Exception ignored) {}
        }

        // Two-sided range: "12.0 - 15.5" or "70-100" or "12.0 to 15.5"
        Matcher rangeMatcher = TWO_SIDED_RANGE_PATTERN.matcher(clean);
        if (rangeMatcher.find()) {
            try {
                BigDecimal low = new BigDecimal(rangeMatcher.group(1).replace(",", "")).setScale(3, RoundingMode.HALF_UP);
                BigDecimal high = new BigDecimal(rangeMatcher.group(2).replace(",", "")).setScale(3, RoundingMode.HALF_UP);
                return new RefRangeResult(low, high);
            } catch (Exception ignored) {}
        }

        return new RefRangeResult(null, null);
    }

    // ───────────────────────────────────────────────────────────────────
    //  3. Flag Calculation
    // ───────────────────────────────────────────────────────────────────

    /**
     * Calculates clinical flag:
     * - value < refLow -> LOW
     * - value > refHigh -> HIGH
     * - in between -> NORMAL
     * - no value or no range -> UNKNOWN
     */
    public LabFlag calculateFlag(BigDecimal valueNumber, BigDecimal refLow, BigDecimal refHigh) {
        if (valueNumber == null) {
            return LabFlag.UNKNOWN;
        }
        if (refLow == null && refHigh == null) {
            return LabFlag.UNKNOWN;
        }
        if (refLow != null && valueNumber.compareTo(refLow) < 0) {
            return LabFlag.LOW;
        }
        if (refHigh != null && valueNumber.compareTo(refHigh) > 0) {
            return LabFlag.HIGH;
        }
        return LabFlag.NORMAL;
    }

    // ───────────────────────────────────────────────────────────────────
    //  4. Canonical Test Name Mapping
    // ───────────────────────────────────────────────────────────────────

    /**
     * Resolves the canonical test name:
     * Checks built-in alias dictionary first (by normalized printed name),
     * then falls back to AI's canonicalTestName, and lastly to printed name.
     */
    public String resolveCanonicalName(String printedName, String aiCanonical) {
        if (printedName != null) {
            String key = normalizeKey(printedName);
            if (LAB_TEST_ALIASES.containsKey(key)) {
                return LAB_TEST_ALIASES.get(key);
            }
        }
        if (aiCanonical != null && !aiCanonical.isBlank()) {
            String key = normalizeKey(aiCanonical);
            if (LAB_TEST_ALIASES.containsKey(key)) {
                return LAB_TEST_ALIASES.get(key);
            }
            return toTitleCase(aiCanonical.trim());
        }
        return toTitleCase(printedName != null ? printedName.trim() : "Unknown Test");
    }

    private String toTitleCase(String input) {
        if (input == null || input.isBlank()) return "";
        StringBuilder sb = new StringBuilder();
        boolean nextUpper = true;
        for (char c : input.toCharArray()) {
            if (Character.isWhitespace(c) || c == '-' || c == '/') {
                nextUpper = true;
                sb.append(c);
            } else if (nextUpper) {
                sb.append(Character.toUpperCase(c));
                nextUpper = false;
            } else {
                sb.append(Character.toLowerCase(c));
            }
        }
        return sb.toString();
    }

    // ───────────────────────────────────────────────────────────────────
    //  5. Clean & Build Lab Results (with de-duplication)
    // ───────────────────────────────────────────────────────────────────

    /**
     * Cleans raw AI lab result items and converts them into JPA LabResult entities.
     * De-duplicates identical (canonicalName, value, page) items.
     */
    public List<LabResult> cleanLabResults(
            List<GeminiLabResultItem> rawItems,
            Patient patient,
            MedicalDocument document,
            LocalDate reportDate
    ) {
        if (rawItems == null || rawItems.isEmpty()) {
            return Collections.emptyList();
        }

        List<LabResult> cleaned = new ArrayList<>();
        Set<String> seenKeys = new HashSet<>();

        LocalDate date = reportDate != null
                ? reportDate
                : (document.getReportDate() != null ? document.getReportDate() : LocalDate.now());

        for (GeminiLabResultItem item : rawItems) {
            if (item == null) continue;
            String printedName = item.getTestName() != null ? item.getTestName().trim() : "";
            if (printedName.isBlank()) continue;

            String canonicalName = resolveCanonicalName(printedName, item.getCanonicalTestName());
            ValueParseResult valResult = parseValue(item.getValue());
            RefRangeResult rangeResult = parseRefRange(item.getRefRange());
            LabFlag flag = calculateFlag(valResult.getNumber(), rangeResult.getRefLow(), rangeResult.getRefHigh());

            Integer page = item.getPage() != null ? item.getPage() : 1;

            // De-duplication key: (canonicalName | valueNumber/valueText | page)
            String dedupKey = canonicalName.toLowerCase() + "|" +
                    (valResult.getNumber() != null ? valResult.getNumber().toPlainString() : valResult.getText()) +
                    "|" + page;

            if (!seenKeys.add(dedupKey)) {
                log.debug("Skipping duplicate lab result item: {}", dedupKey);
                continue;
            }

            LabResult lab = LabResult.builder()
                    .patient(patient)
                    .document(document)
                    .testName(printedName)
                    .canonicalTestName(canonicalName)
                    .valueNumber(valResult.getNumber())
                    .valueText(valResult.getText())
                    .unit(item.getUnit() != null ? item.getUnit().trim() : null)
                    .refLow(rangeResult.getRefLow())
                    .refHigh(rangeResult.getRefHigh())
                    .flag(flag)
                    .resultDate(date)
                    .pageNumber(page)
                    .confidence(BigDecimal.valueOf(0.950))
                    .verified(false)
                    .build();

            cleaned.add(lab);
        }

        return cleaned;
    }

    /**
     * Cleans raw AI medication items and converts them into JPA Medication entities.
     * De-duplicates identical (name, dosage, page) items.
     */
    public List<Medication> cleanMedications(
            List<GeminiMedicationItem> rawItems,
            Patient patient,
            MedicalDocument document,
            LocalDate reportDate
    ) {
        if (rawItems == null || rawItems.isEmpty()) {
            return Collections.emptyList();
        }

        List<Medication> cleaned = new ArrayList<>();
        Set<String> seenKeys = new HashSet<>();

        LocalDate date = reportDate != null
                ? reportDate
                : (document.getReportDate() != null ? document.getReportDate() : LocalDate.now());

        for (GeminiMedicationItem item : rawItems) {
            if (item == null || item.getName() == null || item.getName().isBlank()) continue;

            String name = toTitleCase(item.getName().trim());
            String dosage = item.getDosage() != null ? item.getDosage().trim() : null;
            Integer page = item.getPage() != null ? item.getPage() : 1;

            String dedupKey = name.toLowerCase() + "|" + (dosage != null ? dosage.toLowerCase() : "") + "|" + page;
            if (!seenKeys.add(dedupKey)) {
                log.debug("Skipping duplicate medication item: {}", dedupKey);
                continue;
            }

            Medication med = Medication.builder()
                    .patient(patient)
                    .document(document)
                    .name(name)
                    .dosage(dosage)
                    .frequency(item.getFrequency() != null ? item.getFrequency().trim() : "As directed")
                    .duration(item.getDuration() != null ? item.getDuration().trim() : null)
                    .prescribedDate(date)
                    .pageNumber(page)
                    .confidence(BigDecimal.valueOf(0.950))
                    .verified(false)
                    .build();

            cleaned.add(med);
        }

        return cleaned;
    }
}
