/**
 * Records service — talks to POST/GET/DELETE /api/patients/me/documents.
 * Uses multipart/form-data for uploads.
 */
import { apiClient, USE_MOCK, mockDelay } from './client';
import { patientService } from './patientService';
import { MedicalRecord, PatientRecordSummary } from '../types';

export interface ExtractedMedication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration?: string;
}

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
  extractedMedications?: ExtractedMedication[];
  extractedTextPreview?: string;
  extractionStatus?: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
  extractionErrorMessage?: string;
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

  const isFailed = doc.extractionStatus === 'FAILED';
  const findings: string[] = [];
  if (isFailed) {
    findings.push(doc.extractionErrorMessage || 'AI extraction failed. Click "Try again" to re-process.');
  } else if (doc.extractedMedications && doc.extractedMedications.length > 0) {
    findings.push(
      `Extracted ${doc.extractedMedications.length} medication(s): ` +
        doc.extractedMedications.map((m) => `${m.name} (${m.dosage}, ${m.frequency})`).join('; ')
    );
  } else {
    findings.push('Document analyzed with AI extraction & clinical parser.');
  }

  const tags = [doc.documentType.replace('_', ' ').toLowerCase()];
  if (isFailed) {
    tags.push('failed');
  } else {
    tags.push('extracted');
  }

  return {
    id: doc.id,
    title: doc.title,
    category: categoryMap[doc.documentType] || 'lab',
    doctor: doc.doctor || '',
    facility: doc.facility || '',
    date: doc.reportDate || doc.uploadedAt?.split('T')[0] || '',
    summary: doc.summary || 'Uploaded document.',
    aiKeyFindings: findings,
    tags,
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

  /**
   * Re-runs extraction for a failed document ("Try Again").
   */
  async retryExtraction(documentId: string): Promise<MedicalRecord> {
    if (USE_MOCK) {
      await mockDelay(400);
      const docs = await this.getMyDocuments();
      return docs[0];
    }
    const response = await apiClient.post<ServerDocument>(`/patients/me/documents/${documentId}/retry-extraction`);
    return toMedicalRecord(response.data);
  },

  /**
   * Generates a 1-2 page AI clinical summary of all documents and records.
   */
  async getRecordsSummary(): Promise<PatientRecordSummary> {
    const response = await apiClient.get<PatientRecordSummary>('/patients/me/records/summary');
    return response.data;
  },

  /**
   * Downloads the generated PDF health summary report.
   */
  async downloadRecordsSummaryPdf(): Promise<void> {
    const response = await apiClient.get('/patients/me/records/summary/pdf', {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'medivault-health-summary.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
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
