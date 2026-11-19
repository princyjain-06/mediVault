-- =============================================================================
-- MediVault MVP Database Schema (PostgreSQL)
-- Version: V1__init.sql
-- Tables:
--   1. app_users
--   2. patients
--   3. medical_documents
--   4. document_extractions
--   5. lab_results
--   6. medications
-- =============================================================================

-- 1. app_users (Authentication & Credentials)
CREATE TABLE app_users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,               -- BCrypt hashed
    role VARCHAR(32) NOT NULL DEFAULT 'PATIENT',  -- Enum: PATIENT, DOCTOR, DIETITIAN, ADMIN
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. patients (Health Profile, 1-to-1 with app_users)
CREATE TABLE patients (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL UNIQUE,          -- 1-to-1 link to app_users
    name VARCHAR(255) NOT NULL,                   -- Only name is required
    date_of_birth DATE,
    gender VARCHAR(32),
    blood_group VARCHAR(16),
    phone VARCHAR(32),
    abha_id VARCHAR(64),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_patients_user FOREIGN KEY (user_id) REFERENCES app_users(id) ON DELETE CASCADE
);

-- 3. medical_documents (Uploaded Medical Files Metadata)
-- Notice: File location is not stored here. It is computed as uploads/{patient_id}/{document_id}.{ext}
CREATE TABLE medical_documents (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL,
    document_type VARCHAR(32) NOT NULL,           -- Enum: BLOOD_REPORT, PRESCRIPTION, OTHER
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(128) NOT NULL,           -- e.g. application/pdf, image/jpeg, image/png
    file_size BIGINT NOT NULL,                    -- bytes
    report_date DATE,
    uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_documents_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
);

-- 4. document_extractions (Raw & Structured Extraction from Document)
CREATE TABLE document_extractions (
    id VARCHAR(36) PRIMARY KEY,
    document_id VARCHAR(36) NOT NULL UNIQUE,      -- 1-to-1 link to medical_documents
    raw_text TEXT,
    structured_json JSONB,                        -- Parsed structured JSON representation
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',-- Enum: PENDING, PROCESSING, DONE, FAILED
    error_message TEXT,
    ocr_engine VARCHAR(64),
    llm_model VARCHAR(64),
    user_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    confirmed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_extractions_document FOREIGN KEY (document_id) REFERENCES medical_documents(id) ON DELETE CASCADE
);

-- 5. lab_results (Extracted Discrete Laboratory Values from Blood Reports)
CREATE TABLE lab_results (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL,
    document_id VARCHAR(36) NOT NULL,
    test_name VARCHAR(255) NOT NULL,              -- Exact label from report (e.g. "Hb", "Haemoglobin (Whole Blood)")
    canonical_test_name VARCHAR(255) NOT NULL,    -- Standardized name (e.g. "Hemoglobin") for charts & aggregation
    value_number NUMERIC(10, 3),                  -- Decimal value for numeric tests
    value_text VARCHAR(255),                      -- Text result for qualitative tests (e.g. "Negative", "Reactive")
    unit VARCHAR(64),                             -- e.g. "g/dL", "mg/dL", "uIU/mL"
    ref_low NUMERIC(10, 3),                       -- Reference interval lower bound
    ref_high NUMERIC(10, 3),                      -- Reference interval upper bound
    flag VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN',  -- Enum: LOW, NORMAL, HIGH, UNKNOWN
    result_date DATE,
    page_number INT,
    confidence NUMERIC(4, 3),                     -- 0.000 to 1.000 AI confidence score
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lab_results_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_lab_results_document FOREIGN KEY (document_id) REFERENCES medical_documents(id) ON DELETE CASCADE
);

-- 6. medications (Prescriptions Extracted from Prescriptions / Clinical Notes)
CREATE TABLE medications (
    id VARCHAR(36) PRIMARY KEY,
    patient_id VARCHAR(36) NOT NULL,
    document_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(128),                          -- e.g. "500 mg", "5 mg"
    frequency VARCHAR(128),                       -- e.g. "Twice daily with meals"
    duration VARCHAR(128),                        -- e.g. "14 days", "Ongoing"
    prescribed_date DATE,
    page_number INT,
    confidence NUMERIC(4, 3),                     -- 0.000 to 1.000 AI confidence score
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_medications_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    CONSTRAINT fk_medications_document FOREIGN KEY (document_id) REFERENCES medical_documents(id) ON DELETE CASCADE
);

-- Indexes for performance & security
CREATE INDEX idx_patients_user_id ON patients(user_id);

CREATE INDEX idx_medical_documents_patient_id ON medical_documents(patient_id);

CREATE INDEX idx_document_extractions_document_id ON document_extractions(document_id);

CREATE INDEX idx_lab_results_patient_id ON lab_results(patient_id);
CREATE INDEX idx_lab_results_document_id ON lab_results(document_id);
-- Compound index for fast timeline & trend graphs (e.g. Hemoglobin over time)
CREATE INDEX idx_lab_results_trends ON lab_results(patient_id, canonical_test_name, result_date);

CREATE INDEX idx_medications_patient_id ON medications(patient_id);
CREATE INDEX idx_medications_document_id ON medications(document_id);
