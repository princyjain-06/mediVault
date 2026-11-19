package com.medivault.dto;

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
public class EmergencyContactRequest {

    @NotBlank(message = "Contact name is required")
    @Size(max = 100, message = "Name must not exceed 100 characters")
    private String name;

    @Size(max = 30, message = "Relationship must not exceed 30 characters")
    private String relationship;

    @NotBlank(message = "Phone number is required")
    private String phone;

    @Builder.Default
    private Boolean isPrimary = true;
}
