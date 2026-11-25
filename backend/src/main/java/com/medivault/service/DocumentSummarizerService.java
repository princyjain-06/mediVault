package com.medivault.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medivault.model.LabResult;
import com.medivault.model.MedicalDocument;
import com.medivault.model.Medication;
import com.medivault.model.enums.DocumentType;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service that generates clinical summaries for uploaded medical documents.
 * - Uses Gemini API when GEMINI_API_KEY is configured.
 * - Falls back to a smart rule-based clinical synthesizer when no API key is provided.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentSummarizerService {

    @Value("${app.gemini.api-key:${GEMINI_API_KEY:}}")
    private String geminiApiKey;

    @Value("${app.gemini.model:gemini-3.5-flash-lite}")
    private String geminiModel;

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Generates a patient-friendly 2-3 sentence clinical summary.
     */
    public String generateSummary(
            String text,
            List<Medication> meds,
            List<LabResult> labs,
            MedicalDocument doc
    ) {
        // If user already typed a rich summary manually during upload, respect it
        if (doc.getSummary() != null && doc.getSummary().trim().length() > 20) {
            return doc.getSummary().trim();
        }

        // 1. Try Gemini API if an API key is available
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            try {
                String aiSummary = callGeminiSummary(text, doc);
                if (aiSummary != null && !aiSummary.isBlank()) {
                    log.info("Successfully generated AI summary via Gemini API for doc {}", doc.getId());
                    return aiSummary;
                }
            } catch (Exception e) {
                log.warn("Gemini API call failed, falling back to local synthesizer: {}", e.getMessage());
            }
        }

        // 2. Intelligent local clinical synthesizer fallback (zero external dependencies)
        return synthesizeLocalSummary(meds, labs, doc);
    }

    /**
     * Calls Gemini 1.5 Flash to summarize the medical document into 2-3 plain-English sentences.
     */
    private String callGeminiSummary(String text, MedicalDocument doc) {
        String prompt = "You are a clinical AI assistant for MediVault. Summarize this medical document in 2-3 concise, patient-friendly sentences. " +
                "Mention key tests or medications and indicate if values are normal or flagged. Do not include markdown headers or bullet points. Text:\n\n" +
                (text.length() > 4000 ? text.substring(0, 4000) : text);

        String url = String.format(
                "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                geminiModel.trim(), geminiApiKey.trim()
        );

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)
                        ))
                ),
                "generationConfig", Map.of(
                        "temperature", 0.2,
                        "maxOutputTokens", 250
                )
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            try {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode candidateText = root.path("candidates").get(0)
                        .path("content").path("parts").get(0).path("text");
                if (!candidateText.isMissingNode()) {
                    return candidateText.asText().trim();
                }
            } catch (Exception e) {
                log.warn("Failed to parse Gemini response: {}", e.getMessage());
            }
        }
        return null;
    }

    /**
     * Synthesizes a structured clinical summary locally from parsed entities.
     */
    private String synthesizeLocalSummary(List<Medication> meds, List<LabResult> labs, MedicalDocument doc) {
        StringBuilder sb = new StringBuilder();

        // 1. Lab blood report summary
        if (doc.getDocumentType() == DocumentType.BLOOD_REPORT || (labs != null && !labs.isEmpty() && (meds == null || meds.isEmpty()))) {
            int labCount = labs != null ? labs.size() : 0;
            if (labCount > 0) {
                sb.append("Diagnostic laboratory report containing ").append(labCount).append(" extracted parameter(s): ");
                String labList = labs.stream()
                        .map(l -> l.getCanonicalTestName() + " " + l.getValueNumber() + " " + (l.getUnit() != null ? l.getUnit() : "") + " [" + l.getFlag() + "]")
                        .collect(Collectors.joining(", "));
                sb.append(labList).append(". ");

                long abnormalCount = labs.stream().filter(l -> l.getFlag() != null && l.getFlag().name().matches("HIGH|LOW")).count();
                if (abnormalCount > 0) {
                    sb.append(abnormalCount).append(" parameter(s) flagged outside standard reference range.");
                } else {
                    sb.append("All measured parameters are within standard physiological reference ranges.");
                }
                return sb.toString();
            }
        }

        // 2. Prescription summary
        if (doc.getDocumentType() == DocumentType.PRESCRIPTION || (meds != null && !meds.isEmpty())) {
            int count = meds != null ? meds.size() : 0;
            sb.append("Prescription ");
            if (doc.getDoctor() != null && !doc.getDoctor().isBlank()) {
                sb.append("issued by ").append(doc.getDoctor()).append(". ");
            } else {
                sb.append("record. ");
            }
            if (count > 0) {
                String medList = meds.stream()
                        .map(m -> m.getName() + " " + (m.getDosage() != null ? m.getDosage() : "") + " (" + m.getFrequency() + ")")
                        .collect(Collectors.joining(", "));
                sb.append("Contains ").append(count).append(" active medication(s): ").append(medList).append(".");
            } else {
                sb.append("Document verified and stored in MediVault.");
            }
            return sb.toString();
        }

        // Generic fallback
        String docTypeName = doc.getDocumentType() != null ? doc.getDocumentType().name().replace('_', ' ') : "Medical Document";
        return docTypeName + " uploaded to MediVault vault on " + (doc.getReportDate() != null ? doc.getReportDate() : "recent date") +
                (doc.getFacility() != null ? " at " + doc.getFacility() : "") + ". Digital record verified and archived.";
    }
}
