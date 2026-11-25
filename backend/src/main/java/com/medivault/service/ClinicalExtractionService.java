package com.medivault.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medivault.model.LabResult;
import com.medivault.model.MedicalDocument;
import com.medivault.model.Medication;
import com.medivault.model.Patient;
import com.medivault.model.enums.LabFlag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Clinical pattern-matching parser that extracts structured Medications
 * and Lab Results from raw text (from PDFs, OCR, or clinical summaries).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ClinicalExtractionService {

    private final ObjectMapper objectMapper;

    // ── Regex patterns for medications ──────────────────────────────────
    // Prefix: Tab, Tablet, Cap, Capsule, Syr, Syrup, Inj, Injection, Oint, Rx
    private static final Pattern MED_PREFIX_PATTERN = Pattern.compile(
            "(?i)\\b(Tab(?:let)?|Cap(?:sule)?|Syr(?:up)?|Inj(?:ection)?|Oint(?:ment)?|Drops?|Rx:?)\\b\\.?"
    );

    // Dosage: e.g. 500mg, 500 mg, 10ml, 2.5mcg, 100iu (excludes concentration units like mg/dL, g/dL)
    private static final Pattern DOSAGE_PATTERN = Pattern.compile(
            "(?i)\\b(\\d+(?:\\.\\d+)?)\\s*(mg|g|mcg|ml|iu|IU|tablets?|capsules?|drops?|pills?)(?!\\s*/\\s*(?:dl|dL|l|L|cumm|mcL|ml|kg))\\b"
    );

    // Frequency: 1-0-1, 1-1-1, 0-0-1, 1-0-0, OD, BD, BID, TDS, TID, QID, SOS, once daily, twice daily
    private static final Pattern FREQUENCY_PATTERN = Pattern.compile(
            "(?i)\\b(1-[01]-[01]|[01]-1-[01]|[01]-[01]-1|O\\.?D\\.?|B\\.?D\\.?|B\\.?I\\.?D\\.?|T\\.?D\\.?S\\.?|T\\.?I\\.?D\\.?|Q\\.?I\\.?D\\.?|S\\.?O\\.?S\\.?|once\\s+daily|twice\\s+daily|thrice\\s+daily|daily|at\\s+bedtime|before\\s+(?:food|meals)|after\\s+(?:food|meals))\\b"
    );

    // Duration: for 5 days, 30 days, 2 weeks, 1 month, x 5 days
    private static final Pattern DURATION_PATTERN = Pattern.compile(
            "(?i)\\b(?:for\\s+|x\\s*)?(\\d+\\s*(?:days?|weeks?|months?))\\b"
    );

    // ── Canonical Lab Test Patterns ─────────────────────────────────────
    private static final List<LabTestDefinition> LAB_DEFINITIONS = List.of(
            new LabTestDefinition("Hemoglobin", "(?i)\\b(Hemoglobin|Haemoglobin|Hb)\\b", "g/dL", new BigDecimal("12.0"), new BigDecimal("17.5")),
            new LabTestDefinition("Fasting Blood Sugar", "(?i)\\b(Fasting\\s+(?:Blood\\s+)?(?:Glucose|Sugar)|FBS|FBG|Blood\\s+Glucose\\s+Fasting)\\b", "mg/dL", new BigDecimal("70.0"), new BigDecimal("100.0")),
            new LabTestDefinition("Postprandial Blood Sugar", "(?i)\\b(Post\\s*prandial(?:\\s+Blood)?(?:\\s+Glucose|\\s+Sugar)?|PPBS|PPBG)\\b", "mg/dL", new BigDecimal("70.0"), new BigDecimal("140.0")),
            new LabTestDefinition("HbA1c", "(?i)\\b(HbA1c|Glycated\\s+Hemoglobin)\\b", "%", new BigDecimal("4.0"), new BigDecimal("5.6")),
            new LabTestDefinition("Total WBC Count", "(?i)\\b(Total\\s+(?:Leukocyte|WBC)\\s+Count|Total\\s+WBC|TLC|WBC\\s+Count|Leukocytes?)\\b", "cells/mcL", new BigDecimal("4000.0"), new BigDecimal("11000.0")),
            new LabTestDefinition("Platelet Count", "(?i)\\b(Platelet\\s+Count|Platelets)\\b", "10^3/mcL", new BigDecimal("150.0"), new BigDecimal("450.0")),
            new LabTestDefinition("Serum Creatinine", "(?i)\\b(Serum\\s+Creatinine|Creatinine)\\b", "mg/dL", new BigDecimal("0.6"), new BigDecimal("1.3")),
            new LabTestDefinition("TSH", "(?i)\\b(Thyroid\\s+Stimulating\\s+Hormone|TSH)\\b", "μIU/mL", new BigDecimal("0.4"), new BigDecimal("4.5")),
            new LabTestDefinition("Total Cholesterol", "(?i)\\b(Total\\s+Cholesterol|Cholesterol)\\b", "mg/dL", new BigDecimal("125.0"), new BigDecimal("200.0")),
            // ── Liver Function Tests (LFT) ──
            new LabTestDefinition("Total Bilirubin", "(?i)\\b(Bilirubin[,\t ]+Total|Total\\s+Bilirubin)\\b", "mg/dL", new BigDecimal("0.2"), new BigDecimal("1.2")),
            new LabTestDefinition("Direct Bilirubin", "(?i)\\b(Bilirubin[,\t ]+Direct|Direct\\s+Bilirubin)\\b", "mg/dL", new BigDecimal("0.0"), new BigDecimal("0.3")),
            new LabTestDefinition("Indirect Bilirubin", "(?i)\\b(Bilirubin[,\t ]+Indirect|Indirect\\s+Bilirubin)\\b", "mg/dL", new BigDecimal("0.1"), new BigDecimal("1.0")),
            new LabTestDefinition("AST (SGOT)", "(?i)\\b(AST\\s*\\(SGOT\\)|SGOT|AST)\\b", "U/L", new BigDecimal("5.0"), new BigDecimal("40.0")),
            new LabTestDefinition("ALT (SGPT)", "(?i)\\b(ALT\\s*\\(SGPT\\)|SGPT|ALT)\\b", "U/L", new BigDecimal("7.0"), new BigDecimal("56.0")),
            new LabTestDefinition("Alkaline Phosphatase (ALP)", "(?i)\\b(Alkaline\\s+Phosphatase(?:\\s*\\(ALP\\))?|ALP)\\b", "U/L", new BigDecimal("44.0"), new BigDecimal("147.0")),
            new LabTestDefinition("Total Protein", "(?i)\\b(Total\\s+Protein|Protein[,\t ]+Total)\\b", "g/dL", new BigDecimal("6.0"), new BigDecimal("8.3")),
            new LabTestDefinition("Albumin", "(?i)\\b(Albumin)\\b", "g/dL", new BigDecimal("3.5"), new BigDecimal("5.0")),
            new LabTestDefinition("Globulin", "(?i)\\b(Globulin)\\b", "g/dL", new BigDecimal("2.0"), new BigDecimal("3.5")),
            new LabTestDefinition("A/G Ratio", "(?i)\\b(A/G\\s+Ratio|Albumin[/\t ]+Globulin\\s+Ratio)\\b", "ratio", new BigDecimal("1.0"), new BigDecimal("2.2")),
            // ── Thyroid Profile ──
            new LabTestDefinition("Total T3", "(?i)\\b(Triiodothyronine|Total\\s+T3|T3)\\b", "ng/mL", new BigDecimal("0.8"), new BigDecimal("2.0")),
            new LabTestDefinition("Total T4", "(?i)\\b(Thyroxine|Total\\s+T4|T4)\\b", "µg/dL", new BigDecimal("5.1"), new BigDecimal("14.1"))
    );

    /**
     * Extracts medications from text for a patient and document.
     */
    public List<Medication> extractMedications(String text, Patient patient, MedicalDocument document) {
        if (text == null || text.isBlank()) return Collections.emptyList();

        List<Medication> results = new ArrayList<>();
        Set<String> seenNames = new HashSet<>();

        // Normalize line breaks: also split on period or semicolon followed by a medicine prefix or number
        String normalized = text.replaceAll("(?i)\\.\\s*(?=(?:Tab|Cap|Syr|Inj|Oint|Rx|\\d+\\.))", "\n");
        String[] lines = normalized.split("\\r?\\n");
        for (String rawLine : lines) {
            String line = rawLine.trim();
            if (line.isBlank() || line.length() < 3) continue;

            // Check if line contains a dosage or a medicine prefix
            Matcher doseMatcher = DOSAGE_PATTERN.matcher(line);
            Matcher prefixMatcher = MED_PREFIX_PATTERN.matcher(line);

            if (doseMatcher.find()) {
                String dosage = doseMatcher.group(0).trim();

                // Find frequency if present
                String frequency = "As directed";
                Matcher freqMatcher = FREQUENCY_PATTERN.matcher(line);
                if (freqMatcher.find()) {
                    frequency = normalizeFrequency(freqMatcher.group(0));
                }

                // Find duration if present
                String duration = null;
                Matcher durMatcher = DURATION_PATTERN.matcher(line);
                if (durMatcher.find()) {
                    duration = durMatcher.group(1).trim();
                }

                // Extract medicine name from the text before the dosage
                int doseStart = doseMatcher.start();
                String beforeDose = line.substring(0, doseStart).trim();

                // Clean prefix like "Tab.", "Cap.", "1.", "Rx:", "Clinical notes:"
                beforeDose = beforeDose.replaceAll("(?i)\\b(clinical\\s+notes?|notes?|doctor|hospital|patient|treatment|medicine|rx):?", "").trim();
                beforeDose = prefixMatcher.reset(beforeDose).replaceAll("").trim();
                beforeDose = beforeDose.replaceAll("^[0-9]+[\\.\\)\\-]\\s*", "").trim();
                beforeDose = beforeDose.replaceAll("(?i)\\b(take|oral|tablets?|capsules?)\\b", "").trim();

                String medName = beforeDose.replaceAll("[^a-zA-Z0-9\\s\\-]", "").trim();
                if (medName.isBlank() || medName.length() < 3) {
                    // Fallback to word right before dosage
                    String[] words = line.substring(0, doseStart).trim().split("\\s+");
                    if (words.length > 0) {
                        medName = words[words.length - 1].replaceAll("[^a-zA-Z]", "");
                    }
                }

                if (!medName.isBlank() && medName.length() >= 3 && seenNames.add(medName.toLowerCase())) {
                    LocalDate presDate = document.getReportDate() != null
                            ? document.getReportDate()
                            : LocalDate.now();

                    Medication med = Medication.builder()
                            .patient(patient)
                            .document(document)
                            .name(capitalize(medName))
                            .dosage(dosage)
                            .frequency(frequency)
                            .duration(duration)
                            .prescribedDate(presDate)
                            .confidence(new BigDecimal("0.850"))
                            .verified(false)
                            .build();

                    results.add(med);
                }
            }
        }

        return results;
    }

    /**
     * Extracts lab results from text for a patient and document.
     */
    public List<LabResult> extractLabResults(String text, Patient patient, MedicalDocument document) {
        if (text == null || text.isBlank()) return Collections.emptyList();

        List<LabResult> results = new ArrayList<>();
        Set<String> seenTests = new HashSet<>();

        // Normalize line breaks: also split on period or semicolon followed by a medicine prefix or number
        String normalized = text.replaceAll("(?i)\\.\\s*(?=(?:Tab|Cap|Syr|Inj|Oint|Rx|\\d+\\.))", "\n");
        String[] lines = normalized.split("\\r?\\n");
        for (String rawLine : lines) {
            String line = rawLine.trim();
            if (line.isBlank()) continue;

            for (LabTestDefinition def : LAB_DEFINITIONS) {
                Matcher nameMatcher = Pattern.compile(def.regex).matcher(line);
                if (nameMatcher.find() && seenTests.add(def.canonicalName)) {
                    // Look for a number on the line after the test name (handles commas like 7,200 or decimals 7.2)
                    String afterName = line.substring(nameMatcher.end()).trim();
                    Matcher numMatcher = Pattern.compile("[:=]?\\s*([+-]?\\d[\\d,]*(?:\\.\\d+)?)").matcher(afterName);
                    if (numMatcher.find()) {
                        try {
                            String rawNum = numMatcher.group(1).replace(",", "").trim();
                            BigDecimal val = new BigDecimal(rawNum).setScale(3, RoundingMode.HALF_UP);
                            LabFlag flag = LabFlag.NORMAL;
                            if (def.refLow != null && val.compareTo(def.refLow) < 0) {
                                flag = LabFlag.LOW;
                            } else if (def.refHigh != null && val.compareTo(def.refHigh) > 0) {
                                flag = LabFlag.HIGH;
                            }

                            LabResult lab = LabResult.builder()
                                    .patient(patient)
                                    .document(document)
                                    .testName(nameMatcher.group(0))
                                    .canonicalTestName(def.canonicalName)
                                    .valueNumber(val)
                                    .unit(def.unit)
                                    .refLow(def.refLow)
                                    .refHigh(def.refHigh)
                                    .flag(flag)
                                    .resultDate(document.getReportDate() != null ? document.getReportDate() : LocalDate.now())
                                    .confidence(new BigDecimal("0.900"))
                                    .verified(false)
                                    .build();

                            results.add(lab);
                        } catch (Exception ignored) {}
                    }
                }
            }
        }

        return results;
    }

    /**
     * Build JSON summary string for document_extractions.structured_json.
     */
    public String buildStructuredJson(List<Medication> meds, List<LabResult> labs) {
        try {
            Map<String, Object> map = new HashMap<>();
            List<Map<String, Object>> medList = meds.stream().map(m -> {
                Map<String, Object> item = new HashMap<>();
                item.put("name", m.getName());
                item.put("dosage", m.getDosage());
                item.put("frequency", m.getFrequency());
                item.put("duration", m.getDuration());
                return item;
            }).toList();

            List<Map<String, Object>> labList = labs.stream().map(l -> {
                Map<String, Object> item = new HashMap<>();
                item.put("test", l.getCanonicalTestName());
                item.put("value", l.getValueNumber());
                item.put("unit", l.getUnit());
                item.put("flag", l.getFlag().name());
                return item;
            }).toList();

            map.put("medications", medList);
            map.put("labResults", labList);
            map.put("extractedCount", medList.size() + labList.size());
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            return "{}";
        }
    }

    private String normalizeFrequency(String raw) {
        String clean = raw.trim().toUpperCase();
        return switch (clean) {
            case "1-0-1", "BD", "B.D.", "BID", "B.I.D." -> "Twice daily";
            case "1-1-1", "TDS", "T.D.S.", "TID", "T.I.D." -> "Three times daily";
            case "1-0-0" -> "Once daily (Morning)";
            case "0-0-1" -> "Once daily (Night)";
            case "OD", "O.D." -> "Once daily";
            case "SOS", "S.O.S." -> "As needed (SOS)";
            default -> raw.trim();
        };
    }

    private String capitalize(String str) {
        if (str == null || str.isBlank()) return str;
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }

    private record LabTestDefinition(
            String canonicalName,
            String regex,
            String unit,
            BigDecimal refLow,
            BigDecimal refHigh
    ) {}
}
