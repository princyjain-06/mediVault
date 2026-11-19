package com.medivault.controller._parked;

import com.medivault.dto.SymptomCheckRequest;
import com.medivault.model.SymptomAnalysis;
import com.medivault.model.SymptomOption;
import com.medivault.service.SymptomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class SymptomController {

    private final SymptomService symptomService;

    /** GET /api/symptoms/catalog  – Public endpoint */
    @GetMapping("/symptoms/catalog")
    public ResponseEntity<List<SymptomOption>> getCatalog() {
        return ResponseEntity.ok(symptomService.getCatalog());
    }

    /** GET /api/patients/{patientId}/symptom-history */
    @GetMapping("/patients/{patientId}/symptom-history")
    public ResponseEntity<List<SymptomAnalysis>> getHistory(@PathVariable String patientId) {
        return ResponseEntity.ok(symptomService.getHistoryByPatient(patientId));
    }

    /** GET /api/symptom-analyses/{id} */
    @GetMapping("/symptom-analyses/{id}")
    public ResponseEntity<SymptomAnalysis> getById(@PathVariable String id) {
        return ResponseEntity.ok(symptomService.getAnalysisById(id));
    }

    /** POST /api/symptom-analyses  – Run symptom check */
    @PostMapping("/symptom-analyses")
    public ResponseEntity<SymptomAnalysis> analyze(@RequestBody SymptomCheckRequest request) {
        return ResponseEntity.ok(symptomService.analyze(request));
    }
}
