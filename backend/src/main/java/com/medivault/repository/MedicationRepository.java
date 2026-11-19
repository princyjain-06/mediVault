package com.medivault.repository;

import com.medivault.model.Medication;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MedicationRepository extends JpaRepository<Medication, String> {
    // Scoped by patient.id to prevent cross-patient data access
    List<Medication> findByPatient_IdOrderByPrescribedDateDesc(String patientId);
    List<Medication> findByPatient_IdAndDocument_Id(String patientId, String documentId);
    Optional<Medication> findByIdAndPatient_Id(String id, String patientId);
}
