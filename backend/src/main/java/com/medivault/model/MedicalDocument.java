package com.medivault.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.medivault.model.enums.DocumentType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Metadata for uploaded medical documents (blood reports, prescriptions, etc.).
 * File content and physical storage location are NOT stored in the database.
 * The storage path is computed via FileStorageService:
 * uploads/{patient_id}/{document_id}.{extension}
 */
@Entity
@Table(name = "medical_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 32)
    private DocumentType documentType;

    @Column(nullable = false)
    private String title;

    @Column(name = "content_type", nullable = false, length = 128)
    private String contentType;

    @Column(name = "file_size", nullable = false)
    private Long fileSize;

    @Column(name = "report_date")
    private LocalDate reportDate;

    @CreationTimestamp
    @Column(name = "uploaded_at", updatable = false, nullable = false)
    private LocalDateTime uploadedAt;

    // ── 1-to-1 Extraction ────────────────────────────────────
    @OneToOne(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    private DocumentExtraction extraction;

    // ── 1-to-Many Lab Results ────────────────────────────────
    @JsonIgnore
    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<LabResult> labResults = new ArrayList<>();

    // ── 1-to-Many Medications ────────────────────────────────
    @JsonIgnore
    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Medication> medications = new ArrayList<>();

    @Transient
    public String getPatientId() {
        return patient != null ? patient.getId() : null;
    }
}
