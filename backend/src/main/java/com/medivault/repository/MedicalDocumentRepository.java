package com.medivault.repository;

import com.medivault.model.MedicalDocument;
import com.medivault.model.enums.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MedicalDocumentRepository extends JpaRepository<MedicalDocument, String> {
    // Scoped strictly by patient.id to prevent cross-patient data access
    List<MedicalDocument> findByPatient_IdOrderByUploadedAtDesc(String patientId);
    List<MedicalDocument> findByPatient_IdAndDocumentTypeOrderByUploadedAtDesc(String patientId, DocumentType documentType);
    Optional<MedicalDocument> findByIdAndPatient_Id(String id, String patientId);
}
