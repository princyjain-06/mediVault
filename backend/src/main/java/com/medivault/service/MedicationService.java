package com.medivault.service;

import com.medivault.dto.MedicationDto;
import com.medivault.exception.ResourceNotFoundException;
import com.medivault.model.Medication;
import com.medivault.model.Patient;
import com.medivault.repository.MedicationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MedicationService {

    private final MedicationRepository medicationRepository;
    private final PatientService patientService;

    @Transactional(readOnly = true)
    public List<MedicationDto> getMyMedications(String email) {
        Patient patient = patientService.getPatientByEmail(email);
        return medicationRepository.findByPatient_IdOrderByPrescribedDateDesc(patient.getId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MedicationDto> getMedicationsByDocument(String email, String documentId) {
        Patient patient = patientService.getPatientByEmail(email);
        return medicationRepository.findByPatient_IdAndDocument_Id(patient.getId(), documentId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public void deleteMedication(String email, String medicationId) {
        Patient patient = patientService.getPatientByEmail(email);
        Medication med = medicationRepository.findByIdAndPatient_Id(medicationId, patient.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Medication not found: " + medicationId));
        medicationRepository.delete(med);
    }

    public MedicationDto toDto(Medication med) {
        return MedicationDto.builder()
                .id(med.getId())
                .documentId(med.getDocumentId())
                .name(med.getName())
                .dosage(med.getDosage())
                .frequency(med.getFrequency())
                .duration(med.getDuration())
                .prescribedDate(med.getPrescribedDate())
                .confidence(med.getConfidence())
                .verified(med.isVerified())
                .createdAt(med.getCreatedAt())
                .build();
    }
}
