package com.medivault.service;

import com.medivault.dto.gemini.GeminiExtractionResponse.GeminiLabResultItem;
import com.medivault.model.LabResult;
import com.medivault.model.MedicalDocument;
import com.medivault.model.Patient;
import com.medivault.model.enums.LabFlag;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class ClinicalDataCleanerTest {

    private ClinicalDataCleaner cleaner;
    private Patient testPatient;
    private MedicalDocument testDoc;

    @BeforeEach
    void setUp() {
        cleaner = new ClinicalDataCleaner();
        testPatient = Patient.builder().id("pat-test-1").name("Test Patient").build();
        testDoc = MedicalDocument.builder().id("doc-test-1").patient(testPatient).reportDate(LocalDate.now()).build();
    }

    // ───────────────────────────────────────────────────────────────────
    //  1. Number Parsing Tests
    // ───────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Parse thousands comma numbers e.g. 7,200 -> 7200.000")
    void testParseNumberWithComma() {
        ClinicalDataCleaner.ValueParseResult result = cleaner.parseValue("7,200");
        assertNotNull(result.getNumber());
        assertEquals(0, new BigDecimal("7200.000").compareTo(result.getNumber()));
        assertNull(result.getText());

        // Platelet count format: 2,85,000
        ClinicalDataCleaner.ValueParseResult result2 = cleaner.parseValue("2,85,000");
        assertNotNull(result2.getNumber());
        assertEquals(0, new BigDecimal("285000.000").compareTo(result2.getNumber()));
    }

    @Test
    @DisplayName("Parse scientific exponent notation e.g. 7.2 x 10^3 -> 7200.000")
    void testParseScientificNotation() {
        ClinicalDataCleaner.ValueParseResult result1 = cleaner.parseValue("7.2 x 10^3");
        assertNotNull(result1.getNumber());
        assertEquals(0, new BigDecimal("7200.000").compareTo(result1.getNumber()));

        ClinicalDataCleaner.ValueParseResult result2 = cleaner.parseValue("7.2 x10³");
        assertNotNull(result2.getNumber());
        assertEquals(0, new BigDecimal("7200.000").compareTo(result2.getNumber()));

        ClinicalDataCleaner.ValueParseResult result3 = cleaner.parseValue("7.2*10^3");
        assertNotNull(result3.getNumber());
        assertEquals(0, new BigDecimal("7200.000").compareTo(result3.getNumber()));
    }

    @Test
    @DisplayName("Keep non-numeric results like 'Negative' or 'Reactive' in value_text")
    void testParseNonNumericValue() {
        ClinicalDataCleaner.ValueParseResult result = cleaner.parseValue("Negative");
        assertNull(result.getNumber());
        assertEquals("Negative", result.getText());

        ClinicalDataCleaner.ValueParseResult result2 = cleaner.parseValue("Non-Reactive");
        assertNull(result2.getNumber());
        assertEquals("Non-Reactive", result2.getText());
    }

    // ───────────────────────────────────────────────────────────────────
    //  2. Reference Range Parsing Tests
    // ───────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Parse reference ranges: 12.0 - 15.5, < 200, > 40, 70-100 mg/dL")
    void testParseRefRanges() {
        // Two-sided range
        ClinicalDataCleaner.RefRangeResult r1 = cleaner.parseRefRange("12.0 - 15.5");
        assertNotNull(r1.getRefLow());
        assertNotNull(r1.getRefHigh());
        assertEquals(0, new BigDecimal("12.000").compareTo(r1.getRefLow()));
        assertEquals(0, new BigDecimal("15.500").compareTo(r1.getRefHigh()));

        // Range with units stripped: 70-100 mg/dL
        ClinicalDataCleaner.RefRangeResult r2 = cleaner.parseRefRange("70-100 mg/dL");
        assertEquals(0, new BigDecimal("70.000").compareTo(r2.getRefLow()));
        assertEquals(0, new BigDecimal("100.000").compareTo(r2.getRefHigh()));

        // Upper bound only: < 200
        ClinicalDataCleaner.RefRangeResult r3 = cleaner.parseRefRange("< 200");
        assertNull(r3.getRefLow());
        assertNotNull(r3.getRefHigh());
        assertEquals(0, new BigDecimal("200.000").compareTo(r3.getRefHigh()));

        // Lower bound only: > 40
        ClinicalDataCleaner.RefRangeResult r4 = cleaner.parseRefRange("> 40");
        assertNotNull(r4.getRefLow());
        assertNull(r4.getRefHigh());
        assertEquals(0, new BigDecimal("40.000").compareTo(r4.getRefLow()));
    }

    // ───────────────────────────────────────────────────────────────────
    //  3. Flag Calculation Tests
    // ───────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Calculate flag correctly: LOW, HIGH, NORMAL, UNKNOWN")
    void testCalculateFlag() {
        BigDecimal low = new BigDecimal("12.000");
        BigDecimal high = new BigDecimal("17.500");

        // Below ref_low -> LOW
        assertEquals(LabFlag.LOW, cleaner.calculateFlag(new BigDecimal("10.500"), low, high));

        // Above ref_high -> HIGH
        assertEquals(LabFlag.HIGH, cleaner.calculateFlag(new BigDecimal("18.200"), low, high));

        // In range -> NORMAL
        assertEquals(LabFlag.NORMAL, cleaner.calculateFlag(new BigDecimal("14.500"), low, high));

        // Upper bound only (< 200): 180 is NORMAL, 220 is HIGH
        assertEquals(LabFlag.NORMAL, cleaner.calculateFlag(new BigDecimal("180.000"), null, new BigDecimal("200.000")));
        assertEquals(LabFlag.HIGH, cleaner.calculateFlag(new BigDecimal("220.000"), null, new BigDecimal("200.000")));

        // No range -> UNKNOWN
        assertEquals(LabFlag.UNKNOWN, cleaner.calculateFlag(new BigDecimal("15.000"), null, null));

        // Non-numeric value -> UNKNOWN
        assertEquals(LabFlag.UNKNOWN, cleaner.calculateFlag(null, low, high));
    }

    // ───────────────────────────────────────────────────────────────────
    //  4. Canonical Test Name & Synonym Tests
    // ───────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Canonicalize synonyms like 'FBS (Plasma)' and 'Glucose - Fasting' -> 'Fasting Blood Sugar'")
    void testCanonicalAliases() {
        assertEquals("Fasting Blood Sugar", cleaner.resolveCanonicalName("FBS (Plasma)", "Fasting Blood Sugar"));
        assertEquals("Fasting Blood Sugar", cleaner.resolveCanonicalName("Glucose - Fasting", "Glucose"));
        assertEquals("Fasting Blood Sugar", cleaner.resolveCanonicalName("Fasting Blood Glucose", null));
        assertEquals("Total WBC Count", cleaner.resolveCanonicalName("TLC", null));
        assertEquals("Total WBC Count", cleaner.resolveCanonicalName("Total Leukocyte Count", null));
        assertEquals("SGPT / ALT", cleaner.resolveCanonicalName("ALT (SGPT)", null));
        assertEquals("Total Bilirubin", cleaner.resolveCanonicalName("Bilirubin Total", null));
    }

    // ───────────────────────────────────────────────────────────────────
    //  5. Comprehensive 30+ Test Sample Report Extraction Test
    // ───────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Clean and verify a 32-test comprehensive panel (CBC + Lipids + LFT + KFT + Glucose)")
    void testComprehensive32TestReport() {
        List<GeminiLabResultItem> rawItems = new ArrayList<>();

        // CBC Panel (14 tests)
        rawItems.add(new GeminiLabResultItem("Hemoglobin", "Hemoglobin", "14.2", "g/dL", "12.0 - 17.5", 1));
        rawItems.add(new GeminiLabResultItem("Total WBC Count", "WBC", "7,200", "cells/mcL", "4000 - 11000", 1));
        rawItems.add(new GeminiLabResultItem("RBC Count", "RBC", "4.8 x 10^6", "mil/mcL", "4.5 - 5.9", 1));
        rawItems.add(new GeminiLabResultItem("Packed Cell Volume (PCV)", "Hematocrit", "42.5", "%", "40 - 50", 1));
        rawItems.add(new GeminiLabResultItem("MCV", "MCV", "88.0", "fL", "80 - 100", 1));
        rawItems.add(new GeminiLabResultItem("MCH", "MCH", "29.5", "pg", "27 - 33", 1));
        rawItems.add(new GeminiLabResultItem("MCHC", "MCHC", "33.2", "g/dL", "32 - 36", 1));
        rawItems.add(new GeminiLabResultItem("RDW", "RDW", "12.8", "%", "11.5 - 14.5", 1));
        rawItems.add(new GeminiLabResultItem("Platelet Count", "Platelets", "2,85,000", "/cumm", "150000 - 450000", 1));
        rawItems.add(new GeminiLabResultItem("Neutrophils", "Neutrophils", "62", "%", "40 - 75", 1));
        rawItems.add(new GeminiLabResultItem("Lymphocytes", "Lymphocytes", "30", "%", "20 - 45", 1));
        rawItems.add(new GeminiLabResultItem("Monocytes", "Monocytes", "5", "%", "2 - 10", 1));
        rawItems.add(new GeminiLabResultItem("Eosinophils", "Eosinophils", "2.5", "%", "1 - 6", 1));
        rawItems.add(new GeminiLabResultItem("Basophils", "Basophils", "0.5", "%", "0 - 1", 1));

        // Glucose & HbA1c (with synonyms!) (2 tests)
        rawItems.add(new GeminiLabResultItem("FBS (Plasma)", "Fasting Glucose", "95.0", "mg/dL", "70 - 100", 1));
        rawItems.add(new GeminiLabResultItem("HbA1c", "HbA1c", "5.4", "%", "4.0 - 5.6", 1));

        // Lipid Profile (6 tests)
        rawItems.add(new GeminiLabResultItem("Total Cholesterol", "Total Cholesterol", "185", "mg/dL", "< 200", 2));
        rawItems.add(new GeminiLabResultItem("HDL Cholesterol", "HDL", "48", "mg/dL", "> 40", 2));
        rawItems.add(new GeminiLabResultItem("LDL Cholesterol", "LDL", "112", "mg/dL", "< 100", 2)); // High
        rawItems.add(new GeminiLabResultItem("Triglycerides", "Triglycerides", "138", "mg/dL", "< 150", 2));
        rawItems.add(new GeminiLabResultItem("VLDL Cholesterol", "VLDL", "25", "mg/dL", "< 30", 2));
        rawItems.add(new GeminiLabResultItem("TC/HDL Ratio", "TC/HDL", "3.8", "ratio", "< 4.5", 2));

        // Liver Function Tests (LFT) (6 tests)
        rawItems.add(new GeminiLabResultItem("Total Bilirubin", "Bilirubin", "0.85", "mg/dL", "0.2 - 1.2", 2));
        rawItems.add(new GeminiLabResultItem("Direct Bilirubin", "Conjugated Bilirubin", "0.20", "mg/dL", "< 0.3", 2));
        rawItems.add(new GeminiLabResultItem("SGPT / ALT", "ALT", "28", "U/L", "< 45", 2));
        rawItems.add(new GeminiLabResultItem("SGOT / AST", "AST", "24", "U/L", "< 40", 2));
        rawItems.add(new GeminiLabResultItem("Alkaline Phosphatase", "ALP", "95", "U/L", "30 - 120", 2));
        rawItems.add(new GeminiLabResultItem("Total Protein", "Total Protein", "7.2", "g/dL", "6.0 - 8.3", 2));

        // Kidney Function Tests (KFT) (4 tests)
        rawItems.add(new GeminiLabResultItem("Serum Creatinine", "Creatinine", "0.92", "mg/dL", "0.6 - 1.3", 2));
        rawItems.add(new GeminiLabResultItem("Blood Urea Nitrogen", "BUN", "16.5", "mg/dL", "7 - 20", 2));
        rawItems.add(new GeminiLabResultItem("Uric Acid", "Uric Acid", "5.1", "mg/dL", "3.5 - 7.2", 2));
        rawItems.add(new GeminiLabResultItem("Serum Calcium", "Calcium", "9.6", "mg/dL", "8.5 - 10.5", 2));

        assertEquals(32, rawItems.size(), "Input sample report must have at least 30 tests");

        // Clean through Java cleaner
        List<LabResult> cleaned = cleaner.cleanLabResults(rawItems, testPatient, testDoc, LocalDate.of(2026, 11, 23));

        // Verify every test was cleaned and none were dropped
        assertEquals(32, cleaned.size(), "All 32 tests must be cleanly parsed and preserved");

        // Verify specific values:
        // 1. WBC Count: 7,200 parsed as 7200.000
        LabResult wbc = cleaned.stream().filter(l -> l.getCanonicalTestName().equals("Total WBC Count")).findFirst().orElseThrow();
        assertEquals(0, new BigDecimal("7200.000").compareTo(wbc.getValueNumber()));
        assertEquals(LabFlag.NORMAL, wbc.getFlag());

        // 2. FBS (Plasma) synonym mapped to Fasting Blood Sugar
        LabResult fbs = cleaned.stream().filter(l -> l.getCanonicalTestName().equals("Fasting Blood Sugar")).findFirst().orElseThrow();
        assertEquals(0, new BigDecimal("95.000").compareTo(fbs.getValueNumber()));
        assertEquals(LabFlag.NORMAL, fbs.getFlag());

        // 3. LDL Cholesterol: 112 with range < 100 should be HIGH
        LabResult ldl = cleaned.stream().filter(l -> l.getCanonicalTestName().equals("LDL Cholesterol")).findFirst().orElseThrow();
        assertEquals(LabFlag.HIGH, ldl.getFlag());

        // 4. Platelet count: 2,85,000 parsed as 285000.000
        LabResult plt = cleaned.stream().filter(l -> l.getCanonicalTestName().equals("Platelet Count")).findFirst().orElseThrow();
        assertEquals(0, new BigDecimal("285000.000").compareTo(plt.getValueNumber()));
        assertEquals(LabFlag.NORMAL, plt.getFlag());
    }
}
