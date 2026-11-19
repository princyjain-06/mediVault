export interface EmergencyContact {
  id?: string;
  name: string;
  relationship?: string;
  phone: string;
  isPrimary?: boolean;
  createdAt?: string;
}

export interface EmergencyContactPayload {
  name: string;
  relationship?: string;
  phone: string;
  isPrimary?: boolean;
}
