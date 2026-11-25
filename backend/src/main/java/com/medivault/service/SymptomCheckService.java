package com.medivault.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medivault.dto.SymptomCheckRequest;
import com.medivault.dto.SymptomCheckResponse;
import com.medivault.dto.SymptomCheckSummaryResponse;
import com.medivault.dto.gemini.GeminiSymptomResponse;
import com.medivault.exception.ResourceNotFoundException;
import com.medivault.model.Patient;
import com.medivault.model.SymptomCheck;
import com.medivault.model.enums.UrgencyLevel;
import com.medivault.repository.SymptomCheckRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Orchestrates personalized symptom analysis:
 * 1. Validates input & enforces 10 checks/hour rate limit per patient.
 * 2. Applies deterministic Java safety rules (emergency phrases & severity 10).
 * 3. Builds reference-indexed patient history via HealthContextService.
 * 4. Calls Gemini AI (or falls back gracefully without 500s if unavailable).
 * 5. Filters invalid sourceIds, enforces max(AI urgency, safety floor), adds disclaimer.
 * 6. Saves check + history_snapshot in symptom_checks. Never logs symptoms, history, or AI answers.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SymptomCheckService {

    public static final String DISCLAIMER =
            "This is not a medical diagnosis. Please consult a doctor. In an emergency, call 112.";
    public static final String EMERGENCY_FIRST_STEP =
            "Call 112 or go to the nearest emergency department now.";
    private static final int MAX_CHECKS_PER_HOUR = 10;

    private static final String SYSTEM_INSTRUCTION =
            "You are a careful health information assistant inside a personal health records app. " +
            "You are NOT a doctor and must NOT diagnose. Use ONLY the patient history provided; " +
            "never invent conditions, medicines, allergies or test results. " +
            "Explain in simple language a teenager can understand. The emergency number in India is 112.";

    private final PatientService patientService;
    private final HealthContextService healthContextService;
    private final SymptomSafetyRules safetyRules;
    private final GeminiClient geminiClient;
    private final SymptomCheckRepository symptomCheckRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public SymptomCheckResponse analyzeSymptoms(String email, SymptomCheckRequest request) {
        Patient patient = patientService.getPatientByEmail(email);

        // 1. Validate inputs
        validateRequest(request);

        // 2. Enforce max 10 checks per patient per hour
        long recentCount = symptomCheckRepository.countByPatient_IdAndCreatedAtAfter(
                patient.getId(), LocalDateTime.now().minusHours(1));
        if (recentCount >= MAX_CHECKS_PER_HOUR) {
            throw new ResponseStatusException(
                    HttpStatus.TOO_MANY_REQUESTS,
                    "Hourly limit reached (maximum 10 symptom checks per hour). Please try again later."
            );
        }

        List<String> chips = request.getSelectedSymptoms() != null
                ? request.getSelectedSymptoms().stream().filter(s -> s != null && !s.isBlank()).map(String::trim).toList()
                : Collections.emptyList();
        String symptomsText = request.getSymptoms() != null ? request.getSymptoms().trim() : null;

        // 3. Deterministic Java safety rules
        SymptomSafetyRules.SafetyEvaluation safety = safetyRules.evaluate(symptomsText, chips, request.getSeverity());

        // 4. Build reference-indexed health history
        HealthContextService.HealthContextResult context = healthContextService.buildContext(patient);
        boolean historyAvailable = !"No medical history available yet.".equals(context.getHistoryText());

        // 5. Call Gemini (with graceful fallback)
        SymptomCheckResponse response;
        boolean aiAvailable = false;
        String usedModel = null;

        if (geminiClient.isConfigured()) {
            try {
                String prompt = buildPrompt(context.getHistoryText(), symptomsText, chips, request);
                String rawJson = geminiClient.generateJson(SYSTEM_INSTRUCTION, prompt, 0.2);
                GeminiSymptomResponse aiRes = objectMapper.readValue(rawJson, GeminiSymptomResponse.class);
                response = buildResponseFromAi(aiRes, context.getSourceMap(), safety, request, chips, historyAvailable);
                aiAvailable = true;
                usedModel = geminiClient.getModelName();
            } catch (Exception e) {
                log.warn("Symptom AI unavailable for check (patient={}): {}", patient.getId(), e.getMessage());
                response = buildFallbackResponse(safety, request, chips, historyAvailable);
            }
        } else {
            response = buildFallbackResponse(safety, request, chips, historyAvailable);
        }

        response.setAiAvailable(aiAvailable);
        response.setSafetyRuleApplied(safety.isSafetyRuleApplied());
        response.setDisclaimer(DISCLAIMER);

        // 6. Persist check in symptom_checks
        try {
            String chipsJson = objectMapper.writeValueAsString(chips);
            String resultJson = objectMapper.writeValueAsString(response);

            SymptomCheck entity = SymptomCheck.builder()
                    .patient(patient)
                    .symptoms(symptomsText)
                    .selectedSymptoms(chipsJson)
                    .bodyArea(request.getBodyArea() != null && !request.getBodyArea().isBlank() ? request.getBodyArea().trim() : null)
                    .severity(request.getSeverity())
                    .durationValue(request.getDurationValue())
                    .durationUnit(request.getDurationUnit())
                    .onset(request.getOnset())
                    .urgency(response.getUrgency())
                    .safetyRuleApplied(safety.isSafetyRuleApplied())
                    .aiAvailable(aiAvailable)
                    .resultJson(resultJson)
                    .historySnapshot(context.getHistoryText())
                    .llmModel(usedModel)
                    .build();

            entity = symptomCheckRepository.save(entity);
            response.setId(entity.getId());
            response.setCreatedAt(entity.getCreatedAt());
        } catch (Exception e) {
            throw new RuntimeException("Failed to save symptom check", e);
        }

        return response;
    }

    @Transactional(readOnly = true)
    public List<SymptomCheckSummaryResponse> listChecks(String email) {
        Patient patient = patientService.getPatientByEmail(email);
        return symptomCheckRepository.findByPatient_IdOrderByCreatedAtDesc(patient.getId())
                .stream()
                .map(this::toSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public SymptomCheckResponse getCheckById(String email, String id) {
        Patient patient = patientService.getPatientByEmail(email);
        SymptomCheck entity = symptomCheckRepository.findByIdAndPatient_Id(id, patient.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Symptom check not found: " + id));

        try {
            SymptomCheckResponse saved = objectMapper.readValue(entity.getResultJson(), SymptomCheckResponse.class);
            saved.setId(entity.getId());
            saved.setCreatedAt(entity.getCreatedAt());
            saved.setDisclaimer(DISCLAIMER);
            return saved;
        } catch (Exception e) {
            throw new ResourceNotFoundException("Saved symptom check data could not be read: " + id);
        }
    }

    private void validateRequest(SymptomCheckRequest req) {
        if (req == null) {
            throw new IllegalArgumentException("Symptom check request is required.");
        }
        String text = req.getSymptoms() != null ? req.getSymptoms().trim() : "";
        boolean hasChips = req.getSelectedSymptoms() != null &&
                req.getSelectedSymptoms().stream().anyMatch(s -> s != null && !s.isBlank());

        if (text.isEmpty() && !hasChips) {
            throw new IllegalArgumentException("Please describe your symptoms (3-1000 chars) or select at least one symptom.");
        }
        if (!text.isEmpty() && (text.length() < 3 || text.length() > 1000)) {
            throw new IllegalArgumentException("Symptoms text must be between 3 and 1000 characters.");
        }
        if (req.getSeverity() == null || req.getSeverity() < 1 || req.getSeverity() > 10) {
            throw new IllegalArgumentException("Severity must be between 1 and 10.");
        }
        if (req.getDurationValue() == null || req.getDurationValue() < 1 || req.getDurationValue() > 365 || req.getDurationUnit() == null) {
            throw new IllegalArgumentException("Duration must be between 1 and 365 with a valid unit.");
        }
    }

    private String buildPrompt(
            String historyText,
            String symptomsText,
            List<String> chips,
            SymptomCheckRequest req
    ) {
        return """
                PATIENT HISTORY (cite only using the bracketed reference IDs like L1, T1, M1, A1, C1, D1):
                %s

                CURRENT SYMPTOMS:
                - Description: %s
                - Selected symptoms: %s
                - Body area: %s
                - Severity (1-10): %d
                - Duration: %d %s
                - Onset: %s

                RULES:
                - Return max 5 possible causes, most likely first.
                - Check allergies and current medicines before mentioning any medicine.
                - Say EMERGENCY for possible heart attack, stroke, severe breathing difficulty, severe allergic reaction, fainting, or heavy bleeding.
                - Return ONLY valid JSON matching this exact structure:
                {
                  "urgency": "SELF_CARE | SEE_DOCTOR | EMERGENCY",
                  "urgencyReason": "one sentence",
                  "summary": "2-3 sentences",
                  "historyLinks": [ { "text": "how the symptom may relate to the patient's history", "sourceIds": ["L1","T1"] } ],
                  "possibleCauses": [ { "name": "...", "likelihood": "HIGH | MEDIUM | LOW", "reason": "...", "sourceIds": [] } ],
                  "medicineWarnings": [ { "text": "...", "sourceIds": ["A1","M2"] } ],
                  "nextSteps": ["..."],
                  "homeCare": ["..."],
                  "warningSigns": ["..."],
                  "questionsForDoctor": ["..."]
                }
                """.formatted(
                historyText,
                symptomsText != null && !symptomsText.isBlank() ? symptomsText : "None",
                chips.isEmpty() ? "None" : String.join(", ", chips),
                req.getBodyArea() != null && !req.getBodyArea().isBlank() ? req.getBodyArea() : "Not specified",
                req.getSeverity(),
                req.getDurationValue(),
                req.getDurationUnit().name(),
                req.getOnset() != null ? req.getOnset().name() : "Not specified"
        );
    }

    private SymptomCheckResponse buildResponseFromAi(
            GeminiSymptomResponse ai,
            Map<String, HealthContextService.SourceRef> sourceMap,
            SymptomSafetyRules.SafetyEvaluation safety,
            SymptomCheckRequest req,
            List<String> chips,
            boolean historyAvailable
    ) {
        UrgencyLevel aiUrgency = parseUrgency(ai.getUrgency());
        UrgencyLevel finalUrgency = UrgencyLevel.max(aiUrgency, safety.getFloorUrgency());

        List<SymptomCheckResponse.LinkedTextItem> historyLinks = new ArrayList<>();
        if (ai.getHistoryLinks() != null) {
            for (var item : ai.getHistoryLinks()) {
                if (item.getText() == null || item.getText().isBlank()) continue;
                historyLinks.add(SymptomCheckResponse.LinkedTextItem.builder()
                        .text(item.getText().trim())
                        .sources(resolveSources(item.getSourceIds(), sourceMap))
                        .build());
            }
        }

        List<SymptomCheckResponse.CauseItem> causes = new ArrayList<>();
        if (ai.getPossibleCauses() != null) {
            for (var c : ai.getPossibleCauses().stream().limit(5).toList()) {
                if (c.getName() == null || c.getName().isBlank()) continue;
                causes.add(SymptomCheckResponse.CauseItem.builder()
                        .name(c.getName().trim())
                        .likelihood(c.getLikelihood() != null ? c.getLikelihood().trim().toUpperCase() : "MEDIUM")
                        .reason(c.getReason() != null ? c.getReason().trim() : "")
                        .sources(resolveSources(c.getSourceIds(), sourceMap))
                        .build());
            }
        }

        List<SymptomCheckResponse.LinkedTextItem> medWarnings = new ArrayList<>();
        if (ai.getMedicineWarnings() != null) {
            for (var w : ai.getMedicineWarnings()) {
                if (w.getText() == null || w.getText().isBlank()) continue;
                medWarnings.add(SymptomCheckResponse.LinkedTextItem.builder()
                        .text(w.getText().trim())
                        .sources(resolveSources(w.getSourceIds(), sourceMap))
                        .build());
            }
        }

        List<String> nextSteps = cleanStrings(ai.getNextSteps());
        if (finalUrgency == UrgencyLevel.EMERGENCY) {
            nextSteps = prependEmergencyStep(nextSteps);
        }

        String urgencyReason = ai.getUrgencyReason() != null && !ai.getUrgencyReason().isBlank()
                ? ai.getUrgencyReason().trim()
                : defaultUrgencyReason(finalUrgency);
        if (safety.isRuleEmergency() && aiUrgency != UrgencyLevel.EMERGENCY) {
            urgencyReason = "Emergency warning sign detected (" + safety.getMatchedPhrase() + "). Seek immediate emergency care.";
        }

        return SymptomCheckResponse.builder()
                .symptoms(req.getSymptoms())
                .selectedSymptoms(chips)
                .bodyArea(req.getBodyArea())
                .severity(req.getSeverity())
                .durationValue(req.getDurationValue())
                .durationUnit(req.getDurationUnit())
                .onset(req.getOnset())
                .urgency(finalUrgency)
                .urgencyReason(urgencyReason)
                .summary(ai.getSummary() != null ? ai.getSummary().trim() : urgencyReason)
                .historyLinks(historyLinks)
                .possibleCauses(causes)
                .medicineWarnings(medWarnings)
                .nextSteps(nextSteps)
                .homeCare(cleanStrings(ai.getHomeCare()))
                .warningSigns(cleanStrings(ai.getWarningSigns()))
                .questionsForDoctor(cleanStrings(ai.getQuestionsForDoctor()))
                .historyAvailable(historyAvailable)
                .disclaimer(DISCLAIMER)
                .build();
    }

    private SymptomCheckResponse buildFallbackResponse(
            SymptomSafetyRules.SafetyEvaluation safety,
            SymptomCheckRequest req,
            List<String> chips,
            boolean historyAvailable
    ) {
        UrgencyLevel urgency = safety.isRuleEmergency() ? UrgencyLevel.EMERGENCY : UrgencyLevel.SEE_DOCTOR;
        List<String> nextSteps = new ArrayList<>();
        if (urgency == UrgencyLevel.EMERGENCY) {
            nextSteps.add(EMERGENCY_FIRST_STEP);
        } else {
            nextSteps.add("Schedule an appointment with a qualified doctor to review these symptoms.");
            nextSteps.add("Bring your recent lab reports and current medications list to your visit.");
        }

        return SymptomCheckResponse.builder()
                .symptoms(req.getSymptoms())
                .selectedSymptoms(chips)
                .bodyArea(req.getBodyArea())
                .severity(req.getSeverity())
                .durationValue(req.getDurationValue())
                .durationUnit(req.getDurationUnit())
                .onset(req.getOnset())
                .urgency(urgency)
                .urgencyReason(urgency == UrgencyLevel.EMERGENCY
                        ? "Emergency warning signs were detected. Please seek immediate medical attention."
                        : "Personalised AI analysis is temporarily unavailable, so a doctor review is recommended.")
                .summary("Personalised AI analysis is currently unavailable. Please consult a healthcare professional for an accurate assessment based on your full medical history.")
                .nextSteps(nextSteps)
                .warningSigns(List.of(
                        "Chest pain, pressure, or tightness",
                        "Trouble breathing or shortness of breath at rest",
                        "Sudden weakness, numbness, confusion, or trouble speaking",
                        "Severe allergic swelling of the lips, tongue, or throat",
                        "Fainting, seizures, or heavy bleeding"
                ))
                .questionsForDoctor(List.of(
                        "Could these symptoms be related to my existing medications or lab results?",
                        "What warning signs mean I should seek urgent care?"
                ))
                .historyAvailable(historyAvailable)
                .disclaimer(DISCLAIMER)
                .build();
    }

    /**
     * Resolves AI-cited sourceIds against the real HealthContext map.
     * Any unknown or hallucinated sourceId is silently removed.
     */
    private List<SymptomCheckResponse.SourceLink> resolveSources(
            List<String> rawIds,
            Map<String, HealthContextService.SourceRef> sourceMap
    ) {
        if (rawIds == null || rawIds.isEmpty() || sourceMap == null || sourceMap.isEmpty()) {
            return Collections.emptyList();
        }
        List<SymptomCheckResponse.SourceLink> resolved = new ArrayList<>();
        Set<String> seen = new HashSet<>();
        for (String id : rawIds) {
            if (id == null) continue;
            String cleanId = id.trim().toUpperCase(Locale.ROOT);
            HealthContextService.SourceRef ref = sourceMap.get(cleanId);
            if (ref != null && seen.add(cleanId)) {
                resolved.add(SymptomCheckResponse.SourceLink.builder()
                        .refId(ref.getRefId())
                        .label(ref.getLabel())
                        .type(ref.getType().name())
                        .documentId(ref.getDocumentId())
                        .build());
            }
        }
        return resolved;
    }

    private List<String> prependEmergencyStep(List<String> steps) {
        List<String> result = new ArrayList<>();
        result.add(EMERGENCY_FIRST_STEP);
        for (String s : steps) {
            if (!s.equalsIgnoreCase(EMERGENCY_FIRST_STEP)) {
                result.add(s);
            }
        }
        return result;
    }

    private List<String> cleanStrings(List<String> list) {
        if (list == null) return Collections.emptyList();
        return list.stream().filter(s -> s != null && !s.isBlank()).map(String::trim).toList();
    }

    private UrgencyLevel parseUrgency(String raw) {
        if (raw == null) return UrgencyLevel.SEE_DOCTOR;
        try {
            return UrgencyLevel.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return UrgencyLevel.SEE_DOCTOR;
        }
    }

    private String defaultUrgencyReason(UrgencyLevel level) {
        return switch (level) {
            case EMERGENCY -> "These symptoms require immediate emergency medical attention.";
            case SEE_DOCTOR -> "A doctor should evaluate these symptoms soon.";
            case SELF_CARE -> "These symptoms appear mild and may be managed with self-care while monitoring.";
        };
    }

    private SymptomCheckSummaryResponse toSummary(SymptomCheck entity) {
        List<String> chips = Collections.emptyList();
        String topCause = null;
        try {
            if (entity.getSelectedSymptoms() != null) {
                chips = objectMapper.readValue(entity.getSelectedSymptoms(),
                        objectMapper.getTypeFactory().constructCollectionType(List.class, String.class));
            }
            if (entity.getResultJson() != null) {
                SymptomCheckResponse res = objectMapper.readValue(entity.getResultJson(), SymptomCheckResponse.class);
                if (res.getPossibleCauses() != null && !res.getPossibleCauses().isEmpty()) {
                    topCause = res.getPossibleCauses().get(0).getName();
                }
            }
        } catch (Exception ignored) {}

        return SymptomCheckSummaryResponse.builder()
                .id(entity.getId())
                .createdAt(entity.getCreatedAt())
                .symptoms(entity.getSymptoms())
                .selectedSymptoms(chips)
                .urgency(entity.getUrgency())
                .topCause(topCause)
                .safetyRuleApplied(Boolean.TRUE.equals(entity.getSafetyRuleApplied()))
                .aiAvailable(Boolean.TRUE.equals(entity.getAiAvailable()))
                .build();
    }
}
