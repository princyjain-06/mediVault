package com.medivault.dto;

import com.medivault.model.enums.AllergySeverity;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AllergyRequest {
    @NotBlank(message = "Allergen is required")
    @Size(max = 255, message = "Allergen must be at most 255 characters")
    private String allergen;

    @Size(max = 255, message = "Reaction must be at most 255 characters")
    private String reaction;

    private AllergySeverity severity;
}
