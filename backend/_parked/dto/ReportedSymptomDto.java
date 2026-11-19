package com.medivault.dto._parked;

import lombok.Data;

@Data
public class ReportedSymptomDto {
    private String symptomId;
    private String name;
    private String severity;  // mild | moderate | severe
    private String duration;
    private String onset;     // gradual | sudden
    private String bodyLocation;
    private String notes;
}
