package com.medivault.model._parked;

import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmergencyContact {
    private String emergencyName;
    private String relationship;
    private String emergencyPhone;
}
