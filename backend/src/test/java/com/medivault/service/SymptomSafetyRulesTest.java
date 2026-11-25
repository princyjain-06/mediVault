package com.medivault.service;

import com.medivault.model.enums.UrgencyLevel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class SymptomSafetyRulesTest {

    private SymptomSafetyRules safetyRules;

    @BeforeEach
    void setUp() {
        safetyRules = new SymptomSafetyRules();
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "chest pain",
            "CHEST PAIN",
            "Severe Chest Tightness after stairs",
            "cant breathe properly",
            "I can't breathe at all",
            "difficulty breathing since morning",
            "shortness of breath at rest",
            "unconscious",
            "fainted in bathroom",
            "passed out suddenly",
            "seizure",
            "fits attack",
            "stroke symptoms",
            "face drooping on right side",
            "slurred speech",
            "one side weakness",
            "sudden confusion",
            "throat swelling quickly",
            "lips swelling up",
            "coughing blood",
            "vomiting blood",
            "black stool passed today",
            "severe bleeding from wound",
            "feeling suicidal"
    })
    @DisplayName("Emergency phrases must trigger ruleEmergency = true and EMERGENCY floor urgency")
    void testEmergencyPhrasesDetected(String phrase) {
        var eval = safetyRules.evaluate(phrase, Collections.emptyList(), 4);
        assertTrue(eval.isRuleEmergency(), "Expected emergency for: " + phrase);
        assertTrue(eval.isSafetyRuleApplied());
        assertEquals(UrgencyLevel.EMERGENCY, eval.getFloorUrgency());
        assertNotNull(eval.getMatchedPhrase());
    }

    @Test
    @DisplayName("Emergency phrases in selected symptom chips are also detected")
    void testEmergencyInChips() {
        var eval = safetyRules.evaluate("Mild discomfort", List.of("Chest Pain", "Mild Nausea"), 3);
        assertTrue(eval.isRuleEmergency());
        assertEquals(UrgencyLevel.EMERGENCY, eval.getFloorUrgency());
    }

    @Test
    @DisplayName("Severity 10 sets floor to SEE_DOCTOR even without emergency phrase")
    void testSeverityTenFloor() {
        var eval = safetyRules.evaluate("Mild headache and tired", Collections.emptyList(), 10);
        assertFalse(eval.isRuleEmergency());
        assertTrue(eval.isSafetyRuleApplied());
        assertEquals(UrgencyLevel.SEE_DOCTOR, eval.getFloorUrgency());
    }

    @Test
    @DisplayName("Mild symptoms with low severity do not trigger safety rules")
    void testMildSymptoms() {
        var eval = safetyRules.evaluate("Slight runny nose and sneezing", List.of("Headache"), 3);
        assertFalse(eval.isRuleEmergency());
        assertFalse(eval.isSafetyRuleApplied());
        assertEquals(UrgencyLevel.SELF_CARE, eval.getFloorUrgency());
        assertNull(eval.getMatchedPhrase());
    }
}
