package com.medivault.dto.gemini;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

/**
 * Structured schema returned by Gemini AI extraction.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class GeminiExtractionResponse {

    private String reportDate;
    private String rawText;

    @Builder.Default
    private List<GeminiLabResultItem> labResults = new ArrayList<>();

    @Builder.Default
    private List<GeminiMedicationItem> medications = new ArrayList<>();

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GeminiLabResultItem {
        private String testName;
        private String canonicalTestName;
        private String value;
        private String unit;
        private String refRange;
        private Integer page;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class GeminiMedicationItem {
        private String name;
        private String dosage;
        private String frequency;
        private String duration;
        private Integer page;
    }
}
