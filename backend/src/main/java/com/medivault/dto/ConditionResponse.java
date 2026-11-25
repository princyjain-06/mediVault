package com.medivault.dto;

import com.medivault.model.enums.ConditionStatus;
import com.medivault.model.enums.RecordSource;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConditionResponse {
    private String id;
    private String documentId;
    private String name;
    private ConditionStatus status;
    private LocalDate diagnosedDate;
    private RecordSource source;
    private Boolean verified;
    private LocalDateTime createdAt;
}
