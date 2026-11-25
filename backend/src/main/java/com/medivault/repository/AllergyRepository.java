package com.medivault.repository;

import com.medivault.model.Allergy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AllergyRepository extends JpaRepository<Allergy, String> {
    List<Allergy> findByPatient_IdOrderByCreatedAtDesc(String patientId);
    Optional<Allergy> findByIdAndPatient_Id(String id, String patientId);
    List<Allergy> findByPatient_IdAndDocument_Id(String patientId, String documentId);
}
