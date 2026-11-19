package com.medivault.service;

import com.medivault.dto.EmergencyContactRequest;
import com.medivault.dto.EmergencyContactResponse;
import com.medivault.exception.ResourceNotFoundException;
import com.medivault.model.EmergencyContact;
import com.medivault.model.Patient;
import com.medivault.repository.EmergencyContactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class EmergencyContactService {

    private final EmergencyContactRepository contactRepository;
    private final PatientService patientService;

    /**
     * Sanitizes and validates a phone number: removes spaces, dashes, parentheses.
     * Must be exactly 10 digits.
     */
    public static String cleanAndValidatePhone(String rawPhone) {
        if (rawPhone == null) {
            throw new IllegalArgumentException("Phone number is required");
        }
        String clean = rawPhone.replaceAll("[\\s\\-\\(\\)\\+]", "").trim();
        // If user entered +91 or country code, strip 91 if length is 12
        if (clean.length() == 12 && clean.startsWith("91")) {
            clean = clean.substring(2);
        }
        if (!clean.matches("^\\d{10}$")) {
            throw new IllegalArgumentException("Phone number must be exactly 10 digits");
        }
        return clean;
    }

    /**
     * GET /api/patients/me/emergency-contacts
     * Returns list of emergency contacts with the primary contact first.
     */
    @Transactional(readOnly = true)
    public List<EmergencyContactResponse> getContacts(String userEmail) {
        Patient patient = patientService.getPatientByEmail(userEmail);
        return contactRepository.findByPatient_IdOrderByIsPrimaryDescCreatedAtAsc(patient.getId())
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    /**
     * POST /api/patients/me/emergency-contacts
     * Adds a new emergency contact.
     * Rule: The first contact added is always primary.
     * Rule: If this contact is marked primary, all other contacts for the patient become non-primary.
     */
    @Transactional
    public EmergencyContactResponse createContact(String userEmail, EmergencyContactRequest request) {
        Patient patient = patientService.getPatientByEmail(userEmail);
        String cleanPhone = cleanAndValidatePhone(request.getPhone());

        long count = contactRepository.countByPatient_Id(patient.getId());
        // First contact is always primary
        boolean makePrimary = (count == 0) || Boolean.TRUE.equals(request.getIsPrimary());

        if (makePrimary && count > 0) {
            contactRepository.clearPrimaryForPatient(patient.getId());
        }

        EmergencyContact contact = EmergencyContact.builder()
                .patient(patient)
                .name(request.getName().trim())
                .relationship(request.getRelationship() != null ? request.getRelationship().trim() : null)
                .phone(cleanPhone)
                .isPrimary(makePrimary)
                .build();

        EmergencyContact saved = contactRepository.save(contact);
        return toResponse(saved);
    }

    /**
     * PUT /api/patients/me/emergency-contacts/{id}
     * Updates an existing contact.
     * Returns 404 if contact does not belong to logged-in patient.
     */
    @Transactional
    public EmergencyContactResponse updateContact(String userEmail, String contactId, EmergencyContactRequest request) {
        Patient patient = patientService.getPatientByEmail(userEmail);
        EmergencyContact contact = contactRepository.findByIdAndPatient_Id(contactId, patient.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Emergency contact not found: " + contactId));

        String cleanPhone = cleanAndValidatePhone(request.getPhone());
        boolean shouldBePrimary = Boolean.TRUE.equals(request.getIsPrimary());

        if (shouldBePrimary) {
            contactRepository.clearPrimaryForPatientExcept(patient.getId(), contact.getId());
            contact.setIsPrimary(true);
        } else {
            // If demoting current primary, check if it was the only contact. If so, keep it primary.
            long count = contactRepository.countByPatient_Id(patient.getId());
            if (count == 1) {
                contact.setIsPrimary(true);
            } else {
                contact.setIsPrimary(false);
            }
        }

        contact.setName(request.getName().trim());
        contact.setRelationship(request.getRelationship() != null ? request.getRelationship().trim() : null);
        contact.setPhone(cleanPhone);

        EmergencyContact updated = contactRepository.save(contact);
        return toResponse(updated);
    }

    /**
     * DELETE /api/patients/me/emergency-contacts/{id}
     * Deletes contact.
     * Rule: If the deleted contact was primary and others remain, make the oldest remaining contact primary.
     */
    @Transactional
    public void deleteContact(String userEmail, String contactId) {
        Patient patient = patientService.getPatientByEmail(userEmail);
        EmergencyContact contact = contactRepository.findByIdAndPatient_Id(contactId, patient.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Emergency contact not found: " + contactId));

        boolean wasPrimary = Boolean.TRUE.equals(contact.getIsPrimary());
        contactRepository.delete(contact);
        contactRepository.flush();

        if (wasPrimary) {
            // Find oldest remaining contact and promote it to primary
            contactRepository.findFirstByPatient_IdOrderByCreatedAtAsc(patient.getId())
                    .ifPresent(oldest -> {
                        oldest.setIsPrimary(true);
                        contactRepository.save(oldest);
                    });
        }
    }

    private EmergencyContactResponse toResponse(EmergencyContact c) {
        return EmergencyContactResponse.builder()
                .id(c.getId())
                .name(c.getName())
                .relationship(c.getRelationship())
                .phone(c.getPhone())
                .isPrimary(c.getIsPrimary())
                .createdAt(c.getCreatedAt())
                .build();
    }
}
