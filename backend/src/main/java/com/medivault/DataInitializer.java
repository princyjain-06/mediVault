package com.medivault;

import com.medivault.model.*;
import com.medivault.model.enums.DocumentType;
import com.medivault.model.enums.ExtractionStatus;
import com.medivault.model.enums.LabFlag;
import com.medivault.model.enums.UserRole;
import com.medivault.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

/**
 * Data initializer safe to run on every application restart.
 * Uses findByEmail to check for existence so no duplicate accounts or data are created.
 */
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final AppUserRepository userRepository;
    private final PatientRepository patientRepository;
    private final MedicalDocumentRepository documentRepository;
    private final DocumentExtractionRepository extractionRepository;
    private final LabResultRepository labResultRepository;
    private final MedicationRepository medicationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        String defaultHashedPassword = passwordEncoder.encode("Password@123");

        // ── 1. Rajesh Sharma (pat-001) ───────────────────────────
        seedPatientIfAbsent(
                "rajesh.sharma@example.com",
                "Rajesh Sharma",
                defaultHashedPassword,
                "pat-001",
                LocalDate.of(1972, 5, 15),
                "Male",
                "O+",
                "+91 98201 44521",
                "91-4589-2044-1182",
                patient -> {
                    // Seed a blood report document
                    MedicalDocument doc = documentRepository.save(MedicalDocument.builder()
                            .id("doc-001-rajesh")
                            .patient(patient)
                            .documentType(DocumentType.BLOOD_REPORT)
                            .title("Comprehensive Metabolic & Lipid Panel")
                            .contentType("application/pdf")
                            .fileSize(248910L)
                            .reportDate(LocalDate.of(2026, 9, 15))
                            .build());

                    extractionRepository.save(DocumentExtraction.builder()
                            .document(doc)
                            .rawText("Apex Diagnostics. Fasting Blood Sugar: 132 mg/dL. HbA1c: 7.4%. Serum LDL: 142 mg/dL.")
                            .structuredJson("{\"fbs\": 132, \"hba1c\": 7.4, \"ldl\": 142}")
                            .status(ExtractionStatus.DONE)
                            .ocrEngine("Tesseract-OCR")
                            .llmModel("Gemini-Flash-Medical")
                            .userConfirmed(true)
                            .build());

                    labResultRepository.save(LabResult.builder()
                            .patient(patient)
                            .document(doc)
                            .testName("Fasting Blood Sugar")
                            .canonicalTestName("Fasting Blood Sugar")
                            .valueNumber(new BigDecimal("132.000"))
                            .unit("mg/dL")
                            .refLow(new BigDecimal("70.000"))
                            .refHigh(new BigDecimal("100.000"))
                            .flag(LabFlag.HIGH)
                            .resultDate(LocalDate.of(2026, 9, 15))
                            .confidence(new BigDecimal("0.980"))
                            .verified(true)
                            .build());

                    // Seed active medication linked to doc
                    medicationRepository.save(Medication.builder()
                            .patient(patient)
                            .document(doc)
                            .name("Amlodipine Besylate")
                            .dosage("5 mg")
                            .frequency("Once daily (Morning)")
                            .duration("Ongoing")
                            .prescribedDate(LocalDate.of(2021, 4, 15))
                            .confidence(new BigDecimal("0.990"))
                            .verified(true)
                            .build());

                    medicationRepository.save(Medication.builder()
                            .patient(patient)
                            .document(doc)
                            .name("Metformin Hydrochloride")
                            .dosage("500 mg")
                            .frequency("Twice daily with meals")
                            .duration("Ongoing")
                            .prescribedDate(LocalDate.of(2022, 9, 20))
                            .confidence(new BigDecimal("0.990"))
                            .verified(true)
                            .build());
                }
        );

        // ── 2. Priya Patel (pat-002) ─────────────────────────────
        seedPatientIfAbsent(
                "priya.patel@example.com",
                "Priya Patel",
                defaultHashedPassword,
                "pat-002",
                LocalDate.of(1996, 11, 20),
                "Female",
                "B+",
                "+91 98334 11209",
                "91-6673-9081-3342",
                patient -> {
                    MedicalDocument doc = documentRepository.save(MedicalDocument.builder()
                            .id("doc-002-priya")
                            .patient(patient)
                            .documentType(DocumentType.PRESCRIPTION)
                            .title("Pulmonary Inhaler Prescription & Review")
                            .contentType("application/pdf")
                            .fileSize(184200L)
                            .reportDate(LocalDate.of(2026, 8, 10))
                            .build());

                    medicationRepository.save(Medication.builder()
                            .patient(patient)
                            .document(doc)
                            .name("Budesonide / Formoterol Inhaler")
                            .dosage("160/4.5 mcg")
                            .frequency("2 puffs twice daily")
                            .duration("Ongoing")
                            .prescribedDate(LocalDate.of(2020, 6, 10))
                            .confidence(new BigDecimal("0.970"))
                            .verified(true)
                            .build());
                }
        );

        // ── 3. Vikram Malhotra (pat-003) ─────────────────────────
        seedPatientIfAbsent(
                "vikram.malhotra@example.com",
                "Vikram Malhotra",
                defaultHashedPassword,
                "pat-003",
                LocalDate.of(1985, 3, 10),
                "Male",
                "A+",
                "+91 91234 56789",
                "91-8899-1234-5678",
                patient -> {
                    MedicalDocument doc = documentRepository.save(MedicalDocument.builder()
                            .id("doc-003-vikram")
                            .patient(patient)
                            .documentType(DocumentType.BLOOD_REPORT)
                            .title("Thyroid Function Profile (T3, T4, TSH)")
                            .contentType("application/pdf")
                            .fileSize(210540L)
                            .reportDate(LocalDate.of(2026, 7, 20))
                            .build());

                    labResultRepository.save(LabResult.builder()
                            .patient(patient)
                            .document(doc)
                            .testName("TSH (Thyroid Stimulating Hormone)")
                            .canonicalTestName("TSH")
                            .valueNumber(new BigDecimal("2.400"))
                            .unit("uIU/mL")
                            .refLow(new BigDecimal("0.400"))
                            .refHigh(new BigDecimal("4.000"))
                            .flag(LabFlag.NORMAL)
                            .resultDate(LocalDate.of(2026, 7, 20))
                            .confidence(new BigDecimal("0.990"))
                            .verified(true)
                            .build());

                    medicationRepository.save(Medication.builder()
                            .patient(patient)
                            .document(doc)
                            .name("Levothyroxine Sodium")
                            .dosage("50 mcg")
                            .frequency("Once daily on empty stomach")
                            .duration("Ongoing")
                            .prescribedDate(LocalDate.of(2023, 1, 12))
                            .confidence(new BigDecimal("0.990"))
                            .verified(true)
                            .build());
                }
        );

        // ── 4. Riya Sharma (Test Patient for Hemoglobin Trend Chart) ──
        seedPatientIfAbsent(
                "riya.sharma@example.com",
                "Riya Sharma",
                defaultHashedPassword,
                "pat-riya-001",
                LocalDate.of(1998, 4, 12),
                "Female",
                "B+",
                "+91 98111 22334",
                "91-9922-3344-5566",
                patient -> {
                    // Blood Report 1: 2026-04-10 — Hemoglobin 11.8 g/dL
                    MedicalDocument doc1 = documentRepository.save(MedicalDocument.builder()
                            .id("doc-riya-001")
                            .patient(patient)
                            .documentType(DocumentType.BLOOD_REPORT)
                            .title("CBC Complete Blood Count - Spring Screening")
                            .contentType("application/pdf")
                            .fileSize(312450L)
                            .reportDate(LocalDate.of(2026, 4, 10))
                            .build());

                    extractionRepository.save(DocumentExtraction.builder()
                            .document(doc1)
                            .rawText("Metropolis Labs. Patient: Riya Sharma. Hemoglobin: 11.8 g/dL (Reference: 12.0 - 15.5 g/dL). RBC: 4.1 mil/uL.")
                            .structuredJson("{\"test\": \"Hemoglobin\", \"value\": 11.8, \"unit\": \"g/dL\", \"flag\": \"LOW\"}")
                            .status(ExtractionStatus.DONE)
                            .ocrEngine("Tesseract-OCR")
                            .llmModel("Gemini-Flash-Medical")
                            .userConfirmed(true)
                            .build());

                    labResultRepository.save(LabResult.builder()
                            .patient(patient)
                            .document(doc1)
                            .testName("Haemoglobin (Whole Blood)")
                            .canonicalTestName("Hemoglobin")
                            .valueNumber(new BigDecimal("11.800"))
                            .unit("g/dL")
                            .refLow(new BigDecimal("12.000"))
                            .refHigh(new BigDecimal("15.500"))
                            .flag(LabFlag.LOW)
                            .resultDate(LocalDate.of(2026, 4, 10))
                            .confidence(new BigDecimal("0.990"))
                            .verified(true)
                            .build());

                    // Blood Report 2: 2026-10-15 — Hemoglobin 10.9 g/dL
                    MedicalDocument doc2 = documentRepository.save(MedicalDocument.builder()
                            .id("doc-riya-002")
                            .patient(patient)
                            .documentType(DocumentType.BLOOD_REPORT)
                            .title("Follow-up Anaemia Panel & CBC")
                            .contentType("application/pdf")
                            .fileSize(289100L)
                            .reportDate(LocalDate.of(2026, 10, 15))
                            .build());

                    extractionRepository.save(DocumentExtraction.builder()
                            .document(doc2)
                            .rawText("Apollo Diagnostics. Patient: Riya Sharma. Hb: 10.9 g/dL (Low). Serum Ferritin: 8 ng/mL.")
                            .structuredJson("{\"test\": \"Hemoglobin\", \"value\": 10.9, \"unit\": \"g/dL\", \"flag\": \"LOW\", \"ferritin\": 8}")
                            .status(ExtractionStatus.DONE)
                            .ocrEngine("Tesseract-OCR")
                            .llmModel("Gemini-Flash-Medical")
                            .userConfirmed(true)
                            .build());

                    labResultRepository.save(LabResult.builder()
                            .patient(patient)
                            .document(doc2)
                            .testName("Hemoglobin (Hb)")
                            .canonicalTestName("Hemoglobin")
                            .valueNumber(new BigDecimal("10.900"))
                            .unit("g/dL")
                            .refLow(new BigDecimal("12.000"))
                            .refHigh(new BigDecimal("15.500"))
                            .flag(LabFlag.LOW)
                            .resultDate(LocalDate.of(2026, 10, 15))
                            .confidence(new BigDecimal("0.990"))
                            .verified(true)
                            .build());

                    // Prescribed iron supplement linked to Report 2
                    medicationRepository.save(Medication.builder()
                            .patient(patient)
                            .document(doc2)
                            .name("Ferrous Ascorbate & Folic Acid")
                            .dosage("100 mg elemental iron")
                            .frequency("Once daily after dinner")
                            .duration("90 days")
                            .prescribedDate(LocalDate.of(2026, 10, 16))
                            .confidence(new BigDecimal("0.980"))
                            .verified(true)
                            .build());
                }
        );

        System.out.println(">>> [MediVault] PostgreSQL database seeding check completed successfully.");
    }

    private void seedPatientIfAbsent(
            String email,
            String name,
            String hashedPassword,
            String patientId,
            LocalDate dob,
            String gender,
            String bloodGroup,
            String phone,
            String abhaId,
            java.util.function.Consumer<Patient> onCreated
    ) {
        Optional<AppUser> existing = userRepository.findByEmail(email);
        if (existing.isPresent()) {
            return; // Already seeded, skip to prevent duplicates
        }

        AppUser user = userRepository.save(AppUser.builder()
                .email(email)
                .name(name)
                .password(hashedPassword)
                .role(UserRole.PATIENT)
                .emailVerified(true)
                .build());

        Patient patient = patientRepository.save(Patient.builder()
                .id(patientId)
                .name(name)
                .dateOfBirth(dob)
                .gender(gender)
                .bloodGroup(bloodGroup)
                .phone(phone)
                .abhaId(abhaId)
                .user(user)
                .build());

        if (onCreated != null) {
            onCreated.accept(patient);
        }
    }
}
