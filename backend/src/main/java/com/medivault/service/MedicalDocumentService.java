package com.medivault.service;

import com.medivault.dto.DocumentUploadResponse;
import com.medivault.dto.MedicationDto;
import com.medivault.exception.ResourceNotFoundException;
import com.medivault.model.*;
import com.medivault.model.enums.DocumentType;
import com.medivault.model.enums.ExtractionStatus;
import com.medivault.repository.DocumentExtractionRepository;
import com.medivault.repository.LabResultRepository;
import com.medivault.repository.MedicalDocumentRepository;
import com.medivault.repository.MedicationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

/**
 * Service for uploading, listing, and deleting medical documents.
 * All operations are scoped to the logged-in patient.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MedicalDocumentService {

    private final MedicalDocumentRepository documentRepository;
    private final DocumentExtractionRepository extractionRepository;
    private final MedicationRepository medicationRepository;
    private final LabResultRepository labResultRepository;
    private final FileStorageService fileStorageService;
    private final PatientService patientService;
    private final TextExtractionService textExtractionService;
    private final ClinicalExtractionService clinicalExtractionService;
    private final MedicationService medicationService;

    /**
     * List all documents for the logged-in patient, newest first.
     */
    @Transactional(readOnly = true)
    public List<DocumentUploadResponse> listDocuments(String email) {
        Patient patient = patientService.getPatientByEmail(email);
        return documentRepository.findByPatient_IdOrderByUploadedAtDesc(patient.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Upload a file and persist metadata.
     * File is saved to: uploads/{patient_id}/{document_id}.{ext}
     */
    @Transactional
    public DocumentUploadResponse uploadDocument(
            String email,
            MultipartFile file,
            String title,
            String documentTypeStr,
            String reportDateStr,
            String doctor,
            String facility,
            String summary
    ) {
        Patient patient = patientService.getPatientByEmail(email);

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File is required.");
        }
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("Title is required.");
        }

        // Parse document type (default to OTHER)
        DocumentType docType;
        try {
            docType = DocumentType.valueOf(documentTypeStr.toUpperCase());
        } catch (Exception e) {
            docType = DocumentType.OTHER;
        }

        // Parse report date (optional)
        LocalDate reportDate = null;
        if (reportDateStr != null && !reportDateStr.isBlank()) {
            try {
                reportDate = LocalDate.parse(reportDateStr);
            } catch (Exception ignored) {
                // keep null
            }
        }

        // Build the entity (id is auto-generated on save)
        MedicalDocument doc = MedicalDocument.builder()
                .patient(patient)
                .title(title.trim())
                .documentType(docType)
                .contentType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                .fileSize(file.getSize())
                .reportDate(reportDate)
                .doctor(doctor != null && !doctor.isBlank() ? doctor.trim() : null)
                .facility(facility != null && !facility.isBlank() ? facility.trim() : null)
                .summary(summary != null && !summary.isBlank() ? summary.trim() : null)
                .build();

        // Save first to get the generated id
        doc = documentRepository.save(doc);

        // Persist the file to disk
        Path filePath;
        try {
            filePath = fileStorageService.resolvePath(doc);
            Files.createDirectories(filePath.getParent());
            file.transferTo(filePath.toFile());
        } catch (IOException e) {
            throw new RuntimeException("Failed to save file: " + e.getMessage(), e);
        }

        // ── Step 1: Text Extraction (PDFBox / Tess4J OCR) ─────────────────
        String extractedText = textExtractionService.extractText(filePath, doc.getContentType());
        // If clinical summary was provided, merge it for additional context
        String combinedText = extractedText;
        if (summary != null && !summary.isBlank()) {
            combinedText = (extractedText.isBlank() ? "" : extractedText + "\n\n") + "Clinical Notes: " + summary.trim();
        }

        // ── Step 2: Clinical Pattern Extraction (Medications & Lab Results)
        List<Medication> extractedMeds = Collections.emptyList();
        List<LabResult> extractedLabs = Collections.emptyList();

        if (!combinedText.isBlank()) {
            try {
                extractedMeds = clinicalExtractionService.extractMedications(combinedText, patient, doc);
                if (!extractedMeds.isEmpty()) {
                    extractedMeds = medicationRepository.saveAll(extractedMeds);
                    log.info("Extracted and saved {} medications from document {}", extractedMeds.size(), doc.getId());
                }

                extractedLabs = clinicalExtractionService.extractLabResults(combinedText, patient, doc);
                if (!extractedLabs.isEmpty()) {
                    extractedLabs = labResultRepository.saveAll(extractedLabs);
                    log.info("Extracted and saved {} lab results from document {}", extractedLabs.size(), doc.getId());
                }
            } catch (Exception e) {
                log.error("Error during clinical extraction for document {}: {}", doc.getId(), e.getMessage());
            }
        }

        // ── Step 3: Record Extraction Metadata ────────────────────────────
        ExtractionStatus extractionStatus = (!extractedMeds.isEmpty() || !extractedLabs.isEmpty())
                ? ExtractionStatus.DONE
                : (combinedText.isBlank() ? ExtractionStatus.PENDING : ExtractionStatus.DONE);

        String structuredJson = clinicalExtractionService.buildStructuredJson(extractedMeds, extractedLabs);

        DocumentExtraction extraction = DocumentExtraction.builder()
                .document(doc)
                .rawText(combinedText.isBlank() ? null : combinedText)
                .structuredJson(structuredJson)
                .status(extractionStatus)
                .ocrEngine("Apache PDFBox + Tess4J OCR")
                .llmModel("Clinical Pattern Parser v1.0")
                .build();
        doc.setExtraction(extraction);
        doc = documentRepository.save(doc);

        DocumentUploadResponse response = toResponse(doc);
        if (!extractedMeds.isEmpty()) {
            response.setExtractedMedications(extractedMeds.stream().map(medicationService::toDto).toList());
        }
        if (!combinedText.isBlank()) {
            String clean = combinedText.replaceAll("[\\r\\n\\t]+", " ").trim();
            String preview = clean.length() > 300 ? clean.substring(0, 300) + "..." : clean;
            response.setExtractedTextPreview(preview);
        }
        return response;
    }

    /**
     * Get a single document for the logged-in patient.
     */
    @Transactional(readOnly = true)
    public DocumentUploadResponse getDocument(String email, String documentId) {
        Patient patient = patientService.getPatientByEmail(email);
        MedicalDocument doc = documentRepository.findByIdAndPatient_Id(documentId, patient.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + documentId));
        return toResponse(doc);
    }

    /**
     * Delete a document and its file on disk.
     */
    @Transactional
    public void deleteDocument(String email, String documentId) {
        Patient patient = patientService.getPatientByEmail(email);
        MedicalDocument doc = documentRepository.findByIdAndPatient_Id(documentId, patient.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + documentId));

        // Delete file from disk (best-effort)
        try {
            Path filePath = fileStorageService.resolvePath(doc);
            Files.deleteIfExists(filePath);
        } catch (IOException ignored) {
            // Log but don't block deletion
        }

        documentRepository.delete(doc);
    }

    /**
     * Map entity to DTO.
     */
    private DocumentUploadResponse toResponse(MedicalDocument doc) {
        List<MedicationDto> meds = Collections.emptyList();
        if (doc.getId() != null && doc.getPatient() != null) {
            meds = medicationRepository.findByPatient_IdAndDocument_Id(doc.getPatient().getId(), doc.getId())
                    .stream().map(medicationService::toDto).toList();
        }

        String preview = null;
        if (doc.getExtraction() != null && doc.getExtraction().getRawText() != null) {
            String clean = doc.getExtraction().getRawText().replaceAll("[\\r\\n\\t]+", " ").trim();
            preview = clean.length() > 300 ? clean.substring(0, 300) + "..." : clean;
        }

        return DocumentUploadResponse.builder()
                .id(doc.getId())
                .patientId(doc.getPatientId())
                .title(doc.getTitle())
                .documentType(doc.getDocumentType())
                .contentType(doc.getContentType())
                .fileSize(doc.getFileSize())
                .reportDate(doc.getReportDate())
                .uploadedAt(doc.getUploadedAt())
                .doctor(doc.getDoctor())
                .facility(doc.getFacility())
                .summary(doc.getSummary())
                .extractedMedications(meds.isEmpty() ? null : meds)
                .extractedTextPreview(preview)
                .build();
    }
}
