package com.medivault.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medivault.dto.SymptomCheckRequest;
import com.medivault.dto.SymptomCheckResponse;
import com.medivault.model.Patient;
import com.medivault.model.SymptomCheck;
import com.medivault.model.enums.DurationUnit;
import com.medivault.model.enums.UrgencyLevel;
import com.medivault.repository.SymptomCheckRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SymptomCheckServiceTest {

    @Mock
    private PatientService patientService;

    @Mock
    private HealthContextService healthContextService;

    @Spy
    private SymptomSafetyRules safetyRules = new SymptomSafetyRules();

    @Mock
    private GeminiClient geminiClient;

    @Mock
    private SymptomCheckRepository symptomCheckRepository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private SymptomCheckService symptomCheckService;

    private Patient testPatient;

    @BeforeEach
    void setUp() {
        testPatient = Patient.builder()
                .id("pat-test-01")
                .name("Test User")
                .build();
    }

    @Test
    @DisplayName("AI returning SELF_CARE for 'sudden chest pain' must still return EMERGENCY due to safety rule override")
    void testSafetyRuleOverridesAiSelfCare() throws Exception {
        when(patientService.getPatientByEmail("user@example.com")).thenReturn(testPatient);
        when(symptomCheckRepository.countByPatient_IdAndCreatedAtAfter(eq("pat-test-01"), any())).thenReturn(0L);
        when(healthContextService.buildContext(testPatient)).thenReturn(
                HealthContextService.HealthContextResult.builder()
                        .historyText("Profile: Age 30")
                        .sourceMap(Map.of())
                        .build()
        );
        when(geminiClient.isConfigured()).thenReturn(true);
        when(geminiClient.getModelName()).thenReturn("gemini-3.5-flash-lite");

        // AI hallucinating SELF_CARE
        String mockAiJson = """
                {
                  "urgency": "SELF_CARE",
                  "urgencyReason": "Take rest",
                  "summary": "Rest quietly.",
                  "possibleCauses": [],
                  "historyLinks": [],
                  "medicineWarnings": [],
                  "nextSteps": ["Drink water"],
                  "homeCare": [],
                  "warningSigns": [],
                  "questionsForDoctor": []
                }
                """;
        when(geminiClient.generateJson(anyString(), anyString(), anyDouble())).thenReturn(mockAiJson);
        when(symptomCheckRepository.save(any(SymptomCheck.class))).thenAnswer(i -> {
            SymptomCheck sc = i.getArgument(0);
            sc.setId("chk-001");
            sc.setCreatedAt(LocalDateTime.now());
            return sc;
        });

        SymptomCheckRequest request = SymptomCheckRequest.builder()
                .symptoms("Sudden chest pain radiating to left arm")
                .selectedSymptoms(List.of("Chest pain"))
                .severity(9)
                .durationValue(1)
                .durationUnit(DurationUnit.HOURS)
                .build();

        SymptomCheckResponse response = symptomCheckService.analyzeSymptoms("user@example.com", request);

        assertEquals(UrgencyLevel.EMERGENCY, response.getUrgency());
        assertTrue(response.isSafetyRuleApplied());
        assertTrue(response.getNextSteps().get(0).contains("Call 112"));
        assertNotNull(response.getDisclaimer());
    }

    @Test
    @DisplayName("Invalid/hallucinated sourceIds from AI are removed, valid ones resolved to clickable link objects")
    void testInvalidSourceIdsRemoved() throws Exception {
        when(patientService.getPatientByEmail("user@example.com")).thenReturn(testPatient);
        when(symptomCheckRepository.countByPatient_IdAndCreatedAtAfter(eq("pat-test-01"), any())).thenReturn(0L);

        HealthContextService.SourceRef validRef = HealthContextService.SourceRef.builder()
                .refId("L1")
                .label("Hemoglobin 10.2 (LOW)")
                .type(HealthContextService.SourceType.LAB_RESULT)
                .rowId("row-1")
                .documentId("doc-123")
                .build();

        when(healthContextService.buildContext(testPatient)).thenReturn(
                HealthContextService.HealthContextResult.builder()
                        .historyText("Abnormal labs: [L1] Hemoglobin 10.2 g/dL (LOW)")
                        .sourceMap(Map.of("L1", validRef))
                        .build()
        );
        when(geminiClient.isConfigured()).thenReturn(true);
        when(geminiClient.getModelName()).thenReturn("gemini-3.5-flash-lite");

        // AI includes valid L1 and fake X99, HAL_1
        String mockAiJson = """
                {
                  "urgency": "SEE_DOCTOR",
                  "urgencyReason": "Possible anemia",
                  "summary": "Fatigue correlates with lab history.",
                  "historyLinks": [
                    { "text": "May correlate with low hemoglobin", "sourceIds": ["L1", "X99", "HAL_1"] }
                  ],
                  "possibleCauses": [
                    { "name": "Iron Deficiency Anemia", "likelihood": "HIGH", "reason": "Low Hb", "sourceIds": ["L1", "FAKE_9"] }
                  ],
                  "medicineWarnings": [],
                  "nextSteps": [],
                  "homeCare": [],
                  "warningSigns": [],
                  "questionsForDoctor": []
                }
                """;
        when(geminiClient.generateJson(anyString(), anyString(), anyDouble())).thenReturn(mockAiJson);
        when(symptomCheckRepository.save(any(SymptomCheck.class))).thenAnswer(i -> {
            SymptomCheck sc = i.getArgument(0);
            sc.setId("chk-002");
            sc.setCreatedAt(LocalDateTime.now());
            return sc;
        });

        SymptomCheckRequest request = SymptomCheckRequest.builder()
                .symptoms("Feeling dizzy and exhausted")
                .severity(4)
                .durationValue(3)
                .durationUnit(DurationUnit.DAYS)
                .build();

        SymptomCheckResponse response = symptomCheckService.analyzeSymptoms("user@example.com", request);

        assertEquals(UrgencyLevel.SEE_DOCTOR, response.getUrgency());
        // Verify history link sources only has L1 (X99 and HAL_1 stripped)
        assertEquals(1, response.getHistoryLinks().get(0).getSources().size());
        assertEquals("L1", response.getHistoryLinks().get(0).getSources().get(0).getRefId());
        assertEquals("doc-123", response.getHistoryLinks().get(0).getSources().get(0).getDocumentId());
        // Verify cause sources only has L1 (FAKE_9 stripped)
        assertEquals(1, response.getPossibleCauses().get(0).getSources().size());
        assertEquals("L1", response.getPossibleCauses().get(0).getSources().get(0).getRefId());
    }

    @Test
    @DisplayName("When AI call throws an error, fallback response is returned gracefully with ai_available = false (never 500)")
    void testGracefulFallbackWhenAiFails() throws Exception {
        when(patientService.getPatientByEmail("user@example.com")).thenReturn(testPatient);
        when(symptomCheckRepository.countByPatient_IdAndCreatedAtAfter(eq("pat-test-01"), any())).thenReturn(0L);
        when(healthContextService.buildContext(testPatient)).thenReturn(
                HealthContextService.HealthContextResult.builder()
                        .historyText("No medical history available yet.")
                        .sourceMap(Map.of())
                        .build()
        );
        when(geminiClient.isConfigured()).thenReturn(true);
        when(geminiClient.generateJson(anyString(), anyString(), anyDouble()))
                .thenThrow(new RuntimeException("Gemini API connection timeout"));

        when(symptomCheckRepository.save(any(SymptomCheck.class))).thenAnswer(i -> {
            SymptomCheck sc = i.getArgument(0);
            sc.setId("chk-003");
            sc.setCreatedAt(LocalDateTime.now());
            return sc;
        });

        SymptomCheckRequest request = SymptomCheckRequest.builder()
                .symptoms("Mild sore throat")
                .severity(3)
                .durationValue(2)
                .durationUnit(DurationUnit.DAYS)
                .build();

        SymptomCheckResponse response = symptomCheckService.analyzeSymptoms("user@example.com", request);

        assertNotNull(response);
        assertFalse(response.isAiAvailable());
        assertEquals(UrgencyLevel.SEE_DOCTOR, response.getUrgency());
        assertNotNull(response.getSummary());
        assertTrue(response.getWarningSigns().size() > 0);
        assertNotNull(response.getDisclaimer());
    }

    @Test
    @DisplayName("Exceeding 10 checks in 1 hour throws 429 Too Many Requests")
    void testRateLimitEnforced() {
        when(patientService.getPatientByEmail("user@example.com")).thenReturn(testPatient);
        when(symptomCheckRepository.countByPatient_IdAndCreatedAtAfter(eq("pat-test-01"), any())).thenReturn(10L);

        SymptomCheckRequest request = SymptomCheckRequest.builder()
                .symptoms("Headache")
                .severity(3)
                .durationValue(1)
                .durationUnit(DurationUnit.DAYS)
                .build();

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () ->
                symptomCheckService.analyzeSymptoms("user@example.com", request));

        assertEquals(429, ex.getStatusCode().value());
    }
}
