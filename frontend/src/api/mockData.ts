import { Patient, SymptomOption, SymptomAnalysis, Appointment, Condition, Allergy, Medication, VitalsEntry, MedicalRecord } from '../types';

export const MOCK_PATIENTS: Patient[] = [
  {
    id: 'pat-001',
    name: 'Rajesh Sharma',
    age: 54,
    gender: 'Male',
    bloodGroup: 'O+',
    abhaId: '91-4589-2044-1182',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    email: 'rajesh.sharma@example.com',
    phone: '+91 98201 44521',
    emergencyContact: {
      name: 'Sunita Sharma',
      relationship: 'Spouse',
      phone: '+91 98201 44522',
    },
    chronicConditions: [
      {
        id: 'cond-1',
        name: 'Essential Hypertension (Stage 2)',
        diagnosedDate: '2021-04-12',
        status: 'managed',
        severity: 'moderate',
        notes: 'Monitored monthly. Recent BP trending slightly elevated with work stress.'
      },
      {
        id: 'cond-2',
        name: 'Type 2 Diabetes Mellitus',
        diagnosedDate: '2022-09-18',
        status: 'managed',
        severity: 'moderate',
        notes: 'HbA1c target < 7.0%. Currently at 7.4%.'
      },
      {
        id: 'cond-3',
        name: 'Hyperlipidemia',
        diagnosedDate: '2023-01-10',
        status: 'managed',
        severity: 'mild',
        notes: 'Elevated LDL cholesterol under statin therapy.'
      }
    ],
    allergies: [
      {
        id: 'all-1',
        allergen: 'Sulfonamides (Sulfa drugs)',
        reaction: 'Severe urticaria, angioedema of lip & eyes',
        severity: 'severe'
      },
      {
        id: 'all-2',
        allergen: 'Shellfish',
        reaction: 'Digestive cramping, hives',
        severity: 'moderate'
      }
    ],
    currentMedications: [
      {
        id: 'med-1',
        name: 'Amlodipine Besylate',
        dosage: '5 mg',
        frequency: 'Once daily (Morning)',
        startDate: '2021-04-15',
        prescribedBy: 'Dr. Vikram Seth (Cardiology)',
        purpose: 'Calcium channel blocker for systemic blood pressure reduction',
        isActive: true
      },
      {
        id: 'med-2',
        name: 'Metformin Hydrochloride (Extended Release)',
        dosage: '500 mg',
        frequency: 'Twice daily with meals',
        startDate: '2022-09-20',
        prescribedBy: 'Dr. Anita Desai (Endocrinology)',
        purpose: 'Improves insulin sensitivity and glycemic control',
        isActive: true
      },
      {
        id: 'med-3',
        name: 'Atorvastatin',
        dosage: '20 mg',
        frequency: 'Once daily at bedtime',
        startDate: '2023-01-15',
        prescribedBy: 'Dr. Vikram Seth (Cardiology)',
        purpose: 'HMG-CoA reductase inhibitor for lipid management',
        isActive: true
      }
    ],
    vitalsHistory: [
      { id: 'vit-1', date: '2026-05-15', bloodPressureSys: 142, bloodPressureDia: 90, heartRate: 78, bloodSugar: 148, weight: 79.5, oxygenLevel: 98 },
      { id: 'vit-2', date: '2026-06-20', bloodPressureSys: 138, bloodPressureDia: 88, heartRate: 74, bloodSugar: 135, weight: 79.0, oxygenLevel: 99 },
      { id: 'vit-3', date: '2026-07-25', bloodPressureSys: 136, bloodPressureDia: 86, heartRate: 76, bloodSugar: 130, weight: 78.4, oxygenLevel: 98 },
      { id: 'vit-4', date: '2026-08-30', bloodPressureSys: 140, bloodPressureDia: 89, heartRate: 80, bloodSugar: 142, weight: 78.2, oxygenLevel: 98 },
      { id: 'vit-5', date: '2026-09-28', bloodPressureSys: 134, bloodPressureDia: 84, heartRate: 72, bloodSugar: 126, weight: 77.8, oxygenLevel: 99 },
      { id: 'vit-6', date: '2026-10-06', bloodPressureSys: 144, bloodPressureDia: 92, heartRate: 82, bloodSugar: 154, weight: 78.0, oxygenLevel: 97 }
    ],
    recentRecords: [
      {
        id: 'rec-101',
        title: 'Comprehensive Metabolic Panel & HbA1c',
        category: 'lab',
        doctor: 'Dr. Anita Desai',
        facility: 'Apollo Health City, Diagnostics Lab',
        date: '2026-09-28',
        fileUrl: '#',
        summary: 'Fasting blood glucose 132 mg/dL. HbA1c measured at 7.4%. Serum Creatinine 1.05 mg/dL with eGFR > 85.',
        aiKeyFindings: [
          'HbA1c remains 0.4% above optimal target threshold (7.0%).',
          'Renal markers within healthy safe clearance parameters.',
          'Electrolytes stable; caution advised if adding diuretics.'
        ],
        tags: ['Diabetes', 'Metabolic', 'HbA1c', 'Apollo Diagnostics'],
        isEncrypted: true
      },
      {
        id: 'rec-102',
        title: 'Echocardiogram & Resting ECG Report',
        category: 'radiology',
        doctor: 'Dr. Vikram Seth',
        facility: 'Max Super Speciality Hospital',
        date: '2026-08-15',
        fileUrl: '#',
        summary: 'Normal sinus rhythm, HR 74 bpm. Mild concentric left ventricular hypertrophy consistent with chronic arterial hypertension. LVEF 58%.',
        aiKeyFindings: [
          'Mild LV wall thickness attributed to Stage 2 hypertension history.',
          'Preserved systolic ejection fraction (58%). No acute ischemic changes.',
          'Advised strict BP maintenance below 130/80 mmHg.'
        ],
        tags: ['Cardiology', 'ECG', 'Hypertension', 'Echo'],
        isEncrypted: true
      },
      {
        id: 'rec-103',
        title: 'Cardiology Consultation Note & Medication Review',
        category: 'consultation',
        doctor: 'Dr. Vikram Seth',
        facility: 'Heart & Rhythm Clinic',
        date: '2026-08-15',
        fileUrl: '#',
        summary: 'Patient counseled on low-sodium DASH diet. Continue Amlodipine 5mg. Added caution for NSAIDs due to renal/BP interaction.',
        aiKeyFindings: [
          'Avoid NSAIDs (Ibuprofen, Naproxen); use Acetaminophen/Paracetamol for pain relief.',
          'Keep self-monitoring morning and evening BP log.'
        ],
        tags: ['Consultation', 'Medication Plan', 'DASH Diet'],
        isEncrypted: true
      },
      {
        id: 'rec-104',
        title: 'Digital Retinal Photography (Fundus Exam)',
        category: 'radiology',
        doctor: 'Dr. Meera Nambiar',
        facility: 'Sankara Eye Institute',
        date: '2026-06-10',
        fileUrl: '#',
        summary: 'Annual diabetic retinopathy screening. Mild arteriolar narrowing noted, no proliferative diabetic retinopathy or macular edema.',
        aiKeyFindings: [
          'No diabetic macular edema detected.',
          'Hypertensive changes Grade 1 in retinal arterioles.'
        ],
        tags: ['Ophthalmology', 'Fundus', 'Retina'],
        isEncrypted: true
      }
    ]
  },
  {
    id: 'pat-002',
    name: 'Priya Patel',
    age: 29,
    gender: 'Female',
    bloodGroup: 'B+',
    abhaId: '91-8842-1920-7741',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    email: 'priya.patel@example.com',
    phone: '+91 97110 88234',
    emergencyContact: {
      name: 'Kunal Patel',
      relationship: 'Brother',
      phone: '+91 97110 88235',
    },
    chronicConditions: [
      {
        id: 'cond-201',
        name: 'Moderate Persistent Asthma',
        diagnosedDate: '2019-11-05',
        status: 'managed',
        severity: 'moderate',
        notes: 'Exacerbated by cold air, dust mites, and viral upper respiratory infections.'
      },
      {
        id: 'cond-202',
        name: 'Allergic Rhinitis',
        diagnosedDate: '2020-03-22',
        status: 'active',
        severity: 'mild',
        notes: 'Seasonal flares during pollen blooms in spring and autumn.'
      },
      {
        id: 'cond-203',
        name: 'Iron Deficiency Anemia (Subclinical)',
        diagnosedDate: '2025-10-14',
        status: 'managed',
        severity: 'mild',
        notes: 'Serum Ferritin 14 ng/mL. Dietary iron supplementation ongoing.'
      }
    ],
    allergies: [
      {
        id: 'all-201',
        allergen: 'Penicillin & Amoxicillin',
        reaction: 'Immediate generalized rash, wheezing, anaphylactoid reaction',
        severity: 'severe'
      },
      {
        id: 'all-202',
        allergen: 'Aspirin / NSAIDs (COX-1 inhibitors)',
        reaction: 'Aspirin-exacerbated respiratory disease (AERD) / bronchospasm',
        severity: 'severe'
      }
    ],
    currentMedications: [
      {
        id: 'med-201',
        name: 'Budesonide / Formoterol (Symbicort)',
        dosage: '160 / 4.5 mcg',
        frequency: '1 inhalation twice daily',
        startDate: '2022-02-10',
        prescribedBy: 'Dr. Aris Thorne (Pulmonology)',
        purpose: 'Inhaled corticosteroid + LABA controller for bronchial airway inflammation',
        isActive: true
      },
      {
        id: 'med-202',
        name: 'Albuterol / Salbutamol Inhaler',
        dosage: '100 mcg per puff',
        frequency: '1-2 puffs as needed (PRN) for acute bronchospasm',
        startDate: '2019-11-05',
        prescribedBy: 'Dr. Aris Thorne (Pulmonology)',
        purpose: 'Short-acting beta-agonist rescue bronchodilator',
        isActive: true
      },
      {
        id: 'med-203',
        name: 'Cetirizine Hydrochloride',
        dosage: '10 mg',
        frequency: 'Once daily at bedtime as needed',
        startDate: '2020-03-25',
        prescribedBy: 'Dr. Radhika Sen (Allergy & Immunology)',
        purpose: 'Second-generation H1 antihistamine for seasonal rhinitis',
        isActive: true
      }
    ],
    vitalsHistory: [
      { id: 'vit-21', date: '2026-05-10', bloodPressureSys: 116, bloodPressureDia: 74, heartRate: 70, bloodSugar: 92, weight: 58.0, oxygenLevel: 99 },
      { id: 'vit-22', date: '2026-06-15', bloodPressureSys: 118, bloodPressureDia: 76, heartRate: 72, bloodSugar: 94, weight: 58.2, oxygenLevel: 98 },
      { id: 'vit-23', date: '2026-07-20', bloodPressureSys: 114, bloodPressureDia: 72, heartRate: 74, bloodSugar: 89, weight: 57.8, oxygenLevel: 99 },
      { id: 'vit-24', date: '2026-08-25', bloodPressureSys: 120, bloodPressureDia: 78, heartRate: 84, bloodSugar: 95, weight: 57.5, oxygenLevel: 96 },
      { id: 'vit-25', date: '2026-09-22', bloodPressureSys: 115, bloodPressureDia: 75, heartRate: 71, bloodSugar: 91, weight: 58.1, oxygenLevel: 99 },
      { id: 'vit-26', date: '2026-10-05', bloodPressureSys: 118, bloodPressureDia: 76, heartRate: 75, bloodSugar: 93, weight: 58.0, oxygenLevel: 98 }
    ],
    recentRecords: [
      {
        id: 'rec-201',
        title: 'Pulmonary Function Spirometry & FeNO Report',
        category: 'lab',
        doctor: 'Dr. Aris Thorne',
        facility: 'Fortis Memorial Research Institute',
        date: '2026-08-25',
        fileUrl: '#',
        summary: 'FEV1 baseline 78% of predicted, improving to 93% post-bronchodilator (+19% reversibility). Fractional exhaled nitric oxide (FeNO) 28 ppb.',
        aiKeyFindings: [
          'Significant bronchodilator reversibility confirms reactive airway component.',
          'Airway eosinophilic inflammation currently well-controlled under Budesonide.',
          'Instructed to monitor daily Peak Expiratory Flow (PEF).'
        ],
        tags: ['Pulmonology', 'Asthma', 'Spirometry', 'FeNO'],
        isEncrypted: true
      },
      {
        id: 'rec-202',
        title: 'Allergy Skin Prick Panel & Total Serum IgE',
        category: 'lab',
        doctor: 'Dr. Radhika Sen',
        facility: 'Allergy & Clinical Immunology Centre',
        date: '2026-04-18',
        fileUrl: '#',
        summary: 'Total IgE 240 IU/mL. Positive wheal-and-flare reactions to Dermatophagoides pteronyssinus (Dust Mite 4+) and Tree Pollen (3+). Strong alert: Avoid Beta-lactams.',
        aiKeyFindings: [
          'High sensitisation to indoor dust mites and airborne tree pollen.',
          'CRITICAL: Penicillin class antibiotics strictly contraindicated.',
          'Aspirin Triad sensitivity flagged: Avoid NSAID medications.'
        ],
        tags: ['Immunology', 'Allergy', 'IgE', 'Contraindications'],
        isEncrypted: true
      },
      {
        id: 'rec-203',
        title: 'Digital High-Resolution Chest Radiograph (CXR)',
        category: 'radiology',
        doctor: 'Dr. Sunita Kulkarni',
        facility: 'Fortis Imaging Centre',
        date: '2026-03-02',
        fileUrl: '#',
        summary: 'Normal cardiac silhouette. No focal consolidation, pneumothorax, or pleural effusion. Lungs clear with subtle bronchial wall thickening.',
        aiKeyFindings: [
          'No acute infiltrate, consolidation, or infectious process.',
          'Subtle bronchial thickening in keeping with known chronic asthma.'
        ],
        tags: ['Radiology', 'Chest X-Ray', 'Lungs'],
        isEncrypted: true
      }
    ]
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// SAMPLE DATA TEMPLATE  — shown to any newly signed-up (non-demo) user so
// their dashboard looks populated and functional on first login.
// When the user adds their own real data, these samples are hidden/replaced.
// ─────────────────────────────────────────────────────────────────────────────

export const SAMPLE_CONDITIONS: Condition[] = [
  {
    id: 'sample-cond-1',
    name: 'Mild Iron-Deficiency Anaemia',
    diagnosedDate: '2026-04-10',
    status: 'managed',
    severity: 'mild',
    notes: 'Haemoglobin 10.9 g/dL on last test. Responding to iron supplementation.',
  },
  {
    id: 'sample-cond-2',
    name: 'Seasonal Allergic Rhinitis',
    diagnosedDate: '2025-09-05',
    status: 'managed',
    severity: 'mild',
    notes: 'Triggered by dust mites and tree pollen. Managed with antihistamines.',
  },
];

export const SAMPLE_ALLERGIES: Allergy[] = [
  {
    id: 'sample-all-1',
    allergen: 'Penicillin (Amoxicillin)',
    reaction: 'Urticaria (hives) over arms and trunk within 1 hour',
    severity: 'moderate',
  },
  {
    id: 'sample-all-2',
    allergen: 'Pollen (Seasonal)',
    reaction: 'Sneezing, watery eyes, nasal congestion',
    severity: 'mild',
  },
];

export const SAMPLE_MEDICATIONS: Medication[] = [
  {
    id: 'sample-med-1',
    name: 'Ferrous Sulphate 200 mg',
    dosage: '200 mg',
    frequency: 'Once daily after dinner',
    startDate: '2026-04-15',
    prescribedBy: 'Dr. Priya Nair (Internal Medicine)',
    purpose: 'Iron supplementation for anaemia correction',
    isActive: true,
  },
  {
    id: 'sample-med-2',
    name: 'Cetirizine 10 mg',
    dosage: '10 mg',
    frequency: 'Once daily at bedtime (seasonal use)',
    startDate: '2026-09-10',
    prescribedBy: 'Dr. Priya Nair (Internal Medicine)',
    purpose: 'Second-generation antihistamine for allergic rhinitis',
    isActive: true,
  },
];

export const SAMPLE_VITALS: VitalsEntry[] = [
  { id: 'sample-vit-1', date: '2026-05-10', bloodPressureSys: 112, bloodPressureDia: 74, heartRate: 78, bloodSugar: 92, weight: 58.5, oxygenLevel: 99 },
  { id: 'sample-vit-2', date: '2026-06-14', bloodPressureSys: 110, bloodPressureDia: 72, heartRate: 76, bloodSugar: 89, weight: 58.2, oxygenLevel: 99 },
  { id: 'sample-vit-3', date: '2026-07-18', bloodPressureSys: 114, bloodPressureDia: 75, heartRate: 80, bloodSugar: 95, weight: 58.0, oxygenLevel: 98 },
  { id: 'sample-vit-4', date: '2026-08-20', bloodPressureSys: 116, bloodPressureDia: 76, heartRate: 82, bloodSugar: 97, weight: 57.8, oxygenLevel: 99 },
  { id: 'sample-vit-5', date: '2026-09-22', bloodPressureSys: 111, bloodPressureDia: 73, heartRate: 77, bloodSugar: 90, weight: 57.5, oxygenLevel: 99 },
  { id: 'sample-vit-6', date: '2026-10-28', bloodPressureSys: 113, bloodPressureDia: 74, heartRate: 79, bloodSugar: 93, weight: 57.6, oxygenLevel: 99 },
];

export const SAMPLE_RECORDS: MedicalRecord[] = [
  {
    id: 'sample-rec-1',
    title: 'Complete Blood Count & Iron Studies',
    category: 'lab',
    doctor: 'Dr. Priya Nair',
    facility: 'Metropolis Healthcare Labs',
    date: '2026-04-10',
    summary: 'Haemoglobin 10.9 g/dL (low), MCV 72 fL (microcytic), Serum Ferritin 8 ng/mL. Findings consistent with iron-deficiency anaemia.',
    aiKeyFindings: [
      'Haemoglobin below normal range at 10.9 g/dL — iron-deficiency pattern.',
      'Low serum ferritin (8 ng/mL) confirms depleted iron stores.',
      'Commence oral iron supplementation; recheck CBC in 8 weeks.',
    ],
    tags: ['BloodWork', 'Anaemia', 'Iron', 'CBC'],
    isEncrypted: true,
  },
  {
    id: 'sample-rec-2',
    title: 'Allergy Skin Prick Panel & Total IgE',
    category: 'lab',
    doctor: 'Dr. Priya Nair',
    facility: 'Apollo Diagnostics',
    date: '2026-09-05',
    summary: 'Positive reaction to Dust Mite (D. pteronyssinus) 3+, Penicillin intradermal 2+, Grass pollen 2+. Total IgE elevated at 220 IU/mL.',
    aiKeyFindings: [
      'Dust mite sensitivity (3+) — primary rhinitis driver.',
      'Penicillin intradermal reaction confirms antibiotic allergy.',
      'Elevated IgE (220 IU/mL) indicates atopic predisposition.',
    ],
    tags: ['Allergy', 'IgE', 'Pollen', 'Immunology'],
    isEncrypted: true,
  },
  {
    id: 'sample-rec-3',
    title: 'General Health Wellness Consultation',
    category: 'consultation',
    doctor: 'Dr. Priya Nair',
    facility: 'Apollo Clinics — Koramangala',
    date: '2026-10-14',
    summary: 'Annual health review. Vitals stable. Anaemia improving on iron therapy. Continue current medications and repeat CBC in December.',
    aiKeyFindings: [
      'Clinical improvement in anaemia — continue Ferrous Sulphate.',
      'Allergic rhinitis controlled with seasonal Cetirizine.',
      'Next follow-up: December blood test to confirm Hb normalisation.',
    ],
    tags: ['Wellness', 'FollowUp', 'GeneralMedicine'],
    isEncrypted: true,
  },
];

export const SAMPLE_APPOINTMENTS: Appointment[] = [
  {
    id: 'sample-apt-1',
    patientId: '__sample__',
    doctorName: 'Dr. Priya Nair',
    specialty: 'Internal Medicine',
    hospital: 'Apollo Clinics — Koramangala',
    date: '2026-12-05',
    time: '10:30 AM',
    status: 'upcoming',
    type: 'in-person',
    notes: 'Repeat CBC to confirm haemoglobin normalisation after 8 weeks of iron therapy.',
  },
  {
    id: 'sample-apt-2',
    patientId: '__sample__',
    doctorName: 'Dr. Priya Nair',
    specialty: 'Internal Medicine',
    hospital: 'Apollo Clinics — Koramangala',
    date: '2026-10-14',
    time: '11:00 AM',
    status: 'completed',
    type: 'in-person',
    notes: 'Annual wellness review. Vitals and anaemia progress evaluated.',
  },
];

export const SAMPLE_SYMPTOM_ANALYSES: SymptomAnalysis[] = [
  {
    id: 'sample-ana-1',
    checkDate: '2026-10-20T10:15:00Z',
    patientId: '__sample__',
    patientName: 'You',
    triageTier: 'routine',
    urgencyHeadline: 'Mild Fatigue & Pallor — Likely Anaemia-Related',
    urgencyExplanation:
      'Fatigue and pallor in context of known iron-deficiency anaemia (Hb 10.9 g/dL). No red-flag signs. Manageable with current supplementation.',
    reportedSymptoms: [
      { symptomId: 'sym-7', name: 'Fatigue & Muscle Aches', severity: 'moderate', duration: '5 days', onset: 'gradual' },
      { symptomId: 'sym-5', name: 'Dizziness / Lightheadedness', severity: 'mild', duration: '2 days', onset: 'gradual', notes: 'Mainly on standing quickly' },
    ],
    personalizedInsights: [
      {
        title: 'Linked to Iron-Deficiency Anaemia',
        description: 'Your CBC from April showed Hb 10.9 g/dL and ferritin 8 ng/mL. Persistent fatigue is a primary symptom of reduced oxygen-carrying capacity.',
        linkedRecordTitle: 'Complete Blood Count & Iron Studies',
        linkedRecordId: 'sample-rec-1',
        relevance: 'high',
      },
    ],
    possibleCauses: [
      {
        name: 'Iron-Deficiency Anaemia (Symptomatic)',
        probability: 85,
        description: 'Reduced haemoglobin causing decreased tissue oxygenation, fatigue, and postural dizziness.',
        recommendedSpecialist: 'Internal Medicine / Haematologist',
        urgency: 'moderate',
      },
      {
        name: 'Orthostatic Hypotension (Mild)',
        probability: 40,
        description: 'Transient blood pressure drop on standing from low intravascular volume linked to anaemia.',
        recommendedSpecialist: 'General Physician',
        urgency: 'low',
      },
    ],
    interactionAlerts: [
      {
        type: 'allergy_warning',
        severity: 'warning',
        title: 'Penicillin Allergy on Record',
        description: 'If any antibiotic is considered for a concurrent infection, ensure Penicillin/Amoxicillin is avoided.',
        substanceInvolved: 'Penicillin / Amoxicillin',
      },
    ],
    recommendedNextSteps: [
      'Continue Ferrous Sulphate 200 mg after dinner as prescribed.',
      'Schedule repeat CBC in December to confirm Hb normalisation.',
      'Take Cetirizine only during high pollen days — avoid overuse.',
      'Increase dietary iron: leafy greens, lentils, fortified cereals.',
    ],
    homeCareTips: [
      'Pair iron-rich foods with Vitamin C (lemon juice) to improve absorption.',
      'Avoid tea/coffee within 1 hour of your iron tablet — tannins block absorption.',
      'Rise slowly from seated or lying positions to prevent dizziness.',
      'Ensure 7–8 hours of sleep to aid red blood cell production.',
    ],
    redFlags: [
      'Haemoglobin dropping below 8 g/dL — requires urgent medical review',
      'Shortness of breath at rest or chest pain',
      'Fainting (syncope) or prolonged blackout on standing',
      'Unusually heavy menstrual bleeding',
    ],
    disclaimer:
      'This AI screening tool is for informational and triage guidance only. It does NOT constitute a clinical diagnosis. Contact your doctor or dial 112 for emergencies.',
  },
];

export const MOCK_SYMPTOMS_CATALOG: SymptomOption[] = [
  // Neurological
  { id: 'sym-1', name: 'Throbbing Headache', category: 'Neurological', description: 'Pulsing or aching pain in temples, forehead, or occiput', commonTriggers: ['Stress', 'Elevated BP', 'Eye strain', 'Dehydration'] },
  { id: 'sym-5', name: 'Dizziness / Lightheadedness', category: 'Neurological', description: 'Feeling unsteady, faint, or room spinning when standing', commonTriggers: ['Postural change', 'Dehydration', 'Blood pressure fluctuation', 'Hypoglycemia'] },
  { id: 'sym-11', name: 'Migraine with Visual Aura', category: 'Neurological', description: 'Severe unilateral headache preceded by visual blind spots, flashing lights, or tingling', commonTriggers: ['Bright lights', 'Cheese/Chocolate', 'Hormonal shifts', 'Sleep deprivation'] },
  { id: 'sym-12', name: 'Numbness or Tingling (Pins & Needles)', category: 'Neurological', description: 'Loss of sensation or prickling feeling in fingers, hands, or feet', commonTriggers: ['Diabetic neuropathy', 'Nerve compression', 'Vitamin B12 deficiency'] },
  { id: 'sym-13', name: 'Brain Fog & Difficulty Concentrating', category: 'Neurological', description: 'Mental haziness, slower information processing, and short-term memory lapses', commonTriggers: ['Post-viral fatigue', 'Thyroid imbalance', 'Poor sleep', 'Chronic stress'] },
  { id: 'sym-14', name: 'Insomnia & Restless Sleep', category: 'Neurological', description: 'Difficulty falling or staying asleep, waking unrested or with frequent awakenings', commonTriggers: ['Screen time before bed', 'Caffeine', 'Anxiety', 'Sleep apnea'] },

  // Respiratory
  { id: 'sym-2', name: 'Shortness of Breath (Dyspnea)', category: 'Respiratory', description: 'Difficulty drawing full breath or tightness upon breathing', commonTriggers: ['Physical exertion', 'Allergen exposure', 'Cold air', 'Anxiety'] },
  { id: 'sym-4', name: 'Wheezing & Persistent Cough', category: 'Respiratory', description: 'High-pitched whistling sound during exhalation or dry irritative cough', commonTriggers: ['Dust', 'Cold air', 'Viral infection', 'Perfume'] },
  { id: 'sym-15', name: 'Sore Throat & Pain on Swallowing', category: 'Respiratory', description: 'Scratchy, inflamed pharynx with difficulty swallowing solids or saliva', commonTriggers: ['Viral pharyngitis', 'Post-nasal drip', 'Acid reflux', 'Dry indoor air'] },
  { id: 'sym-16', name: 'Nasal Congestion & Sinus Pressure', category: 'Respiratory', description: 'Stuffy nose, facial fullness over maxillary or frontal sinuses, reduced smell', commonTriggers: ['Seasonal allergies', 'Temperature changes', 'Dust mites', 'Upper respiratory viral infection'] },
  { id: 'sym-17', name: 'Productive Cough with Phlegm', category: 'Respiratory', description: 'Deep bronchial cough bringing up thick clear, yellow, or greenish sputum', commonTriggers: ['Bronchitis', 'Post-viral infection', 'Air pollution', 'Smoking'] },

  // Cardiovascular
  { id: 'sym-3', name: 'Chest Tightness / Discomfort', category: 'Cardiovascular', description: 'Sensation of pressure, constricting band, or heaviness across chest', commonTriggers: ['Exertion', 'Cold air', 'Stress', 'Acid reflux'] },
  { id: 'sym-10', name: 'Palpitations (Rapid Heartbeat)', category: 'Cardiovascular', description: 'Awareness of rapid, pounding, or fluttering heartbeat in chest or neck', commonTriggers: ['Caffeine', 'Stress', 'Fever', 'Medication', 'Dehydration'] },
  { id: 'sym-18', name: 'Swelling in Ankles & Feet (Edema)', category: 'Cardiovascular', description: 'Puffiness or fluid accumulation in lower extremities causing tight footwear', commonTriggers: ['High sodium intake', 'Prolonged sitting/standing', 'Venous insufficiency', 'Cardiorenal strain'] },
  { id: 'sym-19', name: 'Cold Hands & Feet (Circulatory)', category: 'Cardiovascular', description: 'Chronically chilled extremities, sometimes with blanched or purplish fingernails', commonTriggers: ['Raynaud reflex', 'Stress', 'Beta-blocker medications', 'Anemia'] },

  // Gastrointestinal
  { id: 'sym-6', name: 'Dry Mouth & Excessive Thirst', category: 'Gastrointestinal', description: 'Persistent thirst, parched throat, accompanied by frequent urination', commonTriggers: ['Hyperglycemia', 'Dehydration', 'Diuretic medication'] },
  { id: 'sym-8', name: 'Nausea & Upper Abdominal Discomfort', category: 'Gastrointestinal', description: 'Unease in epigastrium with queasiness or loss of appetite', commonTriggers: ['Gastric irritation', 'Medication side effect', 'Dietary trigger'] },
  { id: 'sym-20', name: 'Acid Reflux & Heartburn', category: 'Gastrointestinal', description: 'Burning retrosternal chest sensation, sour regurgitation upon lying down', commonTriggers: ['Spicy/Oily food', 'Late dinner', 'Caffeine', 'Obesity'] },
  { id: 'sym-21', name: 'Abdominal Bloating & Gas', category: 'Gastrointestinal', description: 'Feeling uncomfortably full or distended after meals with excess belching/flatulence', commonTriggers: ['FODMAPs', 'Dairy/Lactose', 'Rapid eating', 'Carbonated drinks'] },
  { id: 'sym-22', name: 'Diarrhea / Loose Stools', category: 'Gastrointestinal', description: 'Frequent loose or watery bowel movements with urgency or cramping', commonTriggers: ['Food contamination', 'Antibiotics', 'Dietary intolerance', 'Stress'] },
  { id: 'sym-23', name: 'Constipation & Infrequent Movements', category: 'Gastrointestinal', description: 'Hard, dry stools passed less than 3 times a week with straining', commonTriggers: ['Low fiber intake', 'Inadequate water', 'Iron/Calcium supplements', 'Sedentary routine'] },

  // Musculoskeletal
  { id: 'sym-24', name: 'Joint Pain & Morning Stiffness', category: 'Musculoskeletal', description: 'Aching, swollen, or tender joints in knees, hips, or fingers after rest', commonTriggers: ['Weather changes', 'Prolonged immobility', 'High impact exertion', 'Osteoarthritis'] },
  { id: 'sym-25', name: 'Lower Back Pain & Muscle Spasm', category: 'Musculoskeletal', description: 'Dull or sharp ache in lumbar region radiating across buttocks or waist', commonTriggers: ['Heavy lifting', 'Poor posture / desk ergonomics', 'Twisting movement'] },
  { id: 'sym-26', name: 'Neck & Shoulder Stiffness', category: 'Musculoskeletal', description: 'Tight cervical musculature limiting neck turning or causing tension headaches', commonTriggers: ['Prolonged screen/phone posture', 'Awkward sleeping angle', 'Stress'] },
  { id: 'sym-27', name: 'Calf & Foot Muscle Cramps', category: 'Musculoskeletal', description: 'Sudden, painful involuntary contractions in calves or toes, often at night', commonTriggers: ['Electrolyte imbalance (Potassium/Magnesium)', 'Dehydration', 'Strenuous workout'] },

  // General / Systemic
  { id: 'sym-7', name: 'Fatigue & Muscle Aches', category: 'General', description: 'Generalized lethargy, low energy, and heaviness in limbs', commonTriggers: ['Lack of sleep', 'Viral prodrome', 'Anemia', 'Stress'] },
  { id: 'sym-9', name: 'Fever & Chills', category: 'General', description: 'Elevated body temperature (>38°C / 100.4°F) with shivering', commonTriggers: ['Viral infection', 'Bacterial infection', 'Inflammation'] },
  { id: 'sym-28', name: 'Skin Rash, Hives & Itching', category: 'General', description: 'Raised red pruritic welts or dry scaly patches across skin folds', commonTriggers: ['Allergen contact', 'Medication reaction', 'Heat/Sweat', 'Food allergen'] },
  { id: 'sym-29', name: 'Profuse Night Sweats', category: 'General', description: 'Waking up with drenched bedclothes requiring change of clothing', commonTriggers: ['Hormonal fluctuations', 'Infection', 'Medication side effect'] },
  { id: 'sym-30', name: 'Unexplained Weight Loss or Gain', category: 'General', description: 'Significant shift in body weight (>5%) without intentional dietary changes', commonTriggers: ['Metabolic shift', 'Thyroid dysfunction', 'Fluid retention', 'Poor absorption'] }
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'apt-001',
    patientId: 'pat-001',
    doctorName: 'Dr. Vikram Seth',
    specialty: 'Interventional Cardiology',
    hospital: 'Heart & Rhythm Clinic, Fortis',
    date: '2026-10-18',
    time: '10:30 AM',
    status: 'upcoming',
    type: 'in-person',
    notes: 'Quarterly blood pressure review and statin evaluation.'
  },
  {
    id: 'apt-002',
    patientId: 'pat-001',
    doctorName: 'Dr. Anita Desai',
    specialty: 'Endocrinology & Diabetology',
    hospital: 'Apollo Health City',
    date: '2026-11-04',
    time: '04:00 PM',
    status: 'upcoming',
    type: 'video',
    notes: 'Follow-up on 3-month HbA1c repeat and dietary management.'
  },
  {
    id: 'apt-003',
    patientId: 'pat-002',
    doctorName: 'Dr. Aris Thorne',
    specialty: 'Pulmonology & Respiratory Medicine',
    hospital: 'Fortis Memorial Research Institute',
    date: '2026-10-24',
    time: '11:15 AM',
    status: 'upcoming',
    type: 'in-person',
    notes: 'Annual spirometry calibration and asthma action plan update.'
  }
];

export const MOCK_HISTORICAL_ANALYSES: SymptomAnalysis[] = [
  {
    id: 'ana-hist-001',
    checkDate: '2026-10-06T09:30:00Z',
    patientId: 'pat-001',
    patientName: 'Rajesh Sharma',
    triageTier: 'urgent',
    urgencyHeadline: 'Elevated Blood Pressure with Throbbing Headache',
    urgencyExplanation: 'Given your Stage 2 Hypertension history and recent elevated systolic reading (144 mmHg), a severe throbbing headache requires immediate physician consultation to rule out hypertensive urgency.',
    reportedSymptoms: [
      { symptomId: 'sym-1', name: 'Throbbing Headache', severity: 'severe', duration: '1 day', onset: 'gradual', notes: 'Bilateral temple throbbing with neck tension' },
      { symptomId: 'sym-5', name: 'Dizziness / Lightheadedness', severity: 'moderate', duration: '6 hours', onset: 'gradual', notes: 'Occurs primarily when standing up quickly' }
    ],
    personalizedInsights: [
      {
        title: 'Correlation with Stage 2 Hypertension History',
        description: 'You are diagnosed with Essential Hypertension and taking Amlodipine 5mg. Your vitals logged on Oct 6 showed BP 144/92 mmHg, which coincides with the onset of temple pressure.',
        linkedRecordTitle: 'Echocardiogram & Resting ECG Report',
        linkedRecordId: 'rec-102',
        relevance: 'critical'
      },
      {
        title: 'Medication Safety Notice: Avoid NSAIDs',
        description: 'Do NOT take Ibuprofen or Naproxen for this headache, as NSAIDs can further elevate blood pressure and counteract Amlodipine. Acetaminophen (Paracetamol) is safer under doctor advice.',
        linkedRecordTitle: 'Cardiology Consultation Note & Medication Review',
        linkedRecordId: 'rec-103',
        relevance: 'critical'
      },
      {
        title: 'Diabetic Hydration Factor',
        description: 'With a fasting blood glucose trend near 148-154 mg/dL, mild osmotic diuresis may cause mild dehydration, worsening headache symptoms.',
        linkedRecordTitle: 'Comprehensive Metabolic Panel & HbA1c',
        linkedRecordId: 'rec-101',
        relevance: 'high'
      }
    ],
    possibleCauses: [
      {
        name: 'Hypertensive Cephalea / BP Elevation',
        probability: 72,
        description: 'Vascular distension associated with sustained systolic BP above 140 mmHg in treated hypertensive patients.',
        recommendedSpecialist: 'Cardiologist or Primary Care Physician',
        urgency: 'high'
      },
      {
        name: 'Tension-Type Headache Exacerbation',
        probability: 58,
        description: 'Bilateral pressing headache often aggravated by stress, lack of sleep, or cervical spine posture.',
        recommendedSpecialist: 'Neurologist / General Physician',
        urgency: 'moderate'
      },
      {
        name: 'Dehydration / Hyperglycemia-Induced Fatigue',
        probability: 34,
        description: 'Mild electrolyte and water imbalance secondary to elevated blood glucose levels.',
        recommendedSpecialist: 'Endocrinologist',
        urgency: 'low'
      }
    ],
    interactionAlerts: [
      {
        type: 'contraindication',
        severity: 'critical',
        title: 'Contraindication: NSAID Over-The-Counter Pain Relievers',
        description: 'Ibuprofen, Naproxen, or Diclofenac can cause fluid retention, blunt antihypertensive efficacy of Amlodipine, and increase renal risk.',
        substanceInvolved: 'NSAIDs (Ibuprofen / Naproxen)'
      },
      {
        type: 'allergy_warning',
        severity: 'warning',
        title: 'Allergy Record: Sulfonamides',
        description: 'Patient has a severe documented allergy to Sulfa antibiotics. Ensure no headache remedies or adjuvant meds contain sulfonamide derivatives.',
        substanceInvolved: 'Sulfa Drugs'
      }
    ],
    recommendedNextSteps: [
      'Re-measure resting blood pressure after 15 minutes of seated quiet rest.',
      'Contact Dr. Vikram Seth’s clinic today or visit an urgent care center if BP stays ≥ 150/95 mmHg.',
      'Check fasting blood sugar and maintain adequate oral water intake.',
      'Rest in a darkened, quiet room without digital screen exposure.'
    ],
    homeCareTips: [
      'Apply a cool compress over the forehead and temples.',
      'Practice slow diaphragmatic breathing (4 seconds in, 6 seconds out).',
      'Sip 250-300 ml of room temperature water.',
      'Take prescribed morning Amlodipine if not taken already.'
    ],
    redFlags: [
      'Sudden "thunderclap" headache (reaching peak severity in seconds)',
      'Any vision loss, double vision, or slurred speech',
      'Numbness or weakness on one side of face or body',
      'Systolic blood pressure exceeding 180 mmHg or diastolic exceeding 110 mmHg'
    ],
    disclaimer: 'This AI screening tool is for informational and triage guidance only. It cross-references your stored health records but does NOT constitute a definitive clinical diagnosis. If you experience severe chest pain, shortness of breath, or neurological deficits, immediately dial emergency services (112 / 911).'
  },
  {
    id: 'ana-hist-002',
    checkDate: '2026-09-14T14:15:00Z',
    patientId: 'pat-002',
    patientName: 'Priya Patel',
    triageTier: 'routine',
    urgencyHeadline: 'Mild Seasonal Bronchial Reactivity & Wheezing',
    urgencyExplanation: 'Symptoms align with seasonal pollen flare in the context of moderate persistent asthma and allergic rhinitis. SpO2 remains healthy (98%).',
    reportedSymptoms: [
      { symptomId: 'sym-4', name: 'Wheezing & Persistent Cough', severity: 'moderate', duration: '3 days', onset: 'gradual', notes: 'Nighttime dry cough and expiratory whistling after outdoor walk' },
      { symptomId: 'sym-2', name: 'Shortness of Breath (Dyspnea)', severity: 'mild', duration: '2 days', onset: 'gradual', notes: 'Noticeable when climbing 2 flights of stairs' }
    ],
    personalizedInsights: [
      {
        title: 'Linked to Asthma & High Tree Pollen Sensitivity',
        description: 'Your skin prick testing demonstrated a 3+ allergic reaction to airborne tree pollen. Current autumn season matches historical flare cycles.',
        linkedRecordTitle: 'Allergy Skin Prick Panel & Total Serum IgE',
        linkedRecordId: 'rec-202',
        relevance: 'critical'
      },
      {
        title: 'Controller Inhaler Compliance Check',
        description: 'Spirometry on Aug 25 showed 19% reversibility. Consistent twice-daily administration of Budesonide/Formoterol is crucial during seasonal shifts.',
        linkedRecordTitle: 'Pulmonary Function Spirometry & FeNO Report',
        linkedRecordId: 'rec-201',
        relevance: 'high'
      }
    ],
    possibleCauses: [
      {
        name: 'Allergen-Triggered Asthma Flare (Bronchospasm)',
        probability: 84,
        description: 'Reversible bronchoconstriction driven by airborne allergen exposure interacting with underlying hyperreactive airways.',
        recommendedSpecialist: 'Pulmonologist / Allergist',
        urgency: 'moderate'
      },
      {
        name: 'Allergic Rhinitis Post-Nasal Drip Cough',
        probability: 65,
        description: 'Upper airway secretion dripping into the posterior pharynx inciting cough receptors.',
        recommendedSpecialist: 'ENT or Allergist',
        urgency: 'low'
      }
    ],
    interactionAlerts: [
      {
        type: 'allergy_warning',
        severity: 'critical',
        title: 'CRITICAL ALLERGY ALERT: Penicillin & Beta-Lactams',
        description: 'Patient has a life-threatening anaphylaxis history with Penicillin / Amoxicillin. If an antibiotic is ever considered for respiratory symptoms, Penicillin derivatives must NOT be prescribed.',
        substanceInvolved: 'Penicillin / Amoxicillin'
      },
      {
        type: 'contraindication',
        severity: 'critical',
        title: 'CRITICAL CONTRAINDICATION: Aspirin & NSAIDs (AERD Warning)',
        description: 'Patients with asthma and nasal polyps/rhinitis have high risk for Aspirin-exacerbated respiratory disease. Avoid Aspirin, Ibuprofen, and Naproxen.',
        substanceInvolved: 'Aspirin / NSAIDs'
      }
    ],
    recommendedNextSteps: [
      'Take 2 puffs of rescue Albuterol inhaler with spacer as prescribed for acute wheezing relief.',
      'Check Peak Expiratory Flow (PEF). If PEF < 70% of personal best, contact Dr. Aris Thorne.',
      'Continue maintenance Budesonide/Formoterol twice daily.',
      'Consider taking bedtime Cetirizine 10mg to block rhinitis mediator release.'
    ],
    homeCareTips: [
      'Stay indoors during high pollen counts (especially windy mornings).',
      'Rinse sinuses with sterile saline nasal rinse.',
      'Keep bedroom windows closed and run HEPA air filtration.',
      'Drink warm chamomile or ginger tea with honey to soothe airway irritation.'
    ],
    redFlags: [
      'Peak flow drops below 50% (Red Zone)',
      'Severe breathlessness preventing speaking complete sentences in one breath',
      'Rescue Albuterol provides relief for less than 2-3 hours',
      'Bluish tint on lips or fingernails, or chest wall retraction'
    ],
    disclaimer: 'This AI screening tool is for informational and triage guidance only. It cross-references your stored health records but does NOT constitute a definitive clinical diagnosis. If you experience severe chest pain, shortness of breath, or neurological deficits, immediately dial emergency services (112 / 911).'
  }
];
