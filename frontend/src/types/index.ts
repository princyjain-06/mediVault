export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export type TriageTier = 'routine' | 'urgent' | 'emergency';

export interface Allergy {
  id: string;
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe';
}

export interface Condition {
  id: string;
  name: string;
  diagnosedDate: string;
  status: 'active' | 'managed' | 'resolved';
  severity: 'mild' | 'moderate' | 'severe';
  notes?: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  prescribedBy: string;
  purpose: string;
  isActive: boolean;
}

export interface VitalsEntry {
  id: string;
  date: string;
  bloodPressureSys: number;
  bloodPressureDia: number;
  heartRate: number;
  bloodSugar: number; // mg/dL
  weight: number; // kg
  oxygenLevel: number; // %
}

export interface MedicalRecord {
  id: string;
  title: string;
  category: 'lab' | 'prescription' | 'radiology' | 'consultation' | 'discharge';
  doctor: string;
  facility: string;
  date: string;
  fileUrl?: string;
  summary: string;
  aiKeyFindings: string[];
  tags: string[];
  isEncrypted: boolean;
}

export interface PatientProfileResponse {
  id: string;
  name: string;
  email: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: BloodGroup;
  phone?: string;
  abhaId?: string;
  emergencyContact?: {
    name: string;
    relationship?: string;
    phone: string;
  } | null;
  profileComplete: boolean;
}

export interface UpdatePatientProfilePayload {
  name: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  phone?: string;
  abhaId?: string;
  emergencyContact?: {
    name: string;
    relationship?: string;
    phone: string;
  };
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: BloodGroup;
  abhaId: string;
  avatar: string;
  email: string;
  phone: string;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  chronicConditions: Condition[];
  allergies: Allergy[];
  currentMedications: Medication[];
  vitalsHistory: VitalsEntry[];
  recentRecords: MedicalRecord[];
}

export interface SymptomOption {
  id: string;
  name: string;
  category: 'General' | 'Respiratory' | 'Cardiovascular' | 'Neurological' | 'Gastrointestinal' | 'Musculoskeletal';
  description: string;
  commonTriggers?: string[];
}

export interface ReportedSymptom {
  symptomId: string;
  name: string;
  severity: 'mild' | 'moderate' | 'severe';
  duration: string; // e.g., "2 days", "3 hours"
  onset: 'gradual' | 'sudden';
  bodyLocation?: string;
  notes?: string;
}

export interface SymptomCheckInput {
  patientId: string;
  symptoms: ReportedSymptom[];
  additionalNotes?: string;
  triggers?: string[];
  currentTemperature?: number;
  consentGiven: boolean;
}

export interface PersonalizedInsight {
  title: string;
  description: string;
  linkedRecordTitle?: string;
  linkedRecordId?: string;
  relevance: 'high' | 'critical' | 'informational';
}

export interface PossibleCause {
  name: string;
  probability: number; // 0 - 100 percentage
  description: string;
  recommendedSpecialist: string;
  urgency: 'low' | 'moderate' | 'high';
}

export interface InteractionAlert {
  type: 'allergy_warning' | 'medication_conflict' | 'contraindication';
  severity: 'warning' | 'critical';
  title: string;
  description: string;
  substanceInvolved: string;
}

export interface SymptomAnalysis {
  id: string;
  checkDate: string;
  patientId: string;
  patientName: string;
  triageTier: TriageTier;
  urgencyHeadline: string;
  urgencyExplanation: string;
  reportedSymptoms: ReportedSymptom[];
  personalizedInsights: PersonalizedInsight[];
  possibleCauses: PossibleCause[];
  interactionAlerts: InteractionAlert[];
  recommendedNextSteps: string[];
  homeCareTips: string[];
  redFlags: string[];
  disclaimer: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  doctorName: string;
  specialty: string;
  hospital: string;
  date: string;
  time: string;
  status: 'upcoming' | 'completed' | 'cancelled';
  type: 'in-person' | 'video';
  notes?: string;
}
