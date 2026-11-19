package com.medivault.model._parked;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "symptom_analyses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SymptomAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String checkDate;
    private String patientId;
    private String patientName;
    private String triageTier;         // routine | urgent | emergency
    private String urgencyHeadline;

    @Column(length = 2000)
    private String urgencyExplanation;

    @Column(length = 5000)
    private String reportedSymptomsJson; // stored as JSON string

    @Column(length = 5000)
    private String personalizedInsightsJson;

    @Column(length = 5000)
    private String possibleCausesJson;

    @Column(length = 5000)
    private String interactionAlertsJson;

    @ElementCollection
    @CollectionTable(name = "analysis_next_steps", joinColumns = @JoinColumn(name = "analysis_id"))
    @Column(name = "step", length = 1000)
    private List<String> recommendedNextSteps;

    @ElementCollection
    @CollectionTable(name = "analysis_home_care", joinColumns = @JoinColumn(name = "analysis_id"))
    @Column(name = "tip", length = 1000)
    private List<String> homeCareTips;

    @ElementCollection
    @CollectionTable(name = "analysis_red_flags", joinColumns = @JoinColumn(name = "analysis_id"))
    @Column(name = "flag", length = 1000)
    private List<String> redFlags;

    @Column(length = 2000)
    private String disclaimer;
}
