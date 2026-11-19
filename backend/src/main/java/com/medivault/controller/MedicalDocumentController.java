package com.medivault.controller;

import com.medivault.model.MedicalDocument;
import com.medivault.repository.MedicalDocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller for patient medical documents.
 * Queries are strictly scoped by patientId.
 */
@RestController
@RequestMapping("/api/patients/{patientId}/documents")
@RequiredArgsConstructor
public class MedicalDocumentController {

    private final MedicalDocumentRepository documentRepository;

    @GetMapping
    public ResponseEntity<List<MedicalDocument>> getDocuments(@PathVariable String patientId) {
        return ResponseEntity.ok(documentRepository.findByPatient_IdOrderByUploadedAtDesc(patientId));
    }

    @GetMapping("/{documentId}")
    public ResponseEntity<MedicalDocument> getDocumentById(
            @PathVariable String patientId,
            @PathVariable String documentId
    ) {
        return documentRepository.findByIdAndPatient_Id(documentId, patientId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{documentId}")
    public ResponseEntity<Void> deleteDocument(
            @PathVariable String patientId,
            @PathVariable String documentId
    ) {
        return documentRepository.findByIdAndPatient_Id(documentId, patientId)
                .map(doc -> {
                    documentRepository.delete(doc);
                    return ResponseEntity.noContent().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
