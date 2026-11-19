package com.medivault.service;

import com.medivault.model.MedicalDocument;
import org.springframework.stereotype.Service;

import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * File storage service helper.
 * Enforces the rule: file location is ALWAYS calculated from IDs:
 * uploads/{patient_id}/{document_id}.{extension}
 * Never stored in the database.
 */
@Service
public class FileStorageService {

    private static final String UPLOADS_ROOT = "uploads";

    /**
     * Compute relative file path for a medical document:
     * uploads/{patient_id}/{document_id}.{extension}
     */
    public String pathFor(MedicalDocument document) {
        if (document == null || document.getId() == null) {
            throw new IllegalArgumentException("Document and Document ID must not be null");
        }
        String patientId = document.getPatient() != null ? document.getPatient().getId() : "unknown";
        String extension = extensionForContentType(document.getContentType());
        return String.format("%s/%s/%s.%s", UPLOADS_ROOT, patientId, document.getId(), extension);
    }

    /**
     * Resolve the absolute path on the host filesystem.
     */
    public Path resolvePath(MedicalDocument document) {
        return Paths.get(pathFor(document)).toAbsolutePath();
    }

    /**
     * Map MIME content type to file extension.
     */
    public String extensionForContentType(String contentType) {
        if (contentType == null) return "bin";
        String normalized = contentType.toLowerCase().trim();
        return switch (normalized) {
            case "application/pdf" -> "pdf";
            case "image/jpeg", "image/jpg" -> "jpg";
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            case "image/heic" -> "heic";
            case "text/plain" -> "txt";
            default -> "bin";
        };
    }
}
