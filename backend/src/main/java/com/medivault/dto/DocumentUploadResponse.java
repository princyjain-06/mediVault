package com.medivault.dto;

import com.medivault.model.enums.DocumentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO returned after uploading or listing a medical document.
 * Never exposes internal Patient entity — only the patientId string.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentUploadResponse {
    private String id;
    private String patientId;
    private String title;
    private DocumentType documentType;
    private String contentType;
    private Long fileSize;
    private LocalDate reportDate;
    private LocalDateTime uploadedAt;

    // Optional metadata fields (echoed back from upload form)
    private String doctor;
    private String facility;
    private String summary;
    private String filePath;
    private String fileUrl;

    /** Medications extracted from this document via OCR / clinical parser */
    private java.util.List<MedicationDto> extractedMedications;

    /** Extracted raw text preview */
    private String extractedTextPreview;
}
