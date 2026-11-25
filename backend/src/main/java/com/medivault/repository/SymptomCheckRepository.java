package com.medivault.repository;

import com.medivault.model.SymptomCheck;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SymptomCheckRepository extends JpaRepository<SymptomCheck, String> {
    List<SymptomCheck> findByPatient_IdOrderByCreatedAtDesc(String patientId);
    Optional<SymptomCheck> findByIdAndPatient_Id(String id, String patientId);
    long countByPatient_IdAndCreatedAtAfter(String patientId, LocalDateTime after);
}
