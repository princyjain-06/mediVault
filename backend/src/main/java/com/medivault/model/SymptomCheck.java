package com.medivault.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.medivault.model.enums.DurationUnit;
import com.medivault.model.enums.SymptomOnset;
import com.medivault.model.enums.UrgencyLevel;
import io.hypersistence.utils.hibernate.type.json.JsonType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.Type;

import java.time.LocalDateTime;

/**
 * Stores a patient's personalized symptom check, including the exact
 * health history snapshot sent to the AI and the final safety-checked result.
 */
@Entity
@Table(name = "symptom_checks")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SymptomCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @JsonIgnore
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Column(columnDefinition = "TEXT")
    private String symptoms;

    /** Selected symptom chips stored as JSONB array */
    @Type(JsonType.class)
    @Column(name = "selected_symptoms", columnDefinition = "jsonb")
    private String selectedSymptoms;

    @Column(name = "body_area", length = 128)
    private String bodyArea;

    @Column(nullable = false)
    private Integer severity;

    @Column(name = "duration_value", nullable = false)
    private Integer durationValue;

    @Enumerated(EnumType.STRING)
    @Column(name = "duration_unit", nullable = false, length = 16)
    private DurationUnit durationUnit;

    @Enumerated(EnumType.STRING)
    @Column(length = 16)
    private SymptomOnset onset;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private UrgencyLevel urgency;

    @Column(name = "safety_rule_applied", nullable = false)
    @Builder.Default
    private Boolean safetyRuleApplied = false;

    @Column(name = "ai_available", nullable = false)
    @Builder.Default
    private Boolean aiAvailable = true;

    /** Full structured analysis response JSON stored in PostgreSQL JSONB */
    @Type(JsonType.class)
    @Column(name = "result_json", columnDefinition = "jsonb")
    private String resultJson;

    /** Exact history snapshot sent to AI for auditability */
    @Column(name = "history_snapshot", columnDefinition = "TEXT")
    private String historySnapshot;

    @Column(name = "llm_model", length = 64)
    private String llmModel;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;
}
