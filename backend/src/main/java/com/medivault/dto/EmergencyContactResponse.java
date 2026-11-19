package com.medivault.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyContactResponse {
    private String id;
    private String name;
    private String relationship;
    private String phone;
    private Boolean isPrimary;
    private LocalDateTime createdAt;
}
