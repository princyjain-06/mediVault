package com.medivault.controller;

import com.medivault.dto.ConditionRequest;
import com.medivault.dto.ConditionResponse;
import com.medivault.service.ConditionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST endpoints for managing the logged-in patient's conditions.
 */
@RestController
@RequestMapping("/api/patients/me/conditions")
@RequiredArgsConstructor
public class ConditionController {

    private final ConditionService conditionService;

    @GetMapping
    public ResponseEntity<List<ConditionResponse>> getConditions(Authentication authentication) {
        return ResponseEntity.ok(conditionService.getConditions(authentication.getName()));
    }

    @PostMapping
    public ResponseEntity<ConditionResponse> createCondition(
            Authentication authentication,
            @Valid @RequestBody ConditionRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(conditionService.createCondition(authentication.getName(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ConditionResponse> updateCondition(
            Authentication authentication,
            @PathVariable String id,
            @Valid @RequestBody ConditionRequest request
    ) {
        return ResponseEntity.ok(conditionService.updateCondition(authentication.getName(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCondition(
            Authentication authentication,
            @PathVariable String id
    ) {
        conditionService.deleteCondition(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }
}
