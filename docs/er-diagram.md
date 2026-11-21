# MediVault MVP Entity-Relationship Diagram

This diagram visualizes the PostgreSQL database schema managed via Flyway (`V1__init.sql`, `V2__emergency_contacts.sql`, and `V3__add_document_metadata.sql`).

```mermaid
erDiagram
    APP_USERS ||--|| PATIENTS : "has one health profile"
    PATIENTS ||--o{ EMERGENCY_CONTACTS : "has many"
    PATIENTS ||--o{ MEDICAL_DOCUMENTS : "uploads"
    MEDICAL_DOCUMENTS ||--o| DOCUMENT_EXTRACTIONS : "processed into"
    PATIENTS ||--o{ LAB_RESULTS : "belongs to"
    MEDICAL_DOCUMENTS ||--o{ LAB_RESULTS : "originates from"
    PATIENTS ||--o{ MEDICATIONS : "prescribed to"
    MEDICAL_DOCUMENTS ||--o{ MEDICATIONS : "extracted from"

    APP_USERS {
        VARCHAR(36) id PK
        VARCHAR(255) email UK
        VARCHAR(255) name
        VARCHAR(255) password "BCrypt hash"
        VARCHAR(32) role "Enum: PATIENT, DOCTOR, DIETITIAN, ADMIN"
        BOOLEAN email_verified
        TIMESTAMP created_at
    }

    PATIENTS {
        VARCHAR(36) id PK
        VARCHAR(36) user_id FK,UK "1-to-1 link to app_users"
        VARCHAR(255) name
        DATE date_of_birth
        VARCHAR(32) gender
        VARCHAR(16) blood_group
        VARCHAR(32) phone
        VARCHAR(64) abha_id
        TIMESTAMP created_at
    }

    EMERGENCY_CONTACTS {
        VARCHAR(36) id PK
        VARCHAR(36) patient_id FK "Cascade delete on patient deletion"
        VARCHAR(100) name
        VARCHAR(30) relationship
        VARCHAR(15) phone "10 digits"
        BOOLEAN is_primary "Only one primary contact per patient"
        TIMESTAMP created_at
    }

    MEDICAL_DOCUMENTS {
        VARCHAR(36) id PK
        VARCHAR(36) patient_id FK
        VARCHAR(32) document_type "Enum: BLOOD_REPORT, PRESCRIPTION, RADIOLOGY, CONSULTATION, DISCHARGE, OTHER"
        VARCHAR(255) title
        VARCHAR(128) content_type "e.g. application/pdf"
        BIGINT file_size "bytes"
        DATE report_date
        VARCHAR(100) doctor "Doctor name from upload form"
        VARCHAR(200) facility "Hospital/clinic from upload form"
        TEXT summary "Clinical overview from upload form"
        TIMESTAMP uploaded_at
    }

    DOCUMENT_EXTRACTIONS {
        VARCHAR(36) id PK
        VARCHAR(36) document_id FK,UK "1-to-1 link to medical_documents"
        TEXT raw_text "OCR output"
        JSONB structured_json "Parsed key-values"
        VARCHAR(32) status "Enum: PENDING, PROCESSING, DONE, FAILED"
        TEXT error_message
        VARCHAR(64) ocr_engine
        VARCHAR(64) llm_model
        BOOLEAN user_confirmed
        TIMESTAMP confirmed_at
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    LAB_RESULTS {
        VARCHAR(36) id PK
        VARCHAR(36) patient_id FK
        VARCHAR(36) document_id FK
        VARCHAR(255) test_name "Raw name as written on report"
        VARCHAR(255) canonical_test_name "Standardized name (e.g. Hemoglobin)"
        NUMERIC(10,3) value_number "Quantitative test value"
        VARCHAR(255) value_text "Qualitative test value"
        VARCHAR(64) unit "e.g. g/dL, mg/dL"
        NUMERIC(10,3) ref_low "Reference range lower bound"
        NUMERIC(10,3) ref_high "Reference range upper bound"
        VARCHAR(32) flag "Enum: LOW, NORMAL, HIGH, UNKNOWN"
        DATE result_date
        INT page_number
        NUMERIC(4,3) confidence "AI confidence 0.000 - 1.000"
        BOOLEAN verified
        TIMESTAMP created_at
    }

    MEDICATIONS {
        VARCHAR(36) id PK
        VARCHAR(36) patient_id FK
        VARCHAR(36) document_id FK
        VARCHAR(255) name
        VARCHAR(128) dosage "e.g. 500 mg"
        VARCHAR(128) frequency "e.g. Twice daily with meals"
        VARCHAR(128) duration "e.g. 90 days, Ongoing"
        DATE prescribed_date
        INT page_number
        NUMERIC(4,3) confidence "AI confidence 0.000 - 1.000"
        BOOLEAN verified
        TIMESTAMP created_at
    }
```

## Key Architecture & Storage Rules
1. **File Storage Isolation**: Neither the file blob nor file paths are stored in the database. Storage locations are deterministically computed in `FileStorageService`:
   `uploads/{patient_id}/{document_id}.{extension}`
2. **Emergency Contact Ownership & Single-Primary Rule**:
   - `EMERGENCY_CONTACTS` links directly to `PATIENTS`.
   - Indexed on `patient_id` for fast contact lookup.
   - The first contact added is automatically set to `is_primary = true`.
   - Only one contact can be primary at any time; promoting any contact clears primary on all other contacts for that patient.
   - Deleting the primary contact automatically promotes the oldest remaining contact to primary.
3. **Dual-Key Provenance**: `lab_results` and `medications` carry both `patient_id` and `document_id` for instant patient scoping and source traceability.
4. **Cascading Deletion**: Deleting a patient cascades to emergency contacts, documents, lab results, medications, and extractions.
5. **Timeline Indexing**: A compound index on `(patient_id, canonical_test_name, result_date)` ensures fast trend graph generation.
