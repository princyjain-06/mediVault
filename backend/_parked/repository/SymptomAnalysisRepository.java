package com.medivault.repository._parked;

import com.medivault.model.SymptomAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SymptomAnalysisRepository extends JpaRepository<SymptomAnalysis, String> {
    List<SymptomAnalysis> findByPatientIdOrderByCheckDateDesc(String patientId);
}
