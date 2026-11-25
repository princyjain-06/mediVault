package com.medivault.dto;

import com.medivault.model.enums.ConditionStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConditionRequest {
    @NotBlank(message = "Condition name is required")
    @Size(max = 255, message = "Condition name must be at most 255 characters")
    private String name;

    private ConditionStatus status;
    private LocalDate diagnosedDate;
}
