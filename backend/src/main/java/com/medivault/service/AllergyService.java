package com.medivault.service;

import com.medivault.dto.AllergyRequest;
import com.medivault.dto.AllergyResponse;
import com.medivault.exception.ResourceNotFoundException;
import com.medivault.model.Allergy;
import com.medivault.model.Patient;
import com.medivault.model.enums.AllergySeverity;
import com.medivault.model.enums.RecordSource;
import com.medivault.repository.AllergyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * CRUD service for patient allergies, strictly scoped to the logged-in patient.
 */
@Service
@RequiredArgsConstructor
public class AllergyService {

    private final AllergyRepository allergyRepository;
    private final PatientService patientService;

    @Transactional(readOnly = true)
    public List<AllergyResponse> getAllergies(String email) {
        Patient patient = patientService.getPatientByEmail(email);
        return allergyRepository.findByPatient_IdOrderByCreatedAtDesc(patient.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public AllergyResponse createAllergy(String email, AllergyRequest request) {
        Patient patient = patientService.getPatientByEmail(email);
        Allergy allergy = Allergy.builder()
                .patient(patient)
                .allergen(request.getAllergen().trim())
                .reaction(request.getReaction() != null && !request.getReaction().isBlank() ? request.getReaction().trim() : null)
                .severity(request.getSeverity() != null ? request.getSeverity() : AllergySeverity.MODERATE)
                .source(RecordSource.MANUAL)
                .verified(true)
                .build();
        return toResponse(allergyRepository.save(allergy));
    }

    @Transactional
    public AllergyResponse updateAllergy(String email, String id, AllergyRequest request) {
        Patient patient = patientService.getPatientByEmail(email);
        Allergy allergy = allergyRepository.findByIdAndPatient_Id(id, patient.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Allergy not found: " + id));

        allergy.setAllergen(request.getAllergen().trim());
        allergy.setReaction(request.getReaction() != null && !request.getReaction().isBlank() ? request.getReaction().trim() : null);
        if (request.getSeverity() != null) {
            allergy.setSeverity(request.getSeverity());
        }
        return toResponse(allergyRepository.save(allergy));
    }

    @Transactional
    public void deleteAllergy(String email, String id) {
        Patient patient = patientService.getPatientByEmail(email);
        Allergy allergy = allergyRepository.findByIdAndPatient_Id(id, patient.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Allergy not found: " + id));
        allergyRepository.delete(allergy);
    }

    private AllergyResponse toResponse(Allergy a) {
        return AllergyResponse.builder()
                .id(a.getId())
                .documentId(a.getDocumentId())
                .allergen(a.getAllergen())
                .reaction(a.getReaction())
                .severity(a.getSeverity())
                .source(a.getSource())
                .verified(a.getVerified())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
