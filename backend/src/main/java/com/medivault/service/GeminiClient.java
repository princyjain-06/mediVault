package com.medivault.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medivault.dto.gemini.GeminiExtractionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.multipdf.Splitter;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.*;

/**
 * GeminiClient: Sends uploaded document files (PDF or images) directly to the
 * Google Gemini API as inline base64 data for structured AI extraction.
 *
 * Rules:
 * - API key from GEMINI_API_KEY environment variable / application properties.
 * - Never logs the API key or document contents.
 * - Requests application/json output matching the exact clinical schema.
 * - Retries once if the response is not valid JSON.
 * - Handles documents with > 5 pages by splitting into 5-page chunks and merging results.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiClient {

    @Value("${app.gemini.api-key:${GEMINI_API_KEY:}}")
    private String apiKey;

    @Value("${app.gemini.model:gemini-3.5-flash-lite}")
    private String modelName;

    private final ObjectMapper objectMapper;
    private final RestTemplate restTemplate = new RestTemplate();

    private static final int MAX_PAGES_PER_CHUNK = 5;

    private static final String EXTRACTION_PROMPT = """
            You are a medical document extraction specialist. Extract all clinical laboratory test results and prescribed medications from this medical document.

            STRICT INSTRUCTION RULES:
            1. Extract EVERY SINGLE test row present in the document. Do not limit extraction to common tests. Even if there are 50+ tests, extract every one.
            2. Copy test names, values, units, and reference ranges EXACTLY as printed on the document. Do not alter abbreviations.
            3. Do not guess or fabricate missing values. If a field is not present in the document, set it to null.
            4. Do not add any diagnosis, clinical interpretation, or medical advice.
            5. Provide canonicalTestName as the standard medical test name (e.g. Hemoglobin, Fasting Glucose, WBC, Platelets, Total Bilirubin).
            6. Return ONLY a valid JSON object matching this exact schema:
            {
              "reportDate": "YYYY-MM-DD or null",
              "rawText": "all extracted text content from the document",
              "labResults": [
                {
                  "testName": "exactly as printed",
                  "canonicalTestName": "standard name",
                  "value": "as printed e.g. 7,200 or Negative",
                  "unit": "e.g. mg/dL or null",
                  "refRange": "as printed e.g. 4000 - 11000 or null",
                  "page": 1
                }
              ],
              "medications": [
                {
                  "name": "medicine name",
                  "dosage": "e.g. 500mg or null",
                  "frequency": "e.g. 1-0-1 or null",
                  "duration": "e.g. 30 days or null",
                  "page": 1
                }
              ],
              "conditions": [
                {
                  "name": "diagnosis written in document",
                  "status": "ACTIVE | RESOLVED | UNKNOWN",
                  "diagnosedDate": "YYYY-MM-DD or null"
                }
              ],
              "allergies": [
                {
                  "allergen": "allergen written in document",
                  "reaction": "reaction or null",
                  "severity": "MILD | MODERATE | SEVERE | UNKNOWN"
                }
              ]
            }
            Only include conditions and allergies that are explicitly written in the document; never guess or infer them.
            """;

    /**
     * Checks if the Gemini API key is configured.
     */
    public boolean isConfigured() {
        return apiKey != null && !apiKey.trim().isBlank();
    }

    public String getModelName() {
        return modelName != null ? modelName.trim() : "gemini-3.5-flash-lite";
    }

    /**
     * Sends a text-only prompt with system instructions to Gemini and returns raw JSON string.
     * Retries once if the HTTP call fails or returns invalid JSON.
     * Never logs prompts, API keys, or responses.
     */
    public String generateJson(String systemInstruction, String userPrompt, double temperature) throws Exception {
        if (!isConfigured()) {
            throw new IllegalStateException("GEMINI_API_KEY is not configured.");
        }

        String url = String.format(
                "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                getModelName(), apiKey.trim()
        );

        Map<String, Object> requestBody = new LinkedHashMap<>();
        if (systemInstruction != null && !systemInstruction.isBlank()) {
            requestBody.put("systemInstruction", Map.of(
                    "parts", List.of(Map.of("text", systemInstruction))
            ));
        }
        requestBody.put("contents", List.of(Map.of(
                "parts", List.of(Map.of("text", userPrompt))
        )));
        requestBody.put("generationConfig", Map.of(
                "responseMimeType", "application/json",
                "maxOutputTokens", 4096,
                "temperature", temperature
        ));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        Exception lastException = null;
        for (int attempt = 1; attempt <= 2; attempt++) {
            try {
                ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
                if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                    throw new RuntimeException("Gemini HTTP error: " + response.getStatusCode());
                }
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode candidatePart = root.path("candidates").path(0)
                        .path("content").path("parts").path(0).path("text");
                if (candidatePart.isMissingNode() || candidatePart.asText().isBlank()) {
                    throw new RuntimeException("Gemini returned empty candidate text.");
                }
                String clean = stripMarkdownFences(candidatePart.asText().trim());
                // Validate that the returned text is parseable JSON before returning
                objectMapper.readTree(clean);
                return clean;
            } catch (Exception e) {
                lastException = e;
                log.warn("Gemini JSON generation attempt {} failed: {}", attempt, e.getMessage());
                if (attempt == 1) {
                    try {
                        Thread.sleep(500);
                    } catch (InterruptedException ignored) {}
                }
            }
        }
        throw new RuntimeException("Gemini JSON generation failed after 2 attempts: " +
                (lastException != null ? lastException.getMessage() : "Unknown error"), lastException);
    }

    private String stripMarkdownFences(String rawJson) {
        String cleanJson = rawJson.trim();
        if (cleanJson.startsWith("```")) {
            int firstNewline = cleanJson.indexOf('\n');
            int lastBackticks = cleanJson.lastIndexOf("```");
            if (firstNewline != -1 && lastBackticks > firstNewline) {
                cleanJson = cleanJson.substring(firstNewline + 1, lastBackticks).trim();
            }
        }
        return cleanJson;
    }

    /**
     * Extracts structured clinical data from the given file bytes.
     * If the document is a PDF with more than 5 pages, splits it into 5-page chunks
     * and merges the extracted items.
     */
    public GeminiExtractionResponse extract(byte[] fileBytes, String mimeType) throws Exception {
        if (!isConfigured()) {
            throw new IllegalStateException("GEMINI_API_KEY is not configured.");
        }
        if (fileBytes == null || fileBytes.length == 0) {
            throw new IllegalArgumentException("File content is empty.");
        }

        String normalizedMime = (mimeType != null && !mimeType.isBlank())
                ? mimeType.toLowerCase().trim()
                : "application/pdf";

        // Check if multi-page PDF with > 5 pages
        if (normalizedMime.contains("pdf")) {
            List<byte[]> chunks = splitPdfIfLarge(fileBytes);
            if (chunks.size() > 1) {
                log.info("PDF has > 5 pages. Processing in {} chunks of up to 5 pages each.", chunks.size());
                return processMultiChunkPdf(chunks);
            }
        }

        // Single chunk extraction with 1 retry
        return extractWithRetry(fileBytes, normalizedMime, 1);
    }

    /**
     * Calls Gemini with 1 automatic retry if the response is malformed or invalid JSON.
     */
    private GeminiExtractionResponse extractWithRetry(byte[] fileBytes, String mimeType, int pageOffset) throws Exception {
        Exception lastException = null;

        for (int attempt = 1; attempt <= 2; attempt++) {
            try {
                log.info("Sending extraction request to Gemini model {} (attempt {}/2)", modelName, attempt);
                String jsonResponse = callGeminiApi(fileBytes, mimeType);
                GeminiExtractionResponse response = parseGeminiResponse(jsonResponse);

                // Adjust page numbers if chunking
                if (pageOffset > 1 && response.getLabResults() != null) {
                    for (var lab : response.getLabResults()) {
                        if (lab.getPage() != null) {
                            lab.setPage(lab.getPage() + pageOffset - 1);
                        }
                    }
                }
                if (pageOffset > 1 && response.getMedications() != null) {
                    for (var med : response.getMedications()) {
                        if (med.getPage() != null) {
                            med.setPage(med.getPage() + pageOffset - 1);
                        }
                    }
                }

                return response;
            } catch (Exception e) {
                lastException = e;
                log.warn("Gemini extraction attempt {} failed: {}", attempt, e.getMessage());
                if (attempt == 1) {
                    try {
                        Thread.sleep(1000);
                    } catch (InterruptedException ignored) {}
                }
            }
        }

        throw new RuntimeException("Gemini extraction failed after 2 attempts: " +
                (lastException != null ? lastException.getMessage() : "Unknown error"), lastException);
    }

    /**
     * Executes the REST POST call to Gemini's generateContent endpoint.
     * Note: API key is never logged. Document contents are never logged.
     */
    private String callGeminiApi(byte[] fileBytes, String mimeType) throws Exception {
        String url = String.format(
                "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                modelName.trim(), apiKey.trim()
        );

        String base64Data = Base64.getEncoder().encodeToString(fileBytes);

        // Build Gemini request payload with inlineData and JSON response format
        Map<String, Object> inlineData = Map.of(
                "mimeType", mimeType,
                "data", base64Data
        );

        Map<String, Object> promptPart = Map.of(
                "text", EXTRACTION_PROMPT
        );

        Map<String, Object> content = Map.of(
                "parts", List.of(
                        Map.of("inlineData", inlineData),
                        promptPart
                )
        );

        Map<String, Object> generationConfig = Map.of(
                "responseMimeType", "application/json",
                "maxOutputTokens", 8192,
                "temperature", 0.1
        );

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(content),
                "generationConfig", generationConfig
        );

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("Gemini HTTP error: " + response.getStatusCode());
        }

        // Extract candidate text from response body
        JsonNode root = objectMapper.readTree(response.getBody());
        JsonNode candidatePart = root.path("candidates").path(0)
                .path("content").path("parts").path(0).path("text");

        if (candidatePart.isMissingNode() || candidatePart.asText().isBlank()) {
            throw new RuntimeException("Gemini returned empty candidate text.");
        }

        return candidatePart.asText().trim();
    }

    /**
     * Parses the raw JSON text from Gemini into GeminiExtractionResponse.
     */
    public GeminiExtractionResponse parseGeminiResponse(String rawJson) throws Exception {
        String cleanJson = rawJson.trim();
        // Remove possible markdown code block fences (```json ... ```)
        if (cleanJson.startsWith("```")) {
            int firstNewline = cleanJson.indexOf('\n');
            int lastBackticks = cleanJson.lastIndexOf("```");
            if (firstNewline != -1 && lastBackticks > firstNewline) {
                cleanJson = cleanJson.substring(firstNewline + 1, lastBackticks).trim();
            }
        }
        return objectMapper.readValue(cleanJson, GeminiExtractionResponse.class);
    }

    /**
     * Splits a PDF into multiple chunks of up to MAX_PAGES_PER_CHUNK pages each.
     */
    private List<byte[]> splitPdfIfLarge(byte[] pdfBytes) {
        try (PDDocument doc = PDDocument.load(pdfBytes)) {
            int totalPages = doc.getNumberOfPages();
            if (totalPages <= MAX_PAGES_PER_CHUNK) {
                return List.of(pdfBytes);
            }

            Splitter splitter = new Splitter();
            splitter.setSplitAtPage(MAX_PAGES_PER_CHUNK);
            List<PDDocument> documents = splitter.split(doc);

            List<byte[]> chunks = new ArrayList<>();
            for (PDDocument subDoc : documents) {
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                subDoc.save(baos);
                subDoc.close();
                chunks.add(baos.toByteArray());
            }
            return chunks;
        } catch (IOException e) {
            log.warn("Failed to inspect PDF pages, processing as single document: {}", e.getMessage());
            return List.of(pdfBytes);
        }
    }

    /**
     * Merges responses from multi-chunk PDF processing.
     */
    private GeminiExtractionResponse processMultiChunkPdf(List<byte[]> chunks) throws Exception {
        GeminiExtractionResponse combined = new GeminiExtractionResponse();
        StringBuilder rawTextBuilder = new StringBuilder();

        int currentPageOffset = 1;
        for (int i = 0; i < chunks.size(); i++) {
            byte[] chunk = chunks.get(i);
            GeminiExtractionResponse chunkRes = extractWithRetry(chunk, "application/pdf", currentPageOffset);

            if (chunkRes.getReportDate() != null && combined.getReportDate() == null) {
                combined.setReportDate(chunkRes.getReportDate());
            }
            if (chunkRes.getRawText() != null) {
                if (rawTextBuilder.length() > 0) rawTextBuilder.append("\n\n--- Page Break ---\n\n");
                rawTextBuilder.append(chunkRes.getRawText());
            }
            if (chunkRes.getLabResults() != null) {
                combined.getLabResults().addAll(chunkRes.getLabResults());
            }
            if (chunkRes.getMedications() != null) {
                combined.getMedications().addAll(chunkRes.getMedications());
            }
            if (chunkRes.getConditions() != null) {
                combined.getConditions().addAll(chunkRes.getConditions());
            }
            if (chunkRes.getAllergies() != null) {
                combined.getAllergies().addAll(chunkRes.getAllergies());
            }

            currentPageOffset += MAX_PAGES_PER_CHUNK;
        }

        combined.setRawText(rawTextBuilder.toString());
        return combined;
    }
}
