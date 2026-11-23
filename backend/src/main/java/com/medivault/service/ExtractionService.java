package com.medivault.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medivault.dto.gemini.GeminiExtractionResponse;
import com.medivault.model.*;
import com.medivault.model.enums.DocumentType;
import com.medivault.model.enums.ExtractionStatus;
import com.medivault.repository.DocumentExtractionRepository;
import com.medivault.repository.LabResultRepository;
import com.medivault.repository.MedicalDocumentRepository;
import com.medivault.repository.MedicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

/**
 * ExtractionService: High-level extraction orchestrator.
 * - Uses Gemini AI when GEMINI_API_KEY is configured.
 * - Runs clinical clean-up in pure Java (NOT in AI):
 *     1. Number parsing (thousands commas, scientific exponents 7.2 x 10^3, non-numeric strings).
 *     2. Reference range parsing (< 200, > 40, 12.0 - 15.5).
 *     3. Flag calculation (LOW, HIGH, NORMAL, UNKNOWN).
 *     4. Alias canonicalization.
 *     5. De-duplication.
 * - Falls back to regex parser when GEMINI_API_KEY is not configured (ocr_engine = "regex-fallback").
 * - Supports re-running extraction on failed documents.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExtractionService {

    private final GeminiClient geminiClient;
    private final ClinicalDataCleaner clinicalDataCleaner;
    private final TextExtractionService textExtractionService;
    private final ClinicalExtractionService clinicalExtractionService;
    private final LabResultRepository labResultRepository;
    private final MedicationRepository medicationRepository;
    private final DocumentExtractionRepository extractionRepository;
    private final MedicalDocumentRepository documentRepository;
    private final FileStorageService fileStorageService;
    private final DocumentSummarizerService documentSummarizerService;
    private final ObjectMapper objectMapper;

    @Value("${app.gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    /**
     * Extracts clinical data for the given document and persists lab results,
     * medications, extractions, and summary.
     */
    @Transactional
    public void processDocument(MedicalDocument doc, String userEnteredSummary) {
        Path filePath = fileStorageService.resolvePath(doc);
        if (!Files.exists(filePath)) {
            markExtractionFailed(doc, "Document file not found on disk. Please upload again.");
            return;
        }

        // ── 1. If Gemini is configured, run AI Extraction ────────────────
        if (geminiClient.isConfigured()) {
            try {
                log.info("Starting Gemini AI extraction for document {}", doc.getId());
                byte[] fileBytes = Files.readAllBytes(filePath);
                GeminiExtractionResponse geminiResponse = geminiClient.extract(fileBytes, doc.getContentType());

                // Parse report date if returned by AI and not yet set
                if (doc.getReportDate() == null && geminiResponse.getReportDate() != null) {
                    try {
                        doc.setReportDate(LocalDate.parse(geminiResponse.getReportDate().trim()));
                    } catch (Exception ignored) {}
                }

                // Clean data in Java (NOT in AI)
                List<LabResult> labs = Collections.emptyList();
                if (doc.getDocumentType() != DocumentType.PRESCRIPTION) {
                    labs = clinicalDataCleaner.cleanLabResults(
                            geminiResponse.getLabResults(), doc.getPatient(), doc, doc.getReportDate()
                    );
                    if (!labs.isEmpty()) {
                        labs = labResultRepository.saveAll(labs);
                        log.info("Saved {} clean lab results via Gemini for doc {}", labs.size(), doc.getId());
                    }
                }

                List<Medication> meds = Collections.emptyList();
                if (doc.getDocumentType() != DocumentType.BLOOD_REPORT) {
                    meds = clinicalDataCleaner.cleanMedications(
                            geminiResponse.getMedications(), doc.getPatient(), doc, doc.getReportDate()
                    );
                    if (!meds.isEmpty()) {
                        meds = medicationRepository.saveAll(meds);
                        log.info("Saved {} clean medications via Gemini for doc {}", meds.size(), doc.getId());
                    }
                }

                // Generate AI/clinical summary
                String summary = documentSummarizerService.generateSummary(
                        geminiResponse.getRawText(), meds, labs, doc
                );
                doc.setSummary(summary);
                documentRepository.save(doc);

                // Build full JSON and record extraction status DONE
                String fullJson = objectMapper.writeValueAsString(geminiResponse);
                saveExtractionRecord(doc, geminiResponse.getRawText(), fullJson, ExtractionStatus.DONE,
                        "gemini-" + geminiModel, geminiModel, null);

                return;
            } catch (Exception e) {
                log.error("Gemini AI extraction failed for document {}: {}", doc.getId(), e.getMessage());
                markExtractionFailed(doc, "AI extraction failed: " + e.getMessage());
                return;
            }
        }

        // ── 2. Fallback to Regex Parser when GEMINI_API_KEY is not set ─────
        log.info("GEMINI_API_KEY not configured. Using regex-fallback parser for document {}", doc.getId());
        processWithRegexFallback(doc, filePath, userEnteredSummary);
    }

    /**
     * Fallback extraction using local PDFBox/Tesseract text extractor + regex parser.
     */
    private void processWithRegexFallback(MedicalDocument doc, Path filePath, String userEnteredSummary) {
        try {
            String extractedText = textExtractionService.extractText(filePath, doc.getContentType());
            String combinedText = extractedText;
            if (userEnteredSummary != null && !userEnteredSummary.isBlank()) {
                combinedText = (extractedText.isBlank() ? "" : extractedText + "\n\n") +
                        "Clinical Notes: " + userEnteredSummary.trim();
            }

            List<Medication> meds = Collections.emptyList();
            List<LabResult> labs = Collections.emptyList();

            if (!combinedText.isBlank()) {
                if (doc.getDocumentType() != DocumentType.BLOOD_REPORT) {
                    meds = clinicalExtractionService.extractMedications(combinedText, doc.getPatient(), doc);
                    if (!meds.isEmpty()) {
                        meds = medicationRepository.saveAll(meds);
                    }
                }
                if (doc.getDocumentType() != DocumentType.PRESCRIPTION) {
                    labs = clinicalExtractionService.extractLabResults(combinedText, doc.getPatient(), doc);
                    if (!labs.isEmpty()) {
                        labs = labResultRepository.saveAll(labs);
                    }
                }
            }

            String summary = documentSummarizerService.generateSummary(combinedText, meds, labs, doc);
            doc.setSummary(summary);
            documentRepository.save(doc);

            String structuredJson = clinicalExtractionService.buildStructuredJson(meds, labs);
            ExtractionStatus status = (!meds.isEmpty() || !labs.isEmpty() || !combinedText.isBlank())
                    ? ExtractionStatus.DONE
                    : ExtractionStatus.PENDING;

            saveExtractionRecord(doc, combinedText.isBlank() ? null : combinedText, structuredJson,
                    status, "regex-fallback", "Clinical Pattern Parser v1.0", null);

        } catch (Exception e) {
            log.error("Regex fallback extraction failed for doc {}: {}", doc.getId(), e.getMessage());
            markExtractionFailed(doc, "Fallback extraction failed: " + e.getMessage());
        }
    }

    /**
     * Saves or updates the DocumentExtraction entity.
     */
    private void saveExtractionRecord(
            MedicalDocument doc,
            String rawText,
            String structuredJson,
            ExtractionStatus status,
            String ocrEngine,
            String llmModel,
            String errorMessage
    ) {
        DocumentExtraction extraction = extractionRepository.findByDocument_Id(doc.getId())
                .orElseGet(() -> DocumentExtraction.builder().document(doc).build());

        extraction.setRawText(rawText);
        extraction.setStructuredJson(structuredJson);
        extraction.setStatus(status);
        extraction.setOcrEngine(ocrEngine);
        extraction.setLlmModel(llmModel);
        extraction.setErrorMessage(errorMessage);

        extractionRepository.save(extraction);
        doc.setExtraction(extraction);
    }

    private void markExtractionFailed(MedicalDocument doc, String errorMessage) {
        saveExtractionRecord(doc, null, "{}", ExtractionStatus.FAILED,
                geminiClient.isConfigured() ? "gemini-" + geminiModel : "regex-fallback",
                null, errorMessage);
    }

    /**
     * Re-runs extraction for a document (used by the "Try Again" option).
     */
    @Transactional
    public void retryExtraction(MedicalDocument doc) {
        Path filePath = fileStorageService.resolvePath(doc);
        if (!Files.exists(filePath)) {
            throw new IllegalArgumentException("Document file not found on disk. Please upload the document again.");
        }

        // Clean up any previously extracted results for this document
        List<LabResult> existingLabs = labResultRepository.findByPatient_IdAndDocument_Id(doc.getPatient().getId(), doc.getId());
        if (!existingLabs.isEmpty()) {
            labResultRepository.deleteAll(existingLabs);
        }
        List<Medication> existingMeds = medicationRepository.findByPatient_IdAndDocument_Id(doc.getPatient().getId(), doc.getId());
        if (!existingMeds.isEmpty()) {
            medicationRepository.deleteAll(existingMeds);
        }

        // Reset status to PROCESSING
        saveExtractionRecord(doc, null, "{}", ExtractionStatus.PROCESSING,
                geminiClient.isConfigured() ? "gemini-" + geminiModel : "regex-fallback",
                null, null);

        // Re-process
        processDocument(doc, doc.getSummary());
    }
}
