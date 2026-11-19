package com.medivault.model._parked;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "allergies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Allergy {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String allergen;
    private String reaction;
    private String severity; // mild | moderate | severe

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;
}
