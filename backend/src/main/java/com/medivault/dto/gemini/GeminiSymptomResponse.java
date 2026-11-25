package com.medivault.dto.gemini;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Raw structured JSON shape returned by Gemini for symptom analysis.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class GeminiSymptomResponse {

    private String urgency; // SELF_CARE | SEE_DOCTOR | EMERGENCY
    private String urgencyReason;
    private String summary;

    @Builder.Default
    private List<RawHistoryLink> historyLinks = new ArrayList<>();

    @Builder.Default
    private List<RawCause> possibleCauses = new ArrayList<>();

    @Builder.Default
    private List<RawMedicineWarning> medicineWarnings = new ArrayList<>();

    @Builder.Default
    private List<String> nextSteps = new ArrayList<>();

    @Builder.Default
    private List<String> homeCare = new ArrayList<>();

    @Builder.Default
    private List<String> warningSigns = new ArrayList<>();

    @Builder.Default
    private List<String> questionsForDoctor = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RawHistoryLink {
        private String text;
        private List<String> sourceIds = new ArrayList<>();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RawCause {
        private String name;
        private String likelihood;
        private String reason;
        private List<String> sourceIds = new ArrayList<>();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RawMedicineWarning {
        private String text;
        private List<String> sourceIds = new ArrayList<>();
    }
}
