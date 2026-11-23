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
    private final DocumentSummarizerService documentSummarizerService;
    private final ExtractionService extractionService;

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

        // Set file storage paths
        String relPath = fileStorageService.pathFor(doc);
        String dlUrl = "/api/patients/me/documents/" + doc.getId() + "/file";
        doc.setFilePath(relPath);
        doc.setFileUrl(dlUrl);
        doc = documentRepository.save(doc);

        // ── Extraction Pipeline (Gemini AI or Regex Fallback) ─────────────
        extractionService.processDocument(doc, summary);

        // Re-read updated document state
        doc = documentRepository.findById(doc.getId()).orElse(doc);
        return toResponse(doc);
    }

    /**
     * Re-runs extraction for a document (used by the "Try Again" option).
     */
    @Transactional
    public DocumentUploadResponse retryExtraction(String email, String documentId) {
        Patient patient = patientService.getPatientByEmail(email);
        MedicalDocument doc = documentRepository.findByIdAndPatient_Id(documentId, patient.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Document not found: " + documentId));

        extractionService.retryExtraction(doc);

        doc = documentRepository.findById(doc.getId()).orElse(doc);
        return toResponse(doc);
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
        ExtractionStatus extractionStatus = null;
        String extractionError = null;
        if (doc.getExtraction() != null) {
            extractionStatus = doc.getExtraction().getStatus();
            extractionError = doc.getExtraction().getErrorMessage();
            if (doc.getExtraction().getRawText() != null) {
                String clean = doc.getExtraction().getRawText().replaceAll("[\\r\\n\\t]+", " ").trim();
                preview = clean.length() > 300 ? clean.substring(0, 300) + "..." : clean;
            }
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
                .filePath(doc.getFilePath())
                .fileUrl(doc.getFileUrl() != null ? doc.getFileUrl() : (doc.getId() != null ? "/api/patients/me/documents/" + doc.getId() + "/file" : null))
                .extractedMedications(meds.isEmpty() ? null : meds)
                .extractedTextPreview(preview)
                .extractionStatus(extractionStatus)
                .extractionErrorMessage(extractionError)
                .build();
    }
}
