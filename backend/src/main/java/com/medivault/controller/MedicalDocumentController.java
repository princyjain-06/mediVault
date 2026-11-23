package com.medivault.controller;

import com.medivault.dto.DocumentUploadResponse;
import com.medivault.service.FileStorageService;
import com.medivault.service.MedicalDocumentService;
import com.medivault.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

/**
 * Medical Document endpoints — always scoped to the logged-in patient.
 * POST  /api/patients/me/documents           → upload a file
 * GET   /api/patients/me/documents           → list all documents
 * GET   /api/patients/me/documents/{id}      → get one document metadata
 * GET   /api/patients/me/documents/{id}/file → download the actual file
 * DELETE /api/patients/me/documents/{id}     → delete document + file
 */
@RestController
@RequestMapping("/api/patients/me/documents")
@RequiredArgsConstructor
public class MedicalDocumentController {

    private final MedicalDocumentService documentService;
    private final FileStorageService fileStorageService;
    private final PatientService patientService;

    /**
     * Upload a medical document with file + metadata.
     * Accepts multipart/form-data with:
     *   file       – the actual PDF/image (required)
     *   title      – document title (required)
     *   documentType – BLOOD_REPORT, PRESCRIPTION, RADIOLOGY, CONSULTATION, DISCHARGE, OTHER
     *   reportDate – yyyy-MM-dd (optional)
     *   doctor     – doctor name (optional)
     *   facility   – hospital/clinic (optional)
     *   summary    – clinical notes (optional)
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<DocumentUploadResponse> upload(
            Authentication authentication,
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam(value = "documentType", defaultValue = "OTHER") String documentType,
            @RequestParam(value = "reportDate", required = false) String reportDate,
            @RequestParam(value = "doctor", required = false) String doctor,
            @RequestParam(value = "facility", required = false) String facility,
            @RequestParam(value = "summary", required = false) String summary
    ) {
        String email = authentication.getName();
        DocumentUploadResponse response = documentService.uploadDocument(
                email, file, title, documentType, reportDate, doctor, facility, summary
        );
        return ResponseEntity.ok(response);
    }

    /** List all documents for the logged-in patient (newest first). */
    @GetMapping
    public ResponseEntity<List<DocumentUploadResponse>> listDocuments(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(documentService.listDocuments(email));
    }

    /** Get metadata of a single document. */
    @GetMapping("/{documentId}")
    public ResponseEntity<DocumentUploadResponse> getDocument(
            Authentication authentication,
            @PathVariable String documentId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(documentService.getDocument(email, documentId));
    }

    /** Download the actual file for a document. */
    @GetMapping("/{documentId}/file")
    public ResponseEntity<Resource> downloadFile(
            Authentication authentication,
            @PathVariable String documentId
    ) {
        String email = authentication.getName();
        DocumentUploadResponse docDto = documentService.getDocument(email, documentId);

        // Find the entity to compute file path
        var patient = patientService.getPatientByEmail(email);
        var doc = new com.medivault.model.MedicalDocument();
        doc.setId(docDto.getId());
        doc.setContentType(docDto.getContentType());
        doc.setPatient(patient);

        Path filePath = fileStorageService.resolvePath(doc);
        if (!Files.exists(filePath)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(filePath);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(docDto.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + docDto.getTitle() + "\"")
                .body(resource);
    }

    /** Re-run extraction for a failed document ("Try Again"). */
    @PostMapping("/{documentId}/retry-extraction")
    public ResponseEntity<DocumentUploadResponse> retryExtraction(
            Authentication authentication,
            @PathVariable String documentId
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(documentService.retryExtraction(email, documentId));
    }

    /** Delete a document and its file. */
    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> deleteDocument(
            Authentication authentication,
            @PathVariable String documentId
    ) {
        String email = authentication.getName();
        documentService.deleteDocument(email, documentId);
        return ResponseEntity.noContent().build();
    }
}
