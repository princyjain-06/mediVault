package com.medivault.model;

import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "medical_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MedicalRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    private String title;
    private String category; // lab | prescription | radiology | consultation | discharge
    private String doctor;
    private String facility;
    private String date;
    private String fileUrl;

    @Column(length = 2000)
    private String summary;

    @ElementCollection
    @CollectionTable(name = "record_ai_findings", joinColumns = @JoinColumn(name = "record_id"))
    @Column(name = "finding")
    private List<String> aiKeyFindings;

    @ElementCollection
    @CollectionTable(name = "record_tags", joinColumns = @JoinColumn(name = "record_id"))
    @Column(name = "tag")
    private List<String> tags;

    private boolean isEncrypted;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private Patient patient;
}
