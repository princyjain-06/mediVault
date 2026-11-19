package com.medivault.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Medication/prescription extracted from a medical document.
 * Carries both patient_id and document_id for source provenance.
 */
@Entity
@Table(name = "medications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Medication {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false)
    private MedicalDocument document;

    @Column(nullable = false)
    private String name;

    @Column(length = 128)
    private String dosage;

    @Column(length = 128)
    private String frequency;

    @Column(length = 128)
    private String duration;

    @Column(name = "prescribed_date")
    private LocalDate prescribedDate;

    @Column(name = "page_number")
    private Integer pageNumber;

    /** AI confidence score (0.000 to 1.000) */
    @Column(precision = 4, scale = 3)
    private BigDecimal confidence;

    @Builder.Default
    @Column(nullable = false)
    private boolean verified = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @Transient
    public String getPatientId() {
        return patient != null ? patient.getId() : null;
    }

    @Transient
    public String getDocumentId() {
        return document != null ? document.getId() : null;
    }
}
