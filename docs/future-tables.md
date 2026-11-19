# MediVault Future Tables (Post-MVP Roadmap)

The following tables are reserved for future milestones and are **not** part of the MVP:

1. **lab_test_aliases**: Maps vendor-specific test naming variations (e.g. "Hb", "HGB", "Haemoglobin") to canonical standard medical test names.
2. **audit_logs**: Immutable access log recording who viewed, exported, modified, or shared a patient's protected medical records.
3. **conditions**: Chronic and acute patient diagnostic history with onset date, resolution status, ICD-10 coding, and clinical notes.
4. **allergies**: Verified drug, food, and environmental hypersensitivities with clinical reaction severity and contraindication triggers.
5. **vitals**: Time-series biometric entries (blood pressure, blood glucose, heart rate, SpO2, body temperature, and weight).
6. **symptom_checks**: User-initiated AI symptom evaluations capturing reported symptoms, triage tier, red flags, and personalized clinical insights.
7. **document_chunks**: Text embeddings with `pgvector` for semantic document retrieval and medical knowledge base cross-referencing.
8. **access_grants**: Time-bound consent permissions allowing specific doctors or family members to view a patient's vault.
9. **doctors**: Verified healthcare provider directory with medical registration numbers, clinical specialties, and affiliated hospitals.
10. **dietitians**: Registered clinical nutritionist directory with specialty areas, clinic affiliations, and consultation settings.
11. **consultations**: Scheduled, in-progress, or concluded tele-consultations and hospital visits linked to doctor and patient records.
12. **diet_plans**: Structured meal plans, macronutrient breakdowns, and nutritional recommendations authored by dietitians.
