package com.medivault.dto._parked;

import lombok.Data;
import java.util.List;

@Data
public class SymptomCheckRequest {
    private String patientId;
    private List<ReportedSymptomDto> symptoms;
    private String additionalNotes;
    private List<String> triggers;
    private Double currentTemperature;
    private boolean consentGiven;
}
