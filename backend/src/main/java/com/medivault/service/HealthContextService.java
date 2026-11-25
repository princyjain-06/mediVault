package com.medivault.service;

import com.medivault.model.*;
import com.medivault.model.enums.LabFlag;
import com.medivault.repository.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Period;
import java.util.*;

/**
 * HealthContextService builds a compact, reference-indexed health history string
 * (~3,000 chars max) for the logged-in patient so the AI can cite exact records
 * (A1, C1, M1, L1, T1, D1) and Java can resolve them back to real database rows.
 */
@Service
@RequiredArgsConstructor
public class HealthContextService {

    private static final int MAX_HISTORY_CHARS = 3000;

    private final AllergyRepository allergyRepository;
    private final ConditionRepository conditionRepository;
    private final MedicationRepository medicationRepository;
    private final LabResultRepository labResultRepository;
    private final MedicalDocumentRepository documentRepository;

    public enum SourceType {
        LAB_RESULT,
        MEDICATION,
        ALLERGY,
        CONDITION,
        DOCUMENT
    }

    @Data
    @Builder
    @AllArgsConstructor
    public static class SourceRef {
        private String refId;
        private String label;
        private SourceType type;
        private String rowId;
        private String documentId;
    }

    @Data
    @Builder
    @AllArgsConstructor
    public static class HealthContextResult {
        private String historyText;
        private Map<String, SourceRef> sourceMap;
    }

    @Transactional(readOnly = true)
    public HealthContextResult buildContext(Patient patient) {
        if (patient == null) {
            return HealthContextResult.builder()
                    .historyText("No medical history available yet.")
                    .sourceMap(Collections.emptyMap())
                    .build();
        }

        Map<String, SourceRef> sourceMap = new LinkedHashMap<>();
        List<String> sections = new ArrayList<>();

        // 1. Profile summary (age from DOB, gender, blood group)
        List<String> profileParts = new ArrayList<>();
        if (patient.getDateOfBirth() != null) {
            int age = Period.between(patient.getDateOfBirth(), LocalDate.now()).getYears();
            if (age >= 0 && age <= 130) {
                profileParts.add("Age " + age);
            }
        }
        if (patient.getGender() != null && !patient.getGender().isBlank()) {
            profileParts.add(patient.getGender().trim());
        }
        if (patient.getBloodGroup() != null && !patient.getBloodGroup().isBlank()) {
            profileParts.add("Blood group " + patient.getBloodGroup().trim());
        }
        if (!profileParts.isEmpty()) {
            sections.add("Profile: " + String.join(", ", profileParts));
        }

        // 2. Allergies [A1, A2...]
        List<Allergy> allergies = allergyRepository.findByPatient_IdOrderByCreatedAtDesc(patient.getId());
        if (!allergies.isEmpty()) {
            StringBuilder sb = new StringBuilder("Allergies:\n");
            int idx = 1;
            for (Allergy a : allergies) {
                String refId = "A" + idx++;
                String reaction = a.getReaction() != null ? ", reaction: " + a.getReaction() : "";
                String sev = a.getSeverity() != null ? " (" + a.getSeverity().name() + ")" : "";
                sb.append("[").append(refId).append("] ").append(a.getAllergen()).append(sev).append(reaction).append("\n");
                sourceMap.put(refId, SourceRef.builder()
                        .refId(refId)
                        .label("Allergy: " + a.getAllergen())
                        .type(SourceType.ALLERGY)
                        .rowId(a.getId())
                        .documentId(a.getDocumentId())
                        .build());
            }
            sections.add(sb.toString().trim());
        }

        // 3. Conditions [C1, C2...]
        List<Condition> conditions = conditionRepository.findByPatient_IdOrderByCreatedAtDesc(patient.getId());
        if (!conditions.isEmpty()) {
            StringBuilder sb = new StringBuilder("Conditions:\n");
            int idx = 1;
            for (Condition c : conditions) {
                String refId = "C" + idx++;
                String status = c.getStatus() != null ? " (" + c.getStatus().name() + ")" : "";
                String date = c.getDiagnosedDate() != null ? ", diagnosed " + c.getDiagnosedDate() : "";
                sb.append("[").append(refId).append("] ").append(c.getName()).append(status).append(date).append("\n");
                sourceMap.put(refId, SourceRef.builder()
                        .refId(refId)
                        .label("Condition: " + c.getName())
                        .type(SourceType.CONDITION)
                        .rowId(c.getId())
                        .documentId(c.getDocumentId())
                        .build());
            }
            sections.add(sb.toString().trim());
        }

        // 4. Current medicines [M1...]: prescribed in last 90 days
        LocalDate ninetyDaysAgo = LocalDate.now().minusDays(90);
        List<Medication> allMeds = medicationRepository.findByPatient_IdOrderByPrescribedDateDesc(patient.getId());
        List<Medication> recentMeds = allMeds.stream()
                .filter(m -> m.getPrescribedDate() == null || !m.getPrescribedDate().isBefore(ninetyDaysAgo))
                .toList();
        if (!recentMeds.isEmpty()) {
            StringBuilder sb = new StringBuilder("Current Medicines (last 90 days):\n");
            int idx = 1;
            for (Medication m : recentMeds) {
                String refId = "M" + idx++;
                String dosage = m.getDosage() != null ? " " + m.getDosage() : "";
                String freq = m.getFrequency() != null ? ", " + m.getFrequency() : "";
                String dur = m.getDuration() != null ? ", for " + m.getDuration() : "";
                String date = m.getPrescribedDate() != null ? " (" + m.getPrescribedDate() + ")" : "";
                sb.append("[").append(refId).append("] ").append(m.getName()).append(dosage).append(freq).append(dur).append(date).append("\n");
                sourceMap.put(refId, SourceRef.builder()
                        .refId(refId)
                        .label(m.getName() + dosage)
                        .type(SourceType.MEDICATION)
                        .rowId(m.getId())
                        .documentId(m.getDocument() != null ? m.getDocument().getId() : null)
                        .build());
            }
            sections.add(sb.toString().trim());
        }

        // 5. Abnormal lab results [L1...]: latest value of each canonical test flagged HIGH or LOW in last 12 months
        LocalDate twelveMonthsAgo = LocalDate.now().minusMonths(12);
        List<LabResult> allLabs = labResultRepository.findByPatient_IdOrderByResultDateDesc(patient.getId());
        Map<String, LabResult> latestByCanonical = new LinkedHashMap<>();
        for (LabResult lab : allLabs) {
            if (lab.getCanonicalTestName() == null) continue;
            latestByCanonical.putIfAbsent(lab.getCanonicalTestName().toLowerCase(), lab);
        }

        List<LabResult> abnormalLatest = latestByCanonical.values().stream()
                .filter(l -> (l.getFlag() == LabFlag.HIGH || l.getFlag() == LabFlag.LOW))
                .filter(l -> l.getResultDate() == null || !l.getResultDate().isBefore(twelveMonthsAgo))
                .toList();

        if (!abnormalLatest.isEmpty()) {
            StringBuilder sb = new StringBuilder("Abnormal Lab Results (last 12 months):\n");
            int idx = 1;
            for (LabResult l : abnormalLatest) {
                String refId = "L" + idx++;
                String val = l.getValueNumber() != null ? l.getValueNumber().stripTrailingZeros().toPlainString()
                        : (l.getValueText() != null ? l.getValueText() : "?");
                String unit = l.getUnit() != null ? " " + l.getUnit() : "";
                String range = formatRange(l.getRefLow(), l.getRefHigh());
                String date = l.getResultDate() != null ? " on " + l.getResultDate() : "";
                sb.append("[").append(refId).append("] ").append(l.getCanonicalTestName())
                        .append(": ").append(val).append(unit)
                        .append(" (").append(l.getFlag().name())
                        .append(range.isEmpty() ? "" : ", ref " + range)
                        .append(")").append(date).append("\n");
                sourceMap.put(refId, SourceRef.builder()
                        .refId(refId)
                        .label(l.getCanonicalTestName() + " " + val + unit + " (" + l.getFlag().name() + ")")
                        .type(SourceType.LAB_RESULT)
                        .rowId(l.getId())
                        .documentId(l.getDocument() != null ? l.getDocument().getId() : null)
                        .build());
            }
            sections.add(sb.toString().trim());
        }

        // 6. Trends [T1...]: for canonical tests with 2+ numeric values, first and latest with direction
        Map<String, List<LabResult>> groupedByTest = new LinkedHashMap<>();
        for (LabResult l : allLabs) {
            if (l.getCanonicalTestName() == null || l.getValueNumber() == null) continue;
            groupedByTest.computeIfAbsent(l.getCanonicalTestName(), k -> new ArrayList<>()).add(l);
        }

        List<String> trendLines = new ArrayList<>();
        int tIdx = 1;
        for (Map.Entry<String, List<LabResult>> entry : groupedByTest.entrySet()) {
            List<LabResult> list = entry.getValue();
            if (list.size() < 2) continue;
            // allLabs is sorted desc by resultDate: index 0 is latest, last is earliest
            LabResult latest = list.get(0);
            LabResult first = list.get(list.size() - 1);
            String refId = "T" + tIdx++;

            String firstVal = first.getValueNumber().stripTrailingZeros().toPlainString();
            String latestVal = latest.getValueNumber().stripTrailingZeros().toPlainString();
            String unit = latest.getUnit() != null ? " " + latest.getUnit() : "";
            int cmp = latest.getValueNumber().compareTo(first.getValueNumber());
            String direction = cmp > 0 ? "rising" : (cmp < 0 ? "falling" : "stable");

            String firstDate = first.getResultDate() != null ? first.getResultDate().toString() : "earlier";
            String latestDate = latest.getResultDate() != null ? latest.getResultDate().toString() : "latest";

            trendLines.add("[" + refId + "] " + entry.getKey() + " " + firstVal + " (" + firstDate + ") -> "
                    + latestVal + unit + " (" + latestDate + "), " + direction);
            sourceMap.put(refId, SourceRef.builder()
                    .refId(refId)
                    .label(entry.getKey() + " trend (" + direction + ")")
                    .type(SourceType.LAB_RESULT)
                    .rowId(latest.getId())
                    .documentId(latest.getDocument() != null ? latest.getDocument().getId() : null)
                    .build());
        }
        if (!trendLines.isEmpty()) {
            sections.add("Lab Trends:\n" + String.join("\n", trendLines));
        }

        // 7. Recent documents [D1...]: last 5 documents
        List<MedicalDocument> docs = documentRepository.findByPatient_IdOrderByUploadedAtDesc(patient.getId());
        if (!docs.isEmpty()) {
            StringBuilder sb = new StringBuilder("Recent Documents:\n");
            int idx = 1;
            for (MedicalDocument d : docs.stream().limit(5).toList()) {
                String refId = "D" + idx++;
                String date = d.getReportDate() != null ? d.getReportDate().toString() : d.getUploadedAt().toLocalDate().toString();
                String summary = d.getSummary() != null && !d.getSummary().isBlank()
                        ? " - " + truncate(d.getSummary().replaceAll("\\s+", " ").trim(), 180)
                        : "";
                sb.append("[").append(refId).append("] ").append(d.getTitle())
                        .append(" (").append(d.getDocumentType()).append(", ").append(date).append(")")
                        .append(summary).append("\n");
                sourceMap.put(refId, SourceRef.builder()
                        .refId(refId)
                        .label(d.getTitle())
                        .type(SourceType.DOCUMENT)
                        .rowId(d.getId())
                        .documentId(d.getId())
                        .build());
            }
            sections.add(sb.toString().trim());
        }

        if (sections.isEmpty()) {
            return HealthContextResult.builder()
                    .historyText("No medical history available yet.")
                    .sourceMap(sourceMap)
                    .build();
        }

        // Build final text strictly bounded to ~3,000 characters
        StringBuilder finalHistory = new StringBuilder();
        for (String section : sections) {
            if (finalHistory.length() + section.length() + 2 > MAX_HISTORY_CHARS) {
                int remaining = MAX_HISTORY_CHARS - finalHistory.length() - 2;
                if (remaining > 40) {
                    if (finalHistory.length() > 0) finalHistory.append("\n\n");
                    finalHistory.append(section, 0, remaining - 3).append("...");
                }
                break;
            }
            if (finalHistory.length() > 0) finalHistory.append("\n\n");
            finalHistory.append(section);
        }

        return HealthContextResult.builder()
                .historyText(finalHistory.toString())
                .sourceMap(sourceMap)
                .build();
    }

    private String formatRange(BigDecimal low, BigDecimal high) {
        if (low != null && high != null) {
            return low.stripTrailingZeros().toPlainString() + "-" + high.stripTrailingZeros().toPlainString();
        }
        if (low != null) {
            return ">" + low.stripTrailingZeros().toPlainString();
        }
        if (high != null) {
            return "<" + high.stripTrailingZeros().toPlainString();
        }
        return "";
    }

    private String truncate(String s, int max) {
        return s.length() <= max ? s : s.substring(0, max - 3) + "...";
    }
}
