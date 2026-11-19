package com.medivault.controller;

import com.medivault.dto.EmergencyContactRequest;
import com.medivault.dto.EmergencyContactResponse;
import com.medivault.service.EmergencyContactService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for managing emergency contacts for the currently logged-in patient.
 * Always resolves patient identity via the authenticated JWT token.
 */
@RestController
@RequestMapping("/api/patients/me/emergency-contacts")
@RequiredArgsConstructor
public class EmergencyContactController {

    private final EmergencyContactService contactService;

    /**
     * GET /api/patients/me/emergency-contacts
     * Returns list of emergency contacts, with primary contact first.
     */
    @GetMapping
    public ResponseEntity<List<EmergencyContactResponse>> getContacts(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(contactService.getContacts(email));
    }

    /**
     * POST /api/patients/me/emergency-contacts
     * Adds an emergency contact.
     */
    @PostMapping
    public ResponseEntity<EmergencyContactResponse> createContact(
            Authentication authentication,
            @Valid @RequestBody EmergencyContactRequest request
    ) {
        String email = authentication.getName();
        return ResponseEntity.status(HttpStatus.CREATED).body(contactService.createContact(email, request));
    }

    /**
     * PUT /api/patients/me/emergency-contacts/{id}
     * Updates an emergency contact. Returns 404 if contact does not belong to logged-in patient.
     */
    @PutMapping("/{id}")
    public ResponseEntity<EmergencyContactResponse> updateContact(
            Authentication authentication,
            @PathVariable String id,
            @Valid @RequestBody EmergencyContactRequest request
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(contactService.updateContact(email, id, request));
    }

    /**
     * DELETE /api/patients/me/emergency-contacts/{id}
     * Deletes an emergency contact. Returns 404 if contact does not belong to logged-in patient.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteContact(
            Authentication authentication,
            @PathVariable String id
    ) {
        String email = authentication.getName();
        contactService.deleteContact(email, id);
        return ResponseEntity.noContent().build();
    }
}
