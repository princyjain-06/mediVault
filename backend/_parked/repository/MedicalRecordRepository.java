package com.medivault.repository;

import com.medivault.model.MedicalRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MedicalRecordRepository extends JpaRepository<MedicalRecord, String> {
    List<MedicalRecord> findByPatientId(String patientId);
}
