import { apiClient, USE_MOCK, mockDelay } from './client';
import {
  BackendAllergy,
  BackendCondition,
  AllergySeverityLevel,
  ConditionStatusLevel,
} from '../types';

export interface AllergyPayload {
  allergen: string;
  reaction?: string;
  severity: AllergySeverityLevel;
}

export interface ConditionPayload {
  name: string;
  status: ConditionStatusLevel;
  diagnosedDate?: string | null;
}

export const profileRecordsService = {
  async getAllergies(): Promise<BackendAllergy[]> {
    if (USE_MOCK) {
      await mockDelay(150);
      return [];
    }
    const res = await apiClient.get<BackendAllergy[]>('/patients/me/allergies');
    return res.data;
  },

  async createAllergy(payload: AllergyPayload): Promise<BackendAllergy> {
    const res = await apiClient.post<BackendAllergy>('/patients/me/allergies', payload);
    return res.data;
  },

  async updateAllergy(id: string, payload: AllergyPayload): Promise<BackendAllergy> {
    const res = await apiClient.put<BackendAllergy>(`/patients/me/allergies/${id}`, payload);
    return res.data;
  },

  async deleteAllergy(id: string): Promise<void> {
    await apiClient.delete(`/patients/me/allergies/${id}`);
  },

  async getConditions(): Promise<BackendCondition[]> {
    if (USE_MOCK) {
      await mockDelay(150);
      return [];
    }
    const res = await apiClient.get<BackendCondition[]>('/patients/me/conditions');
    return res.data;
  },

  async createCondition(payload: ConditionPayload): Promise<BackendCondition> {
    const res = await apiClient.post<BackendCondition>('/patients/me/conditions', payload);
    return res.data;
  },

  async updateCondition(id: string, payload: ConditionPayload): Promise<BackendCondition> {
    const res = await apiClient.put<BackendCondition>(`/patients/me/conditions/${id}`, payload);
    return res.data;
  },

  async deleteCondition(id: string): Promise<void> {
    await apiClient.delete(`/patients/me/conditions/${id}`);
  },
};
