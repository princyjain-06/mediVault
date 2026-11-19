import { MedicalRecord } from '../types';
import { patientService } from './patientService';
import { apiClient, USE_MOCK, mockDelay } from './client';

export const recordsService = {
  async getRecordsByPatient(patientId: string): Promise<MedicalRecord[]> {
    if (USE_MOCK) {
      await mockDelay(350);
      const patient = await patientService.getPatientById(patientId);
      return patient.recentRecords || [];
    }
    const response = await apiClient.get<MedicalRecord[]>(`/patients/${patientId}/records`);
    return response.data;
  },

  async addRecord(patientId: string, record: Omit<MedicalRecord, 'id'>): Promise<MedicalRecord> {
    if (USE_MOCK) {
      await mockDelay(600);
      const patient = await patientService.getPatientById(patientId);
      const newRecord: MedicalRecord = {
        ...record,
        id: `rec-${Date.now()}`,
        isEncrypted: true,
      };
      patient.recentRecords = [newRecord, ...patient.recentRecords];
      await patientService.updatePatient(patient);
      return newRecord;
    }
    const response = await apiClient.post<MedicalRecord>(`/patients/${patientId}/records`, record);
    return response.data;
  }
};
