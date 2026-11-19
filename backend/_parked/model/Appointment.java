package com.medivault.model._parked;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "appointments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String patientId;
    private String doctorName;
    private String specialty;
    private String hospital;
    private String date;
    private String time;
    private String status; // upcoming | completed | cancelled
    private String type;   // in-person | video
    private String notes;
}
