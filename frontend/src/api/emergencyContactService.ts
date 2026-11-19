import { apiClient, USE_MOCK, mockDelay } from './client';
import { EmergencyContact, EmergencyContactPayload } from '../types/emergencyContact';

const STORAGE_KEY = 'mediVault_emergency_contacts';

function getStoredContacts(): EmergencyContact[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }
  return [];
}

function saveStoredContacts(contacts: EmergencyContact[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

export const emergencyContactService = {
  /**
   * GET /api/patients/me/emergency-contacts
   * Returns list of contacts, primary first.
   */
  async getContacts(): Promise<EmergencyContact[]> {
    if (USE_MOCK) {
      await mockDelay(200);
      return getStoredContacts();
    }
    const response = await apiClient.get<EmergencyContact[]>('/patients/me/emergency-contacts');
    return response.data;
  },

  /**
   * POST /api/patients/me/emergency-contacts
   * Adds an emergency contact.
   */
  async createContact(payload: EmergencyContactPayload): Promise<EmergencyContact> {
    if (USE_MOCK) {
      await mockDelay(300);
      const contacts = getStoredContacts();
      const newContact: EmergencyContact = {
        id: `em-${Date.now()}`,
        name: payload.name,
        relationship: payload.relationship,
        phone: payload.phone.replace(/\D/g, ''),
        isPrimary: contacts.length === 0 || payload.isPrimary !== false,
        createdAt: new Date().toISOString(),
      };
      if (newContact.isPrimary) {
        contacts.forEach((c) => (c.isPrimary = false));
      }
      contacts.push(newContact);
      saveStoredContacts(contacts);
      return newContact;
    }
    const response = await apiClient.post<EmergencyContact>('/patients/me/emergency-contacts', payload);
    return response.data;
  },

  /**
   * PUT /api/patients/me/emergency-contacts/{id}
   * Updates an existing contact.
   */
  async updateContact(id: string, payload: EmergencyContactPayload): Promise<EmergencyContact> {
    if (USE_MOCK) {
      await mockDelay(300);
      const contacts = getStoredContacts();
      const idx = contacts.findIndex((c) => c.id === id);
      if (idx !== -1) {
        if (payload.isPrimary) {
          contacts.forEach((c) => (c.isPrimary = false));
        }
        contacts[idx] = {
          ...contacts[idx],
          name: payload.name,
          relationship: payload.relationship,
          phone: payload.phone.replace(/\D/g, ''),
          isPrimary: payload.isPrimary ?? contacts[idx].isPrimary,
        };
        saveStoredContacts(contacts);
        return contacts[idx];
      }
      throw new Error('Contact not found');
    }
    const response = await apiClient.put<EmergencyContact>(`/patients/me/emergency-contacts/${id}`, payload);
    return response.data;
  },

  /**
   * DELETE /api/patients/me/emergency-contacts/{id}
   * Deletes a contact.
   */
  async deleteContact(id: string): Promise<void> {
    if (USE_MOCK) {
      await mockDelay(250);
      let contacts = getStoredContacts();
      const target = contacts.find((c) => c.id === id);
      contacts = contacts.filter((c) => c.id !== id);
      if (target?.isPrimary && contacts.length > 0) {
        contacts[0].isPrimary = true;
      }
      saveStoredContacts(contacts);
      return;
    }
    await apiClient.delete(`/patients/me/emergency-contacts/${id}`);
  },
};
