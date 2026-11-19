package com.medivault.controller;

import com.medivault.model.MedicalRecord;
import com.medivault.service.MedicalRecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients/{patientId}/records")
@RequiredArgsConstructor
public class MedicalRecordController {

    private final MedicalRecordService recordService;

    /** GET /api/patients/{patientId}/records */
    @GetMapping
    public ResponseEntity<List<MedicalRecord>> getRecords(@PathVariable String patientId) {
        return ResponseEntity.ok(recordService.getRecordsByPatient(patientId));
    }

    /** POST /api/patients/{patientId}/records */
    @PostMapping
    public ResponseEntity<MedicalRecord> addRecord(@PathVariable String patientId,
                                                    @RequestBody MedicalRecord record) {
        return ResponseEntity.ok(recordService.addRecord(patientId, record));
    }

    /** DELETE /api/patients/{patientId}/records/{recordId} */
    @DeleteMapping("/{recordId}")
    public ResponseEntity<Void> deleteRecord(@PathVariable String patientId,
                                              @PathVariable String recordId) {
        recordService.deleteRecord(recordId);
        return ResponseEntity.noContent().build();
    }
}
