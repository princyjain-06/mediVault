package com.medivault.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.medivault.model.enums.AllergySeverity;
import com.medivault.model.enums.RecordSource;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Represents a documented allergy for a patient,
 * either extracted from a document (DOCUMENT) or entered manually (MANUAL).
 */
@Entity
@Table(name = "allergies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Allergy {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id")
    private MedicalDocument document;

    @Column(nullable = false, length = 255)
    private String allergen;

    @Column(length = 255)
    private String reaction;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private AllergySeverity severity = AllergySeverity.UNKNOWN;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private RecordSource source = RecordSource.MANUAL;

    @Column(nullable = false)
    @Builder.Default
    private Boolean verified = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    public String getDocumentId() {
        return document != null ? document.getId() : null;
    }
}
