package com.medivault.repository;

import com.medivault.model.Patient;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface PatientRepository extends JpaRepository<Patient, String> {
    List<Patient> findByUser_Id(String userId);
}
