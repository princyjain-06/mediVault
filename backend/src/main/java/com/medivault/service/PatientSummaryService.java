package com.medivault.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medivault.dto.PatientRecordSummaryResponse;
import com.medivault.model.*;
import com.medivault.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class PatientSummaryService {

    private final PatientService patientService;
    private final MedicalDocumentRepository documentRepository;
    private final ConditionRepository conditionRepository;
    private final AllergyRepository allergyRepository;
    private final MedicationRepository medicationRepository;
    private final LabResultRepository labResultRepository;
    private final GeminiClient geminiClient;
    private final PdfSummaryGenerator pdfSummaryGenerator;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public PatientRecordSummaryResponse generateSummary(String email) {
        Patient patient = patientService.getPatientByEmail(email);

        List<MedicalDocument> documents = documentRepository.findByPatient_IdOrderByUploadedAtDesc(patient.getId());
        List<Condition> conditions = conditionRepository.findByPatient_IdOrderByCreatedAtDesc(patient.getId());
        List<Allergy> allergies = allergyRepository.findByPatient_IdOrderByCreatedAtDesc(patient.getId());
        List<Medication> medications = medicationRepository.findByPatient_IdOrderByPrescribedDateDesc(patient.getId());
        List<LabResult> labResults = labResultRepository.findByPatient_IdOrderByResultDateDesc(patient.getId());

        String ageAndGender = computeAgeAndGender(patient);
        String bloodGroup = patient.getBloodGroup() != null ? patient.getBloodGroup() : "Not Recorded";
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("dd MMM yyyy"));

        // If no documents and records exist, return clean empty summary
        if (documents.isEmpty() && conditions.isEmpty() && allergies.isEmpty() && medications.isEmpty() && labResults.isEmpty()) {
            return PatientRecordSummaryResponse.builder()
                    .patientName(patient.getName())
                    .ageAndGender(ageAndGender)
                    .bloodGroup(bloodGroup)
                    .generatedDate(dateStr)
                    .executiveSummary("No medical documents or health records have been uploaded to MediVault yet. Upload medical reports, prescriptions, or lab results to generate an AI-powered longitudinal summary.")
                    .chronicConditions(List.of("No conditions documented"))
                    .activeMedications(List.of("No medications logged"))
                    .criticalAllergies(List.of("No known drug or environmental allergies documented"))
                    .notableLabFindings(List.of("No laboratory results on file"))
                    .clinicalRecommendations(List.of("Upload prior health records to enable comprehensive clinical synthesis."))
                    .totalDocumentsAnalyzed(0)
                    .aiGenerated(false)
                    .build();
        }

        // Try AI summarization with Gemini
        if (geminiClient.isConfigured()) {
            try {
                String promptContext = buildClinicalContext(patient, documents, conditions, allergies, medications, labResults);
                String systemInstruction = """
                        You are a Board-Certified Consultant Physician and Medical Director creating a concise, high-yield 1-2 page Longitudinal Patient Health Summary.
                        Your output MUST be a valid JSON object matching this schema:
                        {
                          "executiveSummary": "2-3 cohesive clinical paragraphs synthesizing the patient's longitudinal health trajectory, key diagnoses, treatments, lab trends, and current clinical status.",
                          "chronicConditions": ["Condition name - status, clinical significance"],
                          "activeMedications": ["Medicine dosage frequency - clinical rationale"],
                          "criticalAllergies": ["Allergen - reaction, severity"],
                          "notableLabFindings": ["Test name: value unit (flag) - trend and clinical interpretation"],
                          "clinicalRecommendations": ["Evidence-based preventive recommendations, lifestyle guidance, or discussion points for doctor"]
                        }
                        Be clinically accurate, professional, concise, and highlight any abnormal values or alerts.
                        """;

                String json = geminiClient.generateJson(systemInstruction, promptContext, 0.2);
                JsonNode root = objectMapper.readTree(json);

                List<String> condList = extractStringList(root.path("chronicConditions"));
                List<String> medList = extractStringList(root.path("activeMedications"));
                List<String> algList = extractStringList(root.path("criticalAllergies"));
                List<String> labList = extractStringList(root.path("notableLabFindings"));
                List<String> recList = extractStringList(root.path("clinicalRecommendations"));

                return PatientRecordSummaryResponse.builder()
                        .patientName(patient.getName())
                        .ageAndGender(ageAndGender)
                        .bloodGroup(bloodGroup)
                        .generatedDate(dateStr)
                        .executiveSummary(root.path("executiveSummary").asText("Clinical health summary synthesized successfully."))
                        .chronicConditions(condList.isEmpty() ? buildDefaultConditions(conditions) : condList)
                        .activeMedications(medList.isEmpty() ? buildDefaultMedications(medications) : medList)
                        .criticalAllergies(algList.isEmpty() ? buildDefaultAllergies(allergies) : algList)
                        .notableLabFindings(labList.isEmpty() ? buildDefaultLabs(labResults) : labList)
                        .clinicalRecommendations(recList.isEmpty() ? List.of("Continue routine preventive follow-ups with primary care clinician.") : recList)
                        .totalDocumentsAnalyzed(documents.size())
                        .aiGenerated(true)
                        .build();
            } catch (Exception e) {
                log.warn("Gemini AI longitudinal summarization failed for patient {}: {}. Falling back to deterministic summary.", patient.getId(), e.getMessage());
            }
        }

        // Deterministic Fallback Synthesis
        return buildDeterministicSummary(patient, documents, conditions, allergies, medications, labResults, ageAndGender, bloodGroup, dateStr);
    }

    @Transactional(readOnly = true)
    public byte[] generateSummaryPdf(String email) {
        PatientRecordSummaryResponse summary = generateSummary(email);
        return pdfSummaryGenerator.generatePdf(summary);
    }

    private String buildClinicalContext(
            Patient patient,
            List<MedicalDocument> documents,
            List<Condition> conditions,
            List<Allergy> allergies,
            List<Medication> medications,
            List<LabResult> labResults
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append("PATIENT PROFILE: ").append(patient.getName())
                .append(", DOB: ").append(patient.getDateOfBirth() != null ? patient.getDateOfBirth() : "Unknown")
                .append(", Gender: ").append(patient.getGender() != null ? patient.getGender() : "Unknown")
                .append(", Blood: ").append(patient.getBloodGroup() != null ? patient.getBloodGroup() : "Unknown")
                .append("\n\n");

        sb.append("TOTAL DOCUMENTS UPLOADED: ").append(documents.size()).append("\n");
        for (MedicalDocument doc : documents) {
            sb.append("- ").append(doc.getTitle())
                    .append(" (").append(doc.getDocumentType()).append(", ")
                    .append(doc.getReportDate() != null ? doc.getReportDate() : "Date N/A").append("): ")
                    .append(doc.getSummary() != null ? doc.getSummary() : "No document summary")
                    .append("\n");
        }
        sb.append("\n");

        sb.append("RECORDED CONDITIONS:\n");
        if (conditions.isEmpty()) sb.append("None documented.\n");
        for (Condition c : conditions) {
            sb.append("- ").append(c.getName()).append(" (Status: ").append(c.getStatus()).append(")\n");
        }
        sb.append("\n");

        sb.append("ALLERGIES:\n");
        if (allergies.isEmpty()) sb.append("None documented.\n");
        for (Allergy a : allergies) {
            sb.append("- ").append(a.getAllergen()).append(" (Reaction: ").append(a.getReaction()).append(", Severity: ").append(a.getSeverity()).append(")\n");
        }
        sb.append("\n");

        sb.append("MEDICATIONS:\n");
        if (medications.isEmpty()) sb.append("None documented.\n");
        for (Medication m : medications) {
            sb.append("- ").append(m.getName()).append(" ").append(m.getDosage() != null ? m.getDosage() : "")
                    .append(" (").append(m.getFrequency() != null ? m.getFrequency() : "").append(")\n");
        }
        sb.append("\n");

        sb.append("LABORATORY RESULTS:\n");
        if (labResults.isEmpty()) sb.append("None documented.\n");
        for (LabResult l : labResults) {
            sb.append("- ").append(l.getTestName()).append(": ").append(l.getValueNumber() != null ? l.getValueNumber() : l.getValueText())
                    .append(" ").append(l.getUnit() != null ? l.getUnit() : "")
                    .append(" [Flag: ").append(l.getFlag()).append(", Ref: ")
                    .append(l.getRefLow() != null ? l.getRefLow() : "").append("-")
                    .append(l.getRefHigh() != null ? l.getRefHigh() : "").append("]\n");
        }

        return sb.toString();
    }

    private PatientRecordSummaryResponse buildDeterministicSummary(
            Patient patient,
            List<MedicalDocument> documents,
            List<Condition> conditions,
            List<Allergy> allergies,
            List<Medication> medications,
            List<LabResult> labResults,
            String ageAndGender,
            String bloodGroup,
            String dateStr
    ) {
        StringBuilder exec = new StringBuilder();
        exec.append("Comprehensive health summary for ").append(patient.getName()).append(". ");
        exec.append("Synthesizing ").append(documents.size()).append(" clinical document(s), ");
        exec.append(labResults.size()).append(" laboratory result(s), and ");
        exec.append(medications.size()).append(" recorded medication(s). ");

        long abnormalLabs = labResults.stream().filter(l -> l.getFlag() != null && (l.getFlag().name().equals("HIGH") || l.getFlag().name().equals("LOW"))).count();
        if (abnormalLabs > 0) {
            exec.append("Identified ").append(abnormalLabs).append(" out-of-range lab indicator(s) requiring attention. ");
        } else {
            exec.append("All recorded laboratory indicators are within expected reference intervals. ");
        }

        if (!allergies.isEmpty()) {
            exec.append("Patient has ").append(allergies.size()).append(" documented clinical allergy alert(s). ");
        }

        return PatientRecordSummaryResponse.builder()
                .patientName(patient.getName())
                .ageAndGender(ageAndGender)
                .bloodGroup(bloodGroup)
                .generatedDate(dateStr)
                .executiveSummary(exec.toString())
                .chronicConditions(buildDefaultConditions(conditions))
                .activeMedications(buildDefaultMedications(medications))
                .criticalAllergies(buildDefaultAllergies(allergies))
                .notableLabFindings(buildDefaultLabs(labResults))
                .clinicalRecommendations(List.of(
                        "Maintain adherence to active medication regimens and scheduled monitoring.",
                        "Discuss abnormal lab trends with primary care clinician during next visit.",
                        "Keep allergy notifications visible during clinical visits and emergency consultations."
                ))
                .totalDocumentsAnalyzed(documents.size())
                .aiGenerated(false)
                .build();
    }

    private List<String> buildDefaultConditions(List<Condition> conditions) {
        if (conditions == null || conditions.isEmpty()) return List.of("No chronic conditions currently documented");
        List<String> list = new ArrayList<>();
        for (Condition c : conditions) {
            list.add(c.getName() + " (Status: " + c.getStatus() + ")");
        }
        return list;
    }

    private List<String> buildDefaultMedications(List<Medication> medications) {
        if (medications == null || medications.isEmpty()) return List.of("No active medications logged");
        List<String> list = new ArrayList<>();
        for (Medication m : medications) {
            String details = m.getName() +
                    (m.getDosage() != null ? " " + m.getDosage() : "") +
                    (m.getFrequency() != null ? " (" + m.getFrequency() + ")" : "");
            list.add(details);
        }
        return list;
    }

    private List<String> buildDefaultAllergies(List<Allergy> allergies) {
        if (allergies == null || allergies.isEmpty()) return List.of("No known drug or environmental allergies documented");
        List<String> list = new ArrayList<>();
        for (Allergy a : allergies) {
            list.add(a.getAllergen() + " - " + a.getReaction() + " [Severity: " + a.getSeverity() + "]");
        }
        return list;
    }

    private List<String> buildDefaultLabs(List<LabResult> labs) {
        if (labs == null || labs.isEmpty()) return List.of("No laboratory results on file");
        List<String> list = new ArrayList<>();
        for (LabResult l : labs) {
            String val = l.getValueNumber() != null ? l.getValueNumber().stripTrailingZeros().toPlainString() : l.getValueText();
            String item = l.getTestName() + ": " + val + " " + (l.getUnit() != null ? l.getUnit() : "") +
                    " (" + l.getFlag() + ")";
            list.add(item);
        }
        return list;
    }

    private List<String> extractStringList(JsonNode node) {
        List<String> list = new ArrayList<>();
        if (node != null && node.isArray()) {
            for (JsonNode item : node) {
                if (item.isTextual() && !item.asText().isBlank()) {
                    list.add(item.asText().trim());
                }
            }
        }
        return list;
    }

    private String computeAgeAndGender(Patient p) {
        String gender = p.getGender() != null ? p.getGender() : "Unspecified";
        if (p.getDateOfBirth() != null) {
            int age = Period.between(p.getDateOfBirth(), LocalDate.now()).getYears();
            return age + " yrs / " + gender;
        }
        return gender;
    }
}
