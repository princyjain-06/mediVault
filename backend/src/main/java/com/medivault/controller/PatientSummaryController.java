package com.medivault.controller;

import com.medivault.dto.PatientRecordSummaryResponse;
import com.medivault.service.PatientSummaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/patients/me/records/summary")
@RequiredArgsConstructor
public class PatientSummaryController {

    private final PatientSummaryService summaryService;

    @GetMapping
    public ResponseEntity<PatientRecordSummaryResponse> getSummary(Authentication authentication) {
        String email = authentication.getName();
        return ResponseEntity.ok(summaryService.generateSummary(email));
    }

    @GetMapping(value = "/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> getSummaryPdf(Authentication authentication) {
        String email = authentication.getName();
        byte[] pdfBytes = summaryService.generateSummaryPdf(email);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", "medivault-health-summary.pdf");
        headers.setContentLength(pdfBytes.length);

        return ResponseEntity.ok()
                .headers(headers)
                .body(pdfBytes);
    }
}
