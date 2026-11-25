package com.medivault.repository;

import com.medivault.model.Condition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ConditionRepository extends JpaRepository<Condition, String> {
    List<Condition> findByPatient_IdOrderByCreatedAtDesc(String patientId);
    Optional<Condition> findByIdAndPatient_Id(String id, String patientId);
    List<Condition> findByPatient_IdAndDocument_Id(String patientId, String documentId);
}
