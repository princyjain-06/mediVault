package com.medivault.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientRecordSummaryResponse {
    private String patientName;
    private String ageAndGender;
    private String bloodGroup;
    private String generatedDate;
    private String executiveSummary;
    private List<String> chronicConditions;
    private List<String> activeMedications;
    private List<String> criticalAllergies;
    private List<String> notableLabFindings;
    private List<String> clinicalRecommendations;
    private int totalDocumentsAnalyzed;
    private boolean aiGenerated;
}
