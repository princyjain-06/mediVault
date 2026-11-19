package com.medivault.service._parked;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.medivault.dto.ReportedSymptomDto;
import com.medivault.dto.SymptomCheckRequest;
import com.medivault.exception.ResourceNotFoundException;
import com.medivault.model.Patient;
import com.medivault.model.SymptomAnalysis;
import com.medivault.model.SymptomOption;
import com.medivault.repository.PatientRepository;
import com.medivault.repository.SymptomAnalysisRepository;
import com.medivault.repository.SymptomOptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SymptomService {

    private final SymptomOptionRepository symptomOptionRepository;
    private final SymptomAnalysisRepository analysisRepository;
    private final PatientRepository patientRepository;
    private final ObjectMapper objectMapper;

    public List<SymptomOption> getCatalog() {
        return symptomOptionRepository.findAll();
    }

    public List<SymptomAnalysis> getHistoryByPatient(String patientId) {
        return analysisRepository.findByPatientIdOrderByCheckDateDesc(patientId);
    }

    public SymptomAnalysis getAnalysisById(String id) {
        return analysisRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Analysis not found: " + id));
    }

    /**
     * Basic rule-based triage engine.
     * Replace with an AI/ML call (e.g., Gemini API) in production.
     */
    public SymptomAnalysis analyze(SymptomCheckRequest input) {
        Patient patient = patientRepository.findById(input.getPatientId())
                .orElseThrow(() -> new ResourceNotFoundException("Patient not found"));

        List<ReportedSymptomDto> symptoms = input.getSymptoms();

        boolean hasSevere   = symptoms.stream().anyMatch(s -> "severe".equals(s.getSeverity()));
        boolean hasModerate = symptoms.stream().anyMatch(s -> "moderate".equals(s.getSeverity()));
        boolean hasChest    = symptoms.stream().anyMatch(s -> s.getName().toLowerCase().contains("chest"));

        String triageTier;
        String urgencyHeadline;
        String urgencyExplanation;

        if (hasSevere || (hasChest && hasModerate)) {
            triageTier = "urgent";
            urgencyHeadline = "Prompt Clinical Attention Recommended (Within 12-24h)";
            urgencyExplanation = "Your symptoms, combined with your underlying medical profile, warrant direct physician assessment.";
        } else if (hasModerate) {
            triageTier = "routine";
            urgencyHeadline = "Moderate Symptom Profile — Monitor & Consult if Persistent";
            urgencyExplanation = "Follow prescribed home care and schedule a consultation if symptoms do not improve over 48 hours.";
        } else {
            triageTier = "routine";
            urgencyHeadline = "Mild Symptoms with Stable Indicators";
            urgencyExplanation = "Your reported symptoms are mild and currently manageable with home care.";
        }

        try {
            SymptomAnalysis analysis = SymptomAnalysis.builder()
                    .checkDate(Instant.now().toString())
                    .patientId(patient.getId())
                    .patientName(patient.getName())
                    .triageTier(triageTier)
                    .urgencyHeadline(urgencyHeadline)
                    .urgencyExplanation(urgencyExplanation)
                    .reportedSymptomsJson(objectMapper.writeValueAsString(symptoms))
                    .personalizedInsightsJson("[]")
                    .possibleCausesJson("[]")
                    .interactionAlertsJson("[]")
                    .recommendedNextSteps(List.of("Consult your physician if symptoms worsen."))
                    .homeCareTips(List.of("Rest and stay hydrated.", "Monitor your temperature."))
                    .redFlags(List.of("Severe chest pain", "Difficulty breathing", "Loss of consciousness"))
                    .disclaimer("This AI screening tool is for informational and triage guidance only. It does NOT constitute a clinical diagnosis. Call 112 / 911 for emergencies.")
                    .build();

            return analysisRepository.save(analysis);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize symptom analysis", e);
        }
    }
}
