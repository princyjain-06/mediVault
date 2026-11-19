package com.medivault.model._parked;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "vitals_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VitalsEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String date;
    private int bloodPressureSys;
    private int bloodPressureDia;
    private int heartRate;
    private double bloodSugar;
    private double weight;
    private double oxygenLevel;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;
}
