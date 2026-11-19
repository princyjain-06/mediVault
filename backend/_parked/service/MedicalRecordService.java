package com.medivault.service;

import com.medivault.exception.ResourceNotFoundException;
import com.medivault.model.MedicalRecord;
import com.medivault.model.Patient;
import com.medivault.repository.MedicalRecordRepository;
import com.medivault.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MedicalRecordService {

    private final MedicalRecordRepository recordRepository;
    private final PatientRepository patientRepository;

    public List<MedicalRecord> getRecordsByPatient(String patientId) {
        return recordRepository.findByPatientId(patientId);
    }

    public MedicalRecord addRecord(String patientId, MedicalRecord record) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + patientId));
        record.setPatient(patient);
        record.setEncrypted(true);
        return recordRepository.save(record);
    }

    public void deleteRecord(String recordId) {
        recordRepository.deleteById(recordId);
    }
}
