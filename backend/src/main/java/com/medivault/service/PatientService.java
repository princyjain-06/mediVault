package com.medivault.service;

import com.medivault.dto.EmergencyContactDto;
import com.medivault.dto.PatientProfileResponse;
import com.medivault.dto.UpdatePatientProfileRequest;
import com.medivault.exception.ResourceNotFoundException;
import com.medivault.model.AppUser;
import com.medivault.model.EmergencyContact;
import com.medivault.model.Patient;
import com.medivault.repository.AppUserRepository;
import com.medivault.repository.EmergencyContactRepository;
import com.medivault.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final AppUserRepository userRepository;
    private final EmergencyContactRepository emergencyContactRepository;

    /**
     * Resolves the Patient entity belonging to the authenticated user email.
     */
    public Patient getPatientByEmail(String email) {
        AppUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
        List<Patient> patients = patientRepository.findByUser_Id(user.getId());
        if (patients.isEmpty()) {
            throw new ResourceNotFoundException("No patient profile found for user: " + email);
        }
        return patients.get(0);
    }

    /**
     * GET /api/patients/me
     * Returns the profile, email from app_user, primary emergency contact (or null),
     * and profileComplete (true when dateOfBirth, gender, and bloodGroup are all filled).
     */
    @Transactional(readOnly = true)
    public PatientProfileResponse getMyProfile(String email) {
        Patient patient = getPatientByEmail(email);

        Optional<EmergencyContact> contactOpt = emergencyContactRepository
                .findFirstByPatient_IdOrderByCreatedAtAsc(patient.getId());

        EmergencyContactDto contactDto = contactOpt.map(c -> EmergencyContactDto.builder()
                .id(c.getId())
                .name(c.getName())
                .relationship(c.getRelationship())
                .phone(c.getPhone())
                .isPrimary(c.getIsPrimary())
                .createdAt(c.getCreatedAt())
                .build()).orElse(null);

        boolean isComplete = patient.getDateOfBirth() != null
                && StringUtils.hasText(patient.getGender())
                && StringUtils.hasText(patient.getBloodGroup());

        return PatientProfileResponse.builder()
                .id(patient.getId())
                .name(patient.getName())
                .email(email)
                .dateOfBirth(patient.getDateOfBirth())
                .gender(patient.getGender())
                .bloodGroup(patient.getBloodGroup())
                .phone(patient.getPhone())
                .abhaId(patient.getAbhaId())
                .emergencyContact(contactDto)
                .profileComplete(isComplete)
                .build();
    }

    /**
     * PUT /api/patients/me
     * Updates profile fields and creates/updates the primary emergency contact in one transaction.
     */
    @Transactional
    public PatientProfileResponse updateMyProfile(String email, UpdatePatientProfileRequest request) {
        Patient patient = getPatientByEmail(email);

        // Update Patient fields
        patient.setName(request.getName());
        patient.setDateOfBirth(request.getDateOfBirth());
        patient.setGender(request.getGender());
        patient.setBloodGroup(request.getBloodGroup());
        patient.setPhone(request.getPhone());
        patient.setAbhaId(request.getAbhaId());
        patientRepository.save(patient);

        // Also sync name on AppUser for consistency
        AppUser user = patient.getUser();
        if (user != null && !request.getName().equals(user.getName())) {
            user.setName(request.getName());
            userRepository.save(user);
        }

        // Handle Emergency Contact
        EmergencyContactDto contactReq = request.getEmergencyContact();
        EmergencyContactDto savedContactDto = null;

        if (contactReq != null && StringUtils.hasText(contactReq.getName()) && StringUtils.hasText(contactReq.getPhone())) {
            String cleanPhone = EmergencyContactService.cleanAndValidatePhone(contactReq.getPhone());

            EmergencyContact contact = emergencyContactRepository
                    .findFirstByPatient_IdOrderByCreatedAtAsc(patient.getId())
                    .orElseGet(() -> EmergencyContact.builder()
                            .patient(patient)
                            .isPrimary(true)
                            .build());

            contact.setName(contactReq.getName().trim());
            contact.setRelationship(contactReq.getRelationship() != null ? contactReq.getRelationship().trim() : null);
            contact.setPhone(cleanPhone);
            contact = emergencyContactRepository.save(contact);

            savedContactDto = EmergencyContactDto.builder()
                    .id(contact.getId())
                    .name(contact.getName())
                    .relationship(contact.getRelationship())
                    .phone(contact.getPhone())
                    .isPrimary(contact.getIsPrimary())
                    .createdAt(contact.getCreatedAt())
                    .build();
        }

        boolean isComplete = patient.getDateOfBirth() != null
                && StringUtils.hasText(patient.getGender())
                && StringUtils.hasText(patient.getBloodGroup());

        return PatientProfileResponse.builder()
                .id(patient.getId())
                .name(patient.getName())
                .email(email)
                .dateOfBirth(patient.getDateOfBirth())
                .gender(patient.getGender())
                .bloodGroup(patient.getBloodGroup())
                .phone(patient.getPhone())
                .abhaId(patient.getAbhaId())
                .emergencyContact(savedContactDto)
                .profileComplete(isComplete)
                .build();
    }

    public List<Patient> getAllPatients() {
        return patientRepository.findAll();
    }

    public Patient getPatientById(String id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found: " + id));
    }
}
