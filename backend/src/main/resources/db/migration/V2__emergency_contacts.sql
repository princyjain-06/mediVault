-- =============================================================================
-- Migration: V2__emergency_contacts.sql
-- Description: Create emergency_contacts table and index
-- =============================================================================

CREATE TABLE emergency_contacts (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL,
    name VARCHAR(100) NOT NULL,
    relationship VARCHAR(30),
    phone VARCHAR(15) NOT NULL,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_emergency_contacts_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE INDEX idx_emergency_contacts_patient_id ON emergency_contacts(patient_id);
