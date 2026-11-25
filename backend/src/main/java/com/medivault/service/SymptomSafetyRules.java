package com.medivault.service;

import com.medivault.model.enums.UrgencyLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;

/**
 * Deterministic Java safety rules for symptom triage.
 * Kept in a single class so clinicians and reviewers can audit every phrase easily.
 * The AI can never downgrade an urgency level set by these rules.
 */
@Component
public class SymptomSafetyRules {

    public static final List<String> EMERGENCY_PHRASES = List.of(
            "chest pain",
            "chest tightness",
            "cant breathe",
            "cannot breathe",
            "difficulty breathing",
            "shortness of breath at rest",
            "unconscious",
            "fainted",
            "passed out",
            "seizure",
            "fits",
            "stroke",
            "face drooping",
            "slurred speech",
            "one side weakness",
            "sudden confusion",
            "throat swelling",
            "lips swelling",
            "coughing blood",
            "vomiting blood",
            "black stool",
            "severe bleeding",
            "suicidal"
    );

    @Data
    @Builder
    @AllArgsConstructor
    public static class SafetyEvaluation {
        private boolean ruleEmergency;
        private boolean safetyRuleApplied;
        private UrgencyLevel floorUrgency;
        private String matchedPhrase;
    }

    /**
     * Evaluates free-text symptoms, selected chips, and severity against deterministic safety rules.
     */
    public SafetyEvaluation evaluate(String symptomsText, List<String> selectedSymptoms, Integer severity) {
        StringBuilder combined = new StringBuilder();
        if (symptomsText != null) {
            combined.append(symptomsText).append(" ");
        }
        if (selectedSymptoms != null) {
            for (String chip : selectedSymptoms) {
                if (chip != null) {
                    combined.append(chip).append(" ");
                }
            }
        }

        String normalized = normalize(combined.toString());
        for (String phrase : EMERGENCY_PHRASES) {
            // Pad with spaces to ensure clean word/phrase boundary matching
            if ((" " + normalized + " ").contains(" " + phrase + " ")) {
                return SafetyEvaluation.builder()
                        .ruleEmergency(true)
                        .safetyRuleApplied(true)
                        .floorUrgency(UrgencyLevel.EMERGENCY)
                        .matchedPhrase(phrase)
                        .build();
            }
        }

        if (severity != null && severity >= 10) {
            return SafetyEvaluation.builder()
                    .ruleEmergency(false)
                    .safetyRuleApplied(true)
                    .floorUrgency(UrgencyLevel.SEE_DOCTOR)
                    .matchedPhrase("severity 10")
                    .build();
        }

        return SafetyEvaluation.builder()
                .ruleEmergency(false)
                .safetyRuleApplied(false)
                .floorUrgency(UrgencyLevel.SELF_CARE)
                .matchedPhrase(null)
                .build();
    }

    /**
     * Lowercases, removes apostrophes (so "can't" -> "cant"), and collapses punctuation to spaces.
     */
    private String normalize(String input) {
        return input.toLowerCase(Locale.ROOT)
                .replace("'", "")
                .replace("’", "")
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }
}
