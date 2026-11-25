package com.medivault.dto;

import com.medivault.model.enums.AllergySeverity;
import com.medivault.model.enums.RecordSource;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AllergyResponse {
    private String id;
    private String documentId;
    private String allergen;
    private String reaction;
    private AllergySeverity severity;
    private RecordSource source;
    private Boolean verified;
    private LocalDateTime createdAt;
}
