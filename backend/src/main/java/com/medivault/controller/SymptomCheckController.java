package com.medivault.controller;

import com.medivault.dto.SymptomCheckRequest;
import com.medivault.dto.SymptomCheckResponse;
import com.medivault.dto.SymptomCheckSummaryResponse;
import com.medivault.service.SymptomCheckService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST endpoints for personalized symptom checks.
 * Always resolves the patient from the authenticated JWT token; never accepts a patientId from the client.
 */
@RestController
@RequestMapping("/api/symptom-checks")
@RequiredArgsConstructor
public class SymptomCheckController {

    private final SymptomCheckService symptomCheckService;

    @PostMapping
    public ResponseEntity<SymptomCheckResponse> analyzeSymptoms(
            Authentication authentication,
            @Valid @RequestBody SymptomCheckRequest request
    ) {
        return ResponseEntity.ok(symptomCheckService.analyzeSymptoms(authentication.getName(), request));
    }

    @GetMapping
    public ResponseEntity<List<SymptomCheckSummaryResponse>> listChecks(Authentication authentication) {
        return ResponseEntity.ok(symptomCheckService.listChecks(authentication.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SymptomCheckResponse> getCheckById(
            Authentication authentication,
            @PathVariable String id
    ) {
        return ResponseEntity.ok(symptomCheckService.getCheckById(authentication.getName(), id));
    }
}
