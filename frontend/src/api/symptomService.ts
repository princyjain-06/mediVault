import { 
  SymptomOption, 
  SymptomCheckInput, 
  SymptomAnalysis, 
  PersonalizedInsight, 
  PossibleCause, 
  InteractionAlert,
  TriageTier 
} from '../types';
import { MOCK_SYMPTOMS_CATALOG, MOCK_HISTORICAL_ANALYSES, SAMPLE_SYMPTOM_ANALYSES } from './mockData';
import { patientService } from './patientService';
import { apiClient, USE_MOCK, mockDelay } from './client';

const HISTORY_STORAGE_KEY = 'mediVault_symptom_analyses';

function getStoredAnalyses(): SymptomAnalysis[] {
  const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(MOCK_HISTORICAL_ANALYSES));
  return MOCK_HISTORICAL_ANALYSES;
}

function saveAnalyses(analyses: SymptomAnalysis[]) {
  localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(analyses));
}

export const symptomService = {
  async getSymptomsCatalog(): Promise<SymptomOption[]> {
    if (USE_MOCK) {
      await mockDelay(200);
      return MOCK_SYMPTOMS_CATALOG;
    }
    const response = await apiClient.get<SymptomOption[]>('/symptoms/catalog');
    return response.data;
  },

  async getHistoryByPatient(patientId: string): Promise<SymptomAnalysis[]> {
    if (USE_MOCK) {
      await mockDelay(300);
      const all = getStoredAnalyses();
      const patientAnalyses = all.filter((a) => a.patientId === patientId);
      if (patientAnalyses.length > 0) {
        return patientAnalyses;
      }
      // If user has no analyses yet and is not one of demo accounts (or has empty history), provide sample analyses
      return SAMPLE_SYMPTOM_ANALYSES.map((a) => ({
        ...a,
        patientId: patientId,
      }));
    }
    const response = await apiClient.get<SymptomAnalysis[]>(`/patients/${patientId}/symptom-history`);
    return response.data;
  },

  async getAnalysisById(id: string): Promise<SymptomAnalysis | undefined> {
    if (USE_MOCK) {
      await mockDelay(250);
      const all = getStoredAnalyses();
      return all.find((a) => a.id === id);
    }
    const response = await apiClient.get<SymptomAnalysis>(`/symptom-analyses/${id}`);
    return response.data;
  },

  async analyzeSymptoms(input: SymptomCheckInput): Promise<SymptomAnalysis> {
    if (USE_MOCK) {
      // Realistic simulation delay for AI reasoning
      await mockDelay(1200);

      const patient = await patientService.getPatientById(input.patientId);
      const symptomNames = input.symptoms.map((s) => s.name.toLowerCase());
      const hasSevereSymptom = input.symptoms.some((s) => s.severity === 'severe');
      const hasModerateSymptom = input.symptoms.some((s) => s.severity === 'moderate');

      // Determine Triage
      let triageTier: TriageTier = 'routine';
      let urgencyHeadline = 'Mild Symptoms with Stable Indicators';
      let urgencyExplanation = 'Your reported symptoms are mild and currently manageable with home care, but should be observed closely.';

      const hasChest = symptomNames.some((n) => n.includes('chest'));
      const hasDyspnea = symptomNames.some((n) => n.includes('breath') || n.includes('wheezing'));
      const hasHeadache = symptomNames.some((n) => n.includes('headache'));

      if (hasSevereSymptom || (hasChest && hasModerateSymptom)) {
        triageTier = 'urgent';
        urgencyHeadline = 'Prompt Clinical Attention Recommended (Within 12-24h)';
        urgencyExplanation = 'Your symptoms, combined with your underlying medical profile, warrant direct physician assessment to avoid complication.';
      } else if (hasModerateSymptom) {
        triageTier = 'routine';
        urgencyHeadline = 'Moderate Symptom Profile — Monitor & Consult if Persistent';
        urgencyExplanation = 'Follow prescribed home care and schedule a consultation if symptoms do not improve over 48 hours.';
      }

      // Generate Patient-Specific Insights
      const personalizedInsights: PersonalizedInsight[] = [];
      const interactionAlerts: InteractionAlert[] = [];
      const possibleCauses: PossibleCause[] = [];
      const recommendedNextSteps: string[] = [];
      const homeCareTips: string[] = [];
      const redFlags: string[] = [];

      // Patient specific tailoring:
      if (patient.id === 'pat-001') {
        // Rajesh: Hypertension, Diabetes, Sulfa allergy, Amlodipine, Metformin
        if (hasHeadache) {
          personalizedInsights.push({
            title: 'Hypertension History & Temple Throbbing',
            description: `You have Essential Hypertension and take ${patient.currentMedications[0]?.name}. A throbbing headache may correlate with elevated systemic vascular resistance.`,
            linkedRecordTitle: patient.recentRecords[1]?.title || 'Echocardiogram Report',
            linkedRecordId: patient.recentRecords[1]?.id,
            relevance: 'critical',
          });
        }
        if (patient.chronicConditions.some((c) => c.name.includes('Diabetes'))) {
          personalizedInsights.push({
            title: 'Metabolic & Glycemic Balance',
            description: `Last HbA1c was 7.4%. Ensure adequate hydration, as glycemic fluctuations can amplify lethargy, headaches, and dizziness.`,
            linkedRecordTitle: patient.recentRecords[0]?.title || 'Metabolic Panel & HbA1c',
            linkedRecordId: patient.recentRecords[0]?.id,
            relevance: 'high',
          });
        }

        // Interaction Alerts for Rajesh
        interactionAlerts.push({
          type: 'contraindication',
          severity: 'critical',
          title: 'Caution: NSAIDs (Ibuprofen / Naproxen)',
          description: 'Avoid over-the-counter NSAIDs. They can reduce the blood pressure lowering effect of Amlodipine and stress renal microvasculature.',
          substanceInvolved: 'NSAIDs (Ibuprofen, Naproxen, Diclofenac)',
        });
        interactionAlerts.push({
          type: 'allergy_warning',
          severity: 'warning',
          title: 'Documented Allergy: Sulfa Medications',
          description: 'Patient has a severe urticaria/angioedema allergy to Sulfonamides. Ensure no adjunct therapy contains sulfa.',
          substanceInvolved: 'Sulfonamides',
        });

        possibleCauses.push(
          {
            name: 'Blood Pressure Fluctuation / Tension Cephalea',
            probability: 74,
            description: 'Vascular tension exacerbated by physical fatigue or transient systolic elevation above baseline.',
            recommendedSpecialist: 'Cardiologist / General Physician',
            urgency: 'high',
          },
          {
            name: 'Cervicogenic Strain & Muscle Tightness',
            probability: 48,
            description: 'Postural or ergonomic strain in the suboccipital and trapezius muscle groups.',
            recommendedSpecialist: 'Physiotherapist / Primary Care',
            urgency: 'moderate',
          },
          {
            name: 'Mild Glycemic / Electrolyte Shift',
            probability: 32,
            description: 'Minor hydration deficit in conjunction with oral hypoglycemic agent therapy.',
            recommendedSpecialist: 'Diabetologist',
            urgency: 'low',
          }
        );

        recommendedNextSteps.push(
          'Log resting blood pressure twice today (morning and evening seated).',
          'Avoid skipping your prescribed morning Amlodipine dosage.',
          'Schedule a tele-consult with Dr. Vikram Seth if systolic BP exceeds 145 mmHg.',
          'Verify fasting blood glucose level before breakfast tomorrow.'
        );

        homeCareTips.push(
          'Rest in a cool, dimly lit room with limited screen exposure.',
          'Drink 300-400 ml of cool water with electrolyte balance.',
          'Practice 10 minutes of slow 4-7-8 rhythmic breathing.',
          'Use warm compress on back of neck if muscle tightness is present.'
        );

        redFlags.push(
          'Sudden severe "worst headache of your life" onset within seconds',
          'Systolic BP reading above 180 mmHg or diastolic above 110 mmHg',
          'Numbness, facial drooping, speech difficulty, or motor weakness',
          'Chest pain, shortness of breath, or vomiting'
        );
      } else {
        // Priya: Asthma, Rhinitis, Penicillin allergy, Budesonide, Albuterol
        if (hasDyspnea || symptomNames.some((n) => n.includes('cough') || n.includes('wheez'))) {
          personalizedInsights.push({
            title: 'Asthma History & Airway Hyperreactivity',
            description: `You have documented Moderate Persistent Asthma with 19% bronchodilator reversibility on your recent spirometry. Current respiratory sensations indicate bronchial spasm.`,
            linkedRecordTitle: patient.recentRecords[0]?.title || 'Spirometry Report',
            linkedRecordId: patient.recentRecords[0]?.id,
            relevance: 'critical',
          });
        }
        personalizedInsights.push({
          title: 'High Environmental Allergen Sensitization',
          description: `Allergy prick test showed strong 4+ dust mite and 3+ tree pollen reaction. Autumn and seasonal dust shifts trigger bronchial hyperreactivity.`,
          linkedRecordTitle: patient.recentRecords[1]?.title || 'Allergy Skin Prick Panel',
          linkedRecordId: patient.recentRecords[1]?.id,
          relevance: 'high',
        });

        // Interaction Alerts for Priya
        interactionAlerts.push({
          type: 'allergy_warning',
          severity: 'critical',
          title: 'CRITICAL ALLERGY: Penicillin & Amoxicillin',
          description: 'Documented life-threatening anaphylactic reaction to Penicillin and Beta-lactam antibiotics. Under NO circumstances should penicillin be prescribed.',
          substanceInvolved: 'Penicillins / Beta-Lactams',
        });
        interactionAlerts.push({
          type: 'contraindication',
          severity: 'critical',
          title: 'AERD Risk: Avoid Aspirin & NSAIDs',
          description: 'Patients with reactive airway disease can experience severe asthma exacerbations from Aspirin and COX-1 inhibitors.',
          substanceInvolved: 'Aspirin, Ibuprofen, Naproxen',
        });

        possibleCauses.push(
          {
            name: 'Allergen-Induced Asthma Exacerbation',
            probability: 82,
            description: 'Bronchial smooth muscle constriction and mild airway edema triggered by airborne particulates.',
            recommendedSpecialist: 'Pulmonologist / Allergist',
            urgency: 'high',
          },
          {
            name: 'Allergic Rhinitis Post-Nasal Reflex',
            probability: 60,
            description: 'Secretions dripping from nasal turbinates triggering laryngeal cough receptors.',
            recommendedSpecialist: 'ENT Specialist',
            urgency: 'moderate',
          },
          {
            name: 'Mild Viral Upper Respiratory Tract Prodrome',
            probability: 38,
            description: 'Early seasonal viral irritation superimposed on reactive airways.',
            recommendedSpecialist: 'Primary Care Physician',
            urgency: 'low',
          }
        );

        recommendedNextSteps.push(
          'Administer 2 puffs of rescue Albuterol inhaler with spacer as prescribed.',
          'Check your Peak Expiratory Flow (PEF) meter to confirm lung capacity.',
          'Ensure continuous compliance with maintenance Budesonide/Formoterol.',
          'Call Dr. Aris Thorne if wheezing persists beyond 2 rescue doses.'
        );

        homeCareTips.push(
          'Remain indoors in a HEPA-filtered environment away from outdoor pollen.',
          'Drink warm fluids (lemon ginger or honey water) to soothe airway irritation.',
          'Practice pursed-lip breathing to facilitate full air expiration.',
          'Keep bedroom clean and dust-mite encasings on bedding.'
        );

        redFlags.push(
          'Inability to speak complete sentences without pausing for breath',
          'Peak expiratory flow rate falling below 50% of personal best',
          'Bluish discoloration around lips or nailbeds (cyanosis)',
          'Retraction of neck muscles or ribs when breathing in'
        );
      }

      const newAnalysis: SymptomAnalysis = {
        id: `ana-${Date.now()}`,
        checkDate: new Date().toISOString(),
        patientId: patient.id,
        patientName: patient.name,
        triageTier,
        urgencyHeadline,
        urgencyExplanation,
        reportedSymptoms: input.symptoms,
        personalizedInsights,
        possibleCauses,
        interactionAlerts,
        recommendedNextSteps,
        homeCareTips,
        redFlags,
        disclaimer: 'This AI screening tool is for informational and triage guidance only. It cross-references your stored health records but does NOT constitute a definitive clinical diagnosis. If you experience severe chest pain, shortness of breath, or neurological deficits, immediately dial emergency services (112 / 911).',
      };

      // Persist to mock history
      const existing = getStoredAnalyses();
      saveAnalyses([newAnalysis, ...existing]);

      return newAnalysis;
    }

    const response = await apiClient.post<SymptomAnalysis>('/symptom-analyses', input);
    return response.data;
  }
};
