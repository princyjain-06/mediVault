package com.medivault.dto;

import com.medivault.model.enums.DurationUnit;
import com.medivault.model.enums.SymptomOnset;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SymptomCheckRequest {

    /** Free-text symptom description (3-1000 chars if provided). */
    private String symptoms;

    /** Selected symptom chip names. */
    private List<String> selectedSymptoms;

    /** Optional body area / location. */
    private String bodyArea;

    @NotNull(message = "Severity is required (1-10)")
    @Min(value = 1, message = "Severity must be between 1 and 10")
    @Max(value = 10, message = "Severity must be between 1 and 10")
    private Integer severity;

    @NotNull(message = "Duration value is required (1-365)")
    @Min(value = 1, message = "Duration must be between 1 and 365")
    @Max(value = 365, message = "Duration must be between 1 and 365")
    private Integer durationValue;

    @NotNull(message = "Duration unit is required (HOURS, DAYS, WEEKS, MONTHS)")
    private DurationUnit durationUnit;

    /** Optional onset: SUDDEN or GRADUAL. */
    private SymptomOnset onset;
}
