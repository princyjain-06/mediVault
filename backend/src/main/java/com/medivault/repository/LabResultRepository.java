package com.medivault.repository;

import com.medivault.model.LabResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface LabResultRepository extends JpaRepository<LabResult, String> {
    // Scoped by patient.id to prevent cross-patient data access
    List<LabResult> findByPatient_IdOrderByResultDateDesc(String patientId);
    List<LabResult> findByPatient_IdAndDocument_Id(String patientId, String documentId);

    // Fast trends query using index (patient_id, canonical_test_name, result_date)
    List<LabResult> findByPatient_IdAndCanonicalTestNameIgnoreCaseOrderByResultDateAsc(String patientId, String canonicalTestName);

    Optional<LabResult> findByIdAndPatient_Id(String id, String patientId);
}
