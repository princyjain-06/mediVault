package com.medivault.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medivault.dto.gemini.GeminiExtractionResponse;
import com.medivault.model.*;
import com.medivault.model.enums.DocumentType;
import com.medivault.model.enums.ExtractionStatus;
import com.medivault.repository.ConditionRepository;
import com.medivault.repository.AllergyRepository;
import com.medivault.repository.DocumentExtractionRepository;
import com.medivault.repository.LabResultRepository;
import com.medivault.repository.MedicalDocumentRepository;
import com.medivault.repository.MedicationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExtractionServiceTest {

    @Mock private GeminiClient geminiClient;
    @Mock private ClinicalDataCleaner clinicalDataCleaner;
    @Mock private TextExtractionService textExtractionService;
    @Mock private ClinicalExtractionService clinicalExtractionService;
    @Mock private LabResultRepository labResultRepository;
    @Mock private MedicationRepository medicationRepository;
    @Mock private ConditionRepository conditionRepository;
    @Mock private AllergyRepository allergyRepository;
    @Mock private DocumentExtractionRepository extractionRepository;
    @Mock private MedicalDocumentRepository documentRepository;
    @Mock private FileStorageService fileStorageService;
    @Mock private DocumentSummarizerService documentSummarizerService;

    private ExtractionService extractionService;
    private Patient testPatient;
    private MedicalDocument testDoc;
    private Path tempFile;

    @BeforeEach
    void setUp() throws Exception {
        extractionService = new ExtractionService(
                geminiClient, clinicalDataCleaner, textExtractionService, clinicalExtractionService,
                labResultRepository, medicationRepository, conditionRepository, allergyRepository,
                extractionRepository, documentRepository,
                fileStorageService, documentSummarizerService, new ObjectMapper()
        );
        ReflectionTestUtils.setField(extractionService, "geminiModel", "gemini-3.5-flash-lite");

        testPatient = Patient.builder().id("pat-100").name("Alice Test").build();
        testDoc = MedicalDocument.builder()
                .id("doc-100")
                .patient(testPatient)
                .documentType(DocumentType.BLOOD_REPORT)
                .contentType("application/pdf")
                .reportDate(LocalDate.now())
                .build();

        tempFile = Files.createTempFile("medivault_test_", ".pdf");
        Files.writeString(tempFile, "Sample content");
    }

    @Test
    @DisplayName("When GEMINI_API_KEY is not configured, fall back to regex parser with ocr_engine = regex-fallback")
    void testFallbackWhenGeminiNotConfigured() {
        when(fileStorageService.resolvePath(testDoc)).thenReturn(tempFile);
        when(geminiClient.isConfigured()).thenReturn(false);
        when(textExtractionService.extractText(tempFile, "application/pdf")).thenReturn("Total WBC Count: 7,200");
        when(clinicalExtractionService.extractLabResults(any(), any(), any())).thenReturn(Collections.emptyList());
        when(clinicalExtractionService.buildStructuredJson(any(), any())).thenReturn("{}");
        when(documentSummarizerService.generateSummary(any(), any(), any(), any())).thenReturn("Summary");
        when(extractionRepository.findByDocument_Id("doc-100")).thenReturn(Optional.empty());

        extractionService.processDocument(testDoc, null);

        // Verify fallback ocr_engine is set
        verify(extractionRepository).save(argThat(ext ->
                "regex-fallback".equals(ext.getOcrEngine()) &&
                ext.getStatus() == ExtractionStatus.DONE
        ));
    }

    @Test
    @DisplayName("When Gemini is configured and extraction succeeds, save DONE status with gemini engine")
    void testGeminiExtractionSuccess() throws Exception {
        when(fileStorageService.resolvePath(testDoc)).thenReturn(tempFile);
        when(geminiClient.isConfigured()).thenReturn(true);

        GeminiExtractionResponse geminiResp = new GeminiExtractionResponse();
        geminiResp.setRawText("Gemini raw text");
        when(geminiClient.extract(any(), any())).thenReturn(geminiResp);
        when(documentSummarizerService.generateSummary(any(), any(), any(), any())).thenReturn("AI Summary");
        when(extractionRepository.findByDocument_Id("doc-100")).thenReturn(Optional.empty());

        extractionService.processDocument(testDoc, null);

        // Verify gemini engine and DONE status
        verify(extractionRepository).save(argThat(ext ->
                "gemini-gemini-3.5-flash-lite".equals(ext.getOcrEngine()) &&
                ext.getStatus() == ExtractionStatus.DONE
        ));
    }

    @Test
    @DisplayName("Retry extraction throws error if document file is missing on disk")
    void testRetryThrowsIfFileNotFound() {
        Path missingPath = Path.of("/tmp/non_existent_file_" + System.currentTimeMillis() + ".pdf");
        when(fileStorageService.resolvePath(testDoc)).thenReturn(missingPath);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                extractionService.retryExtraction(testDoc)
        );
        assertTrue(ex.getMessage().contains("Document file not found on disk"));
    }
}
