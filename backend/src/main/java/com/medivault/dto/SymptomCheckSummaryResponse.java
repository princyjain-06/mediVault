package com.medivault.dto;

import com.medivault.model.enums.UrgencyLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SymptomCheckSummaryResponse {
    private String id;
    private LocalDateTime createdAt;
    private String symptoms;
    private List<String> selectedSymptoms;
    private UrgencyLevel urgency;
    private String topCause;
    private boolean safetyRuleApplied;
    private boolean aiAvailable;
}
