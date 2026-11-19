package com.medivault.model._parked;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "conditions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Condition {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String name;
    private String diagnosedDate;
    private String status;   // active | managed | resolved
    private String severity; // mild | moderate | severe
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;
}
