/**
 * Records service — talks to POST/GET/DELETE /api/patients/me/documents.
 * Uses multipart/form-data for uploads.
 */
import { apiClient, USE_MOCK, mockDelay } from './client';
import { patientService } from './patientService';
import { MedicalRecord } from '../types';

// ── Backend document shape ──────────────────────────
export interface ServerDocument {
  id: string;
  patientId: string;
  title: string;
  documentType: string;   // BLOOD_REPORT, PRESCRIPTION, RADIOLOGY, CONSULTATION, DISCHARGE, OTHER
  contentType: string;
  fileSize: number;
  reportDate: string | null;
  uploadedAt: string;
  doctor?: string;
  facility?: string;
  summary?: string;
}

// ── Map backend shape → frontend MedicalRecord ──────
function toMedicalRecord(doc: ServerDocument): MedicalRecord {
  const categoryMap: Record<string, MedicalRecord['category']> = {
    BLOOD_REPORT: 'lab',
    PRESCRIPTION: 'prescription',
    RADIOLOGY: 'radiology',
    CONSULTATION: 'consultation',
    DISCHARGE: 'discharge',
    OTHER: 'lab',
  };

  return {
    id: doc.id,
    title: doc.title,
    category: categoryMap[doc.documentType] || 'lab',
    doctor: doc.doctor || '',
    facility: doc.facility || '',
    date: doc.reportDate || doc.uploadedAt?.split('T')[0] || '',
    summary: doc.summary || 'Uploaded document.',
    aiKeyFindings: ['Document uploaded. AI extraction pending.'],
    tags: [doc.documentType.replace('_', ' ').toLowerCase(), 'uploaded'],
    isEncrypted: true,
    fileUrl: `/api/patients/me/documents/${doc.id}/file`,
  };
}

// ── Map frontend category → backend DocumentType ────
function toCategoryType(cat: string): string {
  const map: Record<string, string> = {
    lab: 'BLOOD_REPORT',
    prescription: 'PRESCRIPTION',
    radiology: 'RADIOLOGY',
    consultation: 'CONSULTATION',
    discharge: 'DISCHARGE',
  };
  return map[cat] || 'OTHER';
}

export const recordsService = {
  /**
   * List all documents for the logged-in patient.
   */
  async getMyDocuments(): Promise<MedicalRecord[]> {
    if (USE_MOCK) {
      await mockDelay(350);
      const patient = await patientService.getPatientById('pat-001');
      return patient.recentRecords || [];
    }
    const response = await apiClient.get<ServerDocument[]>('/patients/me/documents');
    return response.data.map(toMedicalRecord);
  },

  /**
   * Upload a file with metadata. Uses multipart/form-data.
   */
  async uploadDocument(
    file: File,
    title: string,
    category: string,
    doctor: string,
    facility: string,
    summary: string,
    reportDate?: string,
  ): Promise<MedicalRecord> {
    if (USE_MOCK) {
      await mockDelay(600);
      return {
        id: `rec-${Date.now()}`,
        title,
        category: category as MedicalRecord['category'],
        doctor,
        facility,
        date: reportDate || new Date().toISOString().split('T')[0],
        summary: summary || 'Patient uploaded document.',
        aiKeyFindings: ['AI extraction pending.'],
        tags: [category, 'uploaded'],
        isEncrypted: true,
      };
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('documentType', toCategoryType(category));
    if (doctor) formData.append('doctor', doctor);
    if (facility) formData.append('facility', facility);
    if (summary) formData.append('summary', summary);
    if (reportDate) formData.append('reportDate', reportDate);

    const response = await apiClient.post<ServerDocument>('/patients/me/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000, // 30s for large files
    });
    return toMedicalRecord(response.data);
  },

  /**
   * Delete a document by id.
   */
  async deleteDocument(documentId: string): Promise<void> {
    if (USE_MOCK) {
      await mockDelay(300);
      return;
    }
    await apiClient.delete(`/patients/me/documents/${documentId}`);
  },

  // ── Backward-compatible aliases (used by PatientContext refresh) ──
  async getRecordsByPatient(_patientId: string): Promise<MedicalRecord[]> {
    return this.getMyDocuments();
  },

  async addRecord(_patientId: string, record: Omit<MedicalRecord, 'id'>): Promise<MedicalRecord> {
    if (USE_MOCK) {
      await mockDelay(600);
      const patient = await patientService.getPatientById(_patientId);
      const newRecord: MedicalRecord = {
        ...record,
        id: `rec-${Date.now()}`,
        isEncrypted: true,
      };
      patient.recentRecords = [newRecord, ...patient.recentRecords];
      await patientService.updatePatient(patient);
      return newRecord;
    }
    // In real mode, this shouldn't be called — uploadDocument should be used instead
    throw new Error('Use uploadDocument() with a File for real API uploads');
  },
};
