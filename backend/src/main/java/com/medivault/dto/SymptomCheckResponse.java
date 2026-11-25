package com.medivault.dto;

import com.medivault.model.enums.DurationUnit;
import com.medivault.model.enums.SymptomOnset;
import com.medivault.model.enums.UrgencyLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SymptomCheckResponse {

    private String id;
    private String symptoms;
    private List<String> selectedSymptoms;
    private String bodyArea;
    private Integer severity;
    private Integer durationValue;
    private DurationUnit durationUnit;
    private SymptomOnset onset;

    private UrgencyLevel urgency;
    private String urgencyReason;
    private String summary;

    @Builder.Default
    private List<LinkedTextItem> historyLinks = new ArrayList<>();

    @Builder.Default
    private List<CauseItem> possibleCauses = new ArrayList<>();

    @Builder.Default
    private List<LinkedTextItem> medicineWarnings = new ArrayList<>();

    @Builder.Default
    private List<String> nextSteps = new ArrayList<>();

    @Builder.Default
    private List<String> homeCare = new ArrayList<>();

    @Builder.Default
    private List<String> warningSigns = new ArrayList<>();

    @Builder.Default
    private List<String> questionsForDoctor = new ArrayList<>();

    private String disclaimer;
    private boolean safetyRuleApplied;
    private boolean aiAvailable;
    private boolean historyAvailable;
    private LocalDateTime createdAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SourceLink {
        private String refId;
        private String label;
        private String type; // LAB_RESULT, MEDICATION, ALLERGY, CONDITION, DOCUMENT
        private String documentId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class LinkedTextItem {
        private String text;
        @Builder.Default
        private List<SourceLink> sources = new ArrayList<>();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CauseItem {
        private String name;
        private String likelihood; // HIGH | MEDIUM | LOW
        private String reason;
        @Builder.Default
        private List<SourceLink> sources = new ArrayList<>();
    }
}
