package com.medivault.service;

import com.medivault.dto.ConditionRequest;
import com.medivault.dto.ConditionResponse;
import com.medivault.exception.ResourceNotFoundException;
import com.medivault.model.Condition;
import com.medivault.model.Patient;
import com.medivault.model.enums.ConditionStatus;
import com.medivault.model.enums.RecordSource;
import com.medivault.repository.ConditionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * CRUD service for patient conditions, strictly scoped to the logged-in patient.
 */
@Service
@RequiredArgsConstructor
public class ConditionService {

    private final ConditionRepository conditionRepository;
    private final PatientService patientService;

    @Transactional(readOnly = true)
    public List<ConditionResponse> getConditions(String email) {
        Patient patient = patientService.getPatientByEmail(email);
        return conditionRepository.findByPatient_IdOrderByCreatedAtDesc(patient.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public ConditionResponse createCondition(String email, ConditionRequest request) {
        Patient patient = patientService.getPatientByEmail(email);
        Condition condition = Condition.builder()
                .patient(patient)
                .name(request.getName().trim())
                .status(request.getStatus() != null ? request.getStatus() : ConditionStatus.ACTIVE)
                .diagnosedDate(request.getDiagnosedDate())
                .source(RecordSource.MANUAL)
                .verified(true)
                .build();
        return toResponse(conditionRepository.save(condition));
    }

    @Transactional
    public ConditionResponse updateCondition(String email, String id, ConditionRequest request) {
        Patient patient = patientService.getPatientByEmail(email);
        Condition condition = conditionRepository.findByIdAndPatient_Id(id, patient.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Condition not found: " + id));

        condition.setName(request.getName().trim());
        if (request.getStatus() != null) {
            condition.setStatus(request.getStatus());
        }
        condition.setDiagnosedDate(request.getDiagnosedDate());
        return toResponse(conditionRepository.save(condition));
    }

    @Transactional
    public void deleteCondition(String email, String id) {
        Patient patient = patientService.getPatientByEmail(email);
        Condition condition = conditionRepository.findByIdAndPatient_Id(id, patient.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Condition not found: " + id));
        conditionRepository.delete(condition);
    }

    private ConditionResponse toResponse(Condition c) {
        return ConditionResponse.builder()
                .id(c.getId())
                .documentId(c.getDocumentId())
                .name(c.getName())
                .status(c.getStatus())
                .diagnosedDate(c.getDiagnosedDate())
                .source(c.getSource())
                .verified(c.getVerified())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
