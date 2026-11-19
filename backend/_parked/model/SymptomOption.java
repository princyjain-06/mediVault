package com.medivault.model._parked;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "symptom_options")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SymptomOption {

    @Id
    private String id;

    private String name;
    private String category; // General | Respiratory | Cardiovascular | Neurological | ...
    private String description;
}
