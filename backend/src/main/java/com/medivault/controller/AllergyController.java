package com.medivault.controller;

import com.medivault.dto.AllergyRequest;
import com.medivault.dto.AllergyResponse;
import com.medivault.service.AllergyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST endpoints for managing the logged-in patient's allergies.
 */
@RestController
@RequestMapping("/api/patients/me/allergies")
@RequiredArgsConstructor
public class AllergyController {

    private final AllergyService allergyService;

    @GetMapping
    public ResponseEntity<List<AllergyResponse>> getAllergies(Authentication authentication) {
        return ResponseEntity.ok(allergyService.getAllergies(authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<AllergyResponse> createAllergy(
            Authentication authentication,
            @Valid @RequestBody AllergyRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(allergyService.createAllergy(authentication.getName(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AllergyResponse> updateAllergy(
            Authentication authentication,
            @PathVariable String id,
            @Valid @RequestBody AllergyRequest request
    ) {
        return ResponseEntity.ok(allergyService.updateAllergy(authentication.getName(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAllergy(
            Authentication authentication,
            @PathVariable String id
    ) {
        allergyService.deleteAllergy(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
