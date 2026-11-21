package com.medivault.service;

import com.medivault.dto.DocumentUploadResponse;
import com.medivault.exception.ResourceNotFoundException;
import com.medivault.model.DocumentExtraction;
import com.medivault.model.MedicalDocument;
import com.medivault.model.Patient;
import com.medivault.model.enums.DocumentType;
import com.medivault.model.enums.ExtractionStatus;
import com.medivault.repository.MedicalDocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.List;

/**
 * Service for uploading, listing, and deleting medical documents.
 * All operations are scoped to the logged-in patient.
 */
@Service
@RequiredArgsConstructor
public class MedicalDocumentService {

    private final MedicalDocumentRepository documentRepository;
    private final FileStorageService fileStorageService;
    private final PatientService patientService;

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
        try {
            Path filePath = fileStorageService.resolvePath(doc);
            Files.createDirectories(filePath.getParent());
            file.transferTo(filePath.toFile());
        } catch (IOException e) {
            throw new RuntimeException("Failed to save file: " + e.getMessage(), e);
        }

        // Create a PENDING extraction record so we know to process it later
        DocumentExtraction extraction = DocumentExtraction.builder()
                .document(doc)
                .status(ExtractionStatus.PENDING)
                .build();
        doc.setExtraction(extraction);
        doc = documentRepository.save(doc);

        DocumentUploadResponse response = toResponse(doc);
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
                .build();
    }
}
