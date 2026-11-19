package com.medivault.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.medivault.model.enums.LabFlag;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Discrete laboratory test result parsed from a blood report.
 * Carries both patient_id and document_id for traceability and querying.
 */
@Entity
@Table(name = "lab_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LabResult {

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

    /** Exact test name as printed on the laboratory report */
    @Column(name = "test_name", nullable = false)
    private String testName;

    /** Canonical/standardized test name for aggregation and trending (e.g. "Hemoglobin") */
    @Column(name = "canonical_test_name", nullable = false)
    private String canonicalTestName;

    /** Numeric value for quantitative tests */
    @Column(name = "value_number", precision = 10, scale = 3)
    private BigDecimal valueNumber;

    /** Textual result for qualitative tests (e.g. "Negative", "Reactive") */
    @Column(name = "value_text")
    private String valueText;

    private String unit;

    @Column(name = "ref_low", precision = 10, scale = 3)
    private BigDecimal refLow;

    @Column(name = "ref_high", precision = 10, scale = 3)
    private BigDecimal refHigh;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    @Builder.Default
    private LabFlag flag = LabFlag.UNKNOWN;

    @Column(name = "result_date")
    private LocalDate resultDate;

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
