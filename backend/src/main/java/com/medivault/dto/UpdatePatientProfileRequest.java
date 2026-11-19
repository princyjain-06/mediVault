package com.medivault.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdatePatientProfileRequest {

    @NotBlank(message = "Name is required")
    private String name;

    @PastOrPresent(message = "Date of birth cannot be in the future")
    private LocalDate dateOfBirth;

    @Pattern(regexp = "^(MALE|FEMALE|OTHER)?$", message = "Gender must be one of: MALE, FEMALE, OTHER")
    private String gender;

    @Pattern(regexp = "^(A\\+|A-|B\\+|B-|AB\\+|AB-|O\\+|O-)?$", message = "Blood group must be one of: A+, A-, B+, B-, AB+, AB-, O+, O-")
    private String bloodGroup;

    @Pattern(regexp = "^(\\d{10})?$", message = "Phone number must be exactly 10 digits")
    private String phone;

    private String abhaId;

    private EmergencyContactDto emergencyContact;
}
