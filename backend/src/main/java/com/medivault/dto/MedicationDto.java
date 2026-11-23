package com.medivault.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicationDto {
    private String id;
    private String documentId;
    private String name;
    private String dosage;
    private String frequency;
    private String duration;
    private LocalDate prescribedDate;
    private BigDecimal confidence;
    private boolean verified;
    private LocalDateTime createdAt;
}
