import { Patient, PatientProfileResponse, UpdatePatientProfilePayload } from '../types';
import {
  MOCK_PATIENTS,
  SAMPLE_CONDITIONS,
  SAMPLE_ALLERGIES,
  SAMPLE_MEDICATIONS,
  SAMPLE_VITALS,
  SAMPLE_RECORDS,
} from './mockData';
import { apiClient, USE_MOCK, mockDelay } from './client';

const STORAGE_KEY = 'mediVault_patients_data';
const DEMO_IDS = ['pat-001', 'pat-002', 'pat-003'];

function getStoredPatients(): Patient[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fallback
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_PATIENTS));
  return MOCK_PATIENTS;
}

function savePatientsToStorage(patients: Patient[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(patients));
}

/**
 * Normalizes a raw patient object from the backend.
 * - Demo accounts (pat-001..003) always get their full static mock data.
 * - New real users who have empty arrays get sample placeholder data so their
 *   dashboard looks fully populated on first login.
 */
function normalizePatient(p: any): Patient {
  const isDemoAccount = DEMO_IDS.includes(p.id);
  const mock = isDemoAccount ? MOCK_PATIENTS.find((m) => m.id === p.id) : undefined;

  // For real new users: use sample data when the backend returns empty arrays.
  const conditions = (p.chronicConditions && p.chronicConditions.length > 0)
    ? p.chronicConditions
    : (mock?.chronicConditions ?? SAMPLE_CONDITIONS);

  const allergies = (p.allergies && p.allergies.length > 0)
    ? p.allergies
    : (mock?.allergies ?? SAMPLE_ALLERGIES);

  const medications = (p.currentMedications && p.currentMedications.length > 0)
    ? p.currentMedications
    : (mock?.currentMedications ?? SAMPLE_MEDICATIONS);

  const vitals = (p.vitalsHistory && p.vitalsHistory.length > 0)
    ? p.vitalsHistory
    : (mock?.vitalsHistory ?? SAMPLE_VITALS);

  const records = (p.recentRecords && p.recentRecords.length > 0)
    ? p.recentRecords
    : (mock?.recentRecords ?? SAMPLE_RECORDS);

  return {
    id: p.id,
    name: p.name || mock?.name || 'Patient',
    age: p.age !== undefined && p.age !== null && p.age > 0 ? p.age : (mock?.age ?? 28),
    gender: p.gender || mock?.gender || 'Other',
    bloodGroup: p.bloodGroup || mock?.bloodGroup || 'O+',
    abhaId: p.abhaId || mock?.abhaId || '91-0000-0000-0000',
    avatar: p.avatar || mock?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    email: p.email || mock?.email || '',
    phone: p.phone || mock?.phone || '',
    emergencyContact: p.emergencyContact || mock?.emergencyContact || { name: '', relationship: '', phone: '' },
    chronicConditions: conditions,
    allergies: allergies,
    currentMedications: medications,
    vitalsHistory: vitals,
    recentRecords: records,
  };
}

export const patientService = {
  async getPatients(): Promise<Patient[]> {
    if (USE_MOCK) {
      await mockDelay(300);
      return getStoredPatients();
    }
    try {
      const response = await apiClient.get<Patient[]>('/patients');
      if (Array.isArray(response.data) && response.data.length > 0) {
        return response.data.map(normalizePatient);
      }
      return getStoredPatients();
    } catch (err) {
      console.warn('Backend /patients error, falling back to stored patients', err);
      return getStoredPatients();
    }
  },

  async getPatientById(id: string): Promise<Patient> {
    if (USE_MOCK) {
      await mockDelay(300);
      const patients = getStoredPatients();
      const patient = patients.find((p) => p.id === id) || patients[0];
      return patient;
    }
    try {
      const response = await apiClient.get<Patient>(`/patients/${id}`);
      return normalizePatient(response.data);
    } catch {
      const patients = getStoredPatients();
      return patients.find((p) => p.id === id) || patients[0];
    }
  },

  async getMyProfile(): Promise<PatientProfileResponse> {
    if (USE_MOCK) {
      await mockDelay(250);
      const patients = getStoredPatients();
      const p = patients[0];
      return {
        id: p.id,
        name: p.name,
        email: p.email,
        dateOfBirth: '1972-05-15',
        gender: p.gender,
        bloodGroup: p.bloodGroup,
        phone: p.phone,
        abhaId: p.abhaId,
        emergencyContact: p.emergencyContact,
        profileComplete: true,
      };
    }
    const response = await apiClient.get<PatientProfileResponse>('/patients/me');
    return response.data;
  },

  async updateMyProfile(payload: UpdatePatientProfilePayload): Promise<PatientProfileResponse> {
    if (USE_MOCK) {
      await mockDelay(350);
      return {
        id: 'pat-mock',
        name: payload.name,
        email: 'user@example.com',
        dateOfBirth: payload.dateOfBirth,
        gender: payload.gender,
        bloodGroup: payload.bloodGroup as any,
        phone: payload.phone,
        abhaId: payload.abhaId,
        emergencyContact: payload.emergencyContact,
        profileComplete: !!(payload.dateOfBirth && payload.gender && payload.bloodGroup),
      };
    }
    const response = await apiClient.put<PatientProfileResponse>('/patients/me', payload);
    return response.data;
  },

  async updatePatient(updated: Patient): Promise<Patient> {
    if (USE_MOCK) {
      await mockDelay(400);
      const patients = getStoredPatients();
      const idx = patients.findIndex((p) => p.id === updated.id);
      if (idx !== -1) {
        patients[idx] = updated;
      } else {
        patients.push(updated);
      }
      savePatientsToStorage(patients);
      return updated;
    }
    const response = await apiClient.put<Patient>(`/patients/${updated.id}`, updated);
    return response.data;
  }
};
