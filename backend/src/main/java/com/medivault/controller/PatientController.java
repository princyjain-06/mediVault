package com.medivault.controller;

import com.medivault.dto.PatientProfileResponse;
import com.medivault.dto.UpdatePatientProfileRequest;
import com.medivault.model.Patient;
import com.medivault.service.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    /**
     * GET /api/patients/me
     * Returns profile of the currently logged-in patient.
     */
    @GetMapping("/me")
    public ResponseEntity<PatientProfileResponse> getMyProfile(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(patientService.getMyProfile(email));
    }

    /**
     * PUT /api/patients/me
     * Updates profile & primary emergency contact for the currently logged-in patient.
     * Never accepts a patientId from the URL or body — always scoped to the JWT user.
     */
    @PutMapping("/me")
    public ResponseEntity<PatientProfileResponse> updateMyProfile(
            Authentication authentication,
            @Valid @RequestBody UpdatePatientProfileRequest request
    ) {
        String email = authentication.getName();
        return ResponseEntity.ok(patientService.updateMyProfile(email, request));
    }

    /** GET /api/patients (read-only for demo / listing) */
    @GetMapping
    public ResponseEntity<List<Patient>> getAll() {
        return ResponseEntity.ok(patientService.getAllPatients());
    }

    /** GET /api/patients/{id} (read-only by id) */
    @GetMapping("/{id}")
    public ResponseEntity<Patient> getById(@PathVariable String id) {
        return ResponseEntity.ok(patientService.getPatientById(id));
    }
}
