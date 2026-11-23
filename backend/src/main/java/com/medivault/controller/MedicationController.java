package com.medivault.controller;

import com.medivault.dto.MedicationDto;
import com.medivault.service.MedicationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for patient medications.
 * Scoped to the currently logged-in patient.
 */
@RestController
@RequestMapping("/api/patients/me/medications")
@RequiredArgsConstructor
public class MedicationController {

    private final MedicationService medicationService;

    /** GET /api/patients/me/medications - all medications for the logged-in patient */
    @GetMapping
    public ResponseEntity<List<MedicationDto>> getMyMedications(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(medicationService.getMyMedications(email));
    }

    /** DELETE /api/patients/me/medications/{id} - delete a medication */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteMedication(
            Authentication authentication,
            @PathVariable String id
    ) {
        String email = authentication.getName();
        medicationService.deleteMedication(email, id);
        return ResponseEntity.noContent().build();
    }
}
