package com.medivault.repository;

import com.medivault.model.EmergencyContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EmergencyContactRepository extends JpaRepository<EmergencyContact, String> {
    
    // Ordered with primary first, then oldest to newest
    List<EmergencyContact> findByPatient_IdOrderByIsPrimaryDescCreatedAtAsc(String patientId);

    // Oldest contact for a patient
    Optional<EmergencyContact> findFirstByPatient_IdOrderByCreatedAtAsc(String patientId);

    // Single contact scoped to patient
    Optional<EmergencyContact> findByIdAndPatient_Id(String id, String patientId);

    // Count of contacts for a patient
    long countByPatient_Id(String patientId);

    // Reset primary status for all contacts of a patient
    @Modifying
    @Query("UPDATE EmergencyContact e SET e.isPrimary = false WHERE e.patient.id = :patientId")
    void clearPrimaryForPatient(@Param("patientId") String patientId);

    // Reset primary status for all contacts except a specific one
    @Modifying
    @Query("UPDATE EmergencyContact e SET e.isPrimary = false WHERE e.patient.id = :patientId AND e.id != :contactId")
    void clearPrimaryForPatientExcept(@Param("patientId") String patientId, @Param("contactId") String contactId);
}
