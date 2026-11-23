-- V4: Add file_path and file_url columns to medical_documents
ALTER TABLE medical_documents ADD COLUMN file_path VARCHAR(500);
ALTER TABLE medical_documents ADD COLUMN file_url VARCHAR(500);
