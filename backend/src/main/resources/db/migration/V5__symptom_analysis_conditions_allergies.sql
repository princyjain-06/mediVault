-- =============================================================================
-- MediVault Symptom Analysis, Conditions & Allergies Schema (PostgreSQL)
-- Version: V5__symptom_analysis_conditions_allergies.sql
-- Tables:
--   1. conditions
--   2. allergies
--   3. symptom_checks
-- =============================================================================

-- 1. conditions (Chronic / Diagnosed Conditions from Documents or Manual Entry)
CREATE TABLE conditions (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL,
    document_id VARCHAR(36),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN', -- Enum: ACTIVE, RESOLVED, UNKNOWN
    diagnosed_date DATE,
    source VARCHAR(32) NOT NULL DEFAULT 'MANUAL',  -- Enum: DOCUMENT, MANUAL
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_conditions_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_conditions_document FOREIGN KEY (document_id) REFERENCES medical_documents(id) ON DELETE SET NULL
);

-- 2. allergies (Allergies from Documents or Manual Entry)
CREATE TABLE allergies (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL,
    document_id VARCHAR(36),
    allergen VARCHAR(255) NOT NULL,
    reaction VARCHAR(255),
    severity VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN', -- Enum: MILD, MODERATE, SEVERE, UNKNOWN
    source VARCHAR(32) NOT NULL DEFAULT 'MANUAL',    -- Enum: DOCUMENT, MANUAL
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_allergies_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_allergies_document FOREIGN KEY (document_id) REFERENCES medical_documents(id) ON DELETE SET NULL
);

-- 3. symptom_checks (Personalized Symptom Analysis History)
CREATE TABLE symptom_checks (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL,
    symptoms TEXT,
    selected_symptoms JSONB,                         -- List of selected symptom chips
    body_area VARCHAR(128),
    severity INT NOT NULL,                           -- 1-10 scale
    duration_value INT NOT NULL,                     -- 1-365
    duration_unit VARCHAR(16) NOT NULL,              -- Enum: HOURS, DAYS, WEEKS, MONTHS
    onset VARCHAR(16),                               -- Enum: SUDDEN, GRADUAL (nullable)
    urgency VARCHAR(32) NOT NULL,                    -- Enum: SELF_CARE, SEE_DOCTOR, EMERGENCY
    safety_rule_applied BOOLEAN NOT NULL DEFAULT FALSE,
    ai_available BOOLEAN NOT NULL DEFAULT TRUE,
    result_json JSONB,                               -- Full structured analysis response
    history_snapshot TEXT,                           -- Exact health history text sent to AI
    llm_model VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_symptom_checks_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- Indexes for fast patient-scoped queries and rate-limiting
CREATE INDEX idx_conditions_patient_id ON conditions(patient_id);
CREATE INDEX idx_allergies_patient_id ON allergies(patient_id);
CREATE INDEX idx_symptom_checks_patient_id ON symptom_checks(patient_id);
CREATE INDEX idx_symptom_checks_patient_created ON symptom_checks(patient_id, created_at);
