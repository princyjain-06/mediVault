-- V3: Add doctor, facility, summary columns to medical_documents
-- These store metadata entered during upload (not extracted from file)
ALTER TABLE medical_documents ADD COLUMN doctor VARCHAR(100);
ALTER TABLE medical_documents ADD COLUMN facility VARCHAR(200);
ALTER TABLE medical_documents ADD COLUMN summary TEXT;
