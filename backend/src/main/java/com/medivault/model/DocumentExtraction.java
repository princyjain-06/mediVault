package com.medivault.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.medivault.model.enums.ExtractionStatus;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * Extraction results from a medical document (OCR raw text and structured JSON).
 */
@Entity
@Table(name = "document_extractions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentExtraction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false, unique = true)
    private MedicalDocument document;

    @Column(name = "raw_text", columnDefinition = "TEXT")
    private String rawText;

    /** Structured JSON extraction stored in PostgreSQL JSONB column */
    @Type(JsonType.class)
    @Column(name = "structured_json", columnDefinition = "jsonb")
    private String structuredJson;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private ExtractionStatus status = ExtractionStatus.PENDING;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "ocr_engine", length = 64)
    private String ocrEngine;

    @Column(name = "llm_model", length = 64)
    private String llmModel;

    @Builder.Default
    @Column(name = "user_confirmed", nullable = false)
    private boolean userConfirmed = false;

    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
