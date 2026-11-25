package com.medivault.service;

import com.medivault.dto.PatientRecordSummaryResponse;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Service
@Slf4j
public class PdfSummaryGenerator {

    private static final float MARGIN_LEFT = 45f;
    private static final float MARGIN_RIGHT = 550f;
    private static final float USABLE_WIDTH = MARGIN_RIGHT - MARGIN_LEFT;
    private static final float PAGE_TOP = 800f;
    private static final float PAGE_BOTTOM = 55f;

    public byte[] generatePdf(PatientRecordSummaryResponse summary) {
        try (PDDocument doc = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PdfContext ctx = new PdfContext(doc);

            // Draw Header Banner
            drawHeader(ctx, summary);

            // 1. Executive Summary
            drawSection(ctx, "EXECUTIVE CLINICAL SUMMARY", List.of(summary.getExecutiveSummary() != null ? summary.getExecutiveSummary() : "No summary available."));

            // 2. Chronic / Active Conditions
            if (summary.getChronicConditions() != null && !summary.getChronicConditions().isEmpty()) {
                drawSection(ctx, "ACTIVE & CHRONIC CONDITIONS", summary.getChronicConditions());
            }

            // 3. Current Medications
            if (summary.getActiveMedications() != null && !summary.getActiveMedications().isEmpty()) {
                drawSection(ctx, "ACTIVE MEDICATIONS & DOSAGES", summary.getActiveMedications());
            }

            // 4. Notable Lab Findings
            if (summary.getNotableLabFindings() != null && !summary.getNotableLabFindings().isEmpty()) {
                drawSection(ctx, "KEY LABORATORY FINDINGS & TRENDS", summary.getNotableLabFindings());
            }

            // 5. Critical Allergies
            if (summary.getCriticalAllergies() != null && !summary.getCriticalAllergies().isEmpty()) {
                drawSection(ctx, "ALLERGIES & CLINICAL ALERTS", summary.getCriticalAllergies());
            }

            // 6. Clinical Recommendations
            if (summary.getClinicalRecommendations() != null && !summary.getClinicalRecommendations().isEmpty()) {
                drawSection(ctx, "PREVENTIVE CARE & RECOMMENDATIONS", summary.getClinicalRecommendations());
            }

            // Draw Footer on all pages
            ctx.closeCurrentStream();
            drawFooters(doc);

            doc.save(out);
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate PDF summary: {}", e.getMessage(), e);
            throw new RuntimeException("Could not generate PDF summary: " + e.getMessage(), e);
        }
    }

    private void drawHeader(PdfContext ctx, PatientRecordSummaryResponse s) throws IOException {
        // Teal Header Bar
        ctx.stream.setNonStrokingColor(13, 148, 136); // #0d9488 Teal-600
        ctx.stream.addRect(MARGIN_LEFT, ctx.y - 45, USABLE_WIDTH, 45);
        ctx.stream.fill();

        // Title
        ctx.stream.setNonStrokingColor(Color.WHITE);
        ctx.stream.beginText();
        ctx.stream.setFont(PDType1Font.HELVETICA_BOLD, 16);
        ctx.stream.newLineAtOffset(MARGIN_LEFT + 12, ctx.y - 25);
        ctx.stream.showText("MediVault - Longitudinal Health Summary");
        ctx.stream.endText();

        ctx.stream.beginText();
        ctx.stream.setFont(PDType1Font.HELVETICA, 9);
        ctx.stream.newLineAtOffset(MARGIN_LEFT + 12, ctx.y - 38);
        ctx.stream.showText("Generated: " + sanitize(s.getGeneratedDate()) + " | Documents Synthesized: " + s.getTotalDocumentsAnalyzed());
        ctx.stream.endText();

        ctx.y -= 55;

        // Patient Info Bar
        ctx.stream.setNonStrokingColor(241, 245, 249); // Slate-100
        ctx.stream.addRect(MARGIN_LEFT, ctx.y - 22, USABLE_WIDTH, 22);
        ctx.stream.fill();

        ctx.stream.setNonStrokingColor(30, 41, 59); // Slate-800
        ctx.stream.beginText();
        ctx.stream.setFont(PDType1Font.HELVETICA_BOLD, 9);
        ctx.stream.newLineAtOffset(MARGIN_LEFT + 8, ctx.y - 15);
        String patientLine = "Patient: " + sanitize(s.getPatientName()) +
                "  |  Demographics: " + sanitize(s.getAgeAndGender()) +
                "  |  Blood Group: " + sanitize(s.getBloodGroup()) +
                (s.isAiGenerated() ? "  |  Synthesis: Gemini Clinical AI" : "  |  Synthesis: Clinical Parser");
        ctx.stream.showText(patientLine);
        ctx.stream.endText();

        ctx.y -= 35;
    }

    private void drawSection(PdfContext ctx, String title, List<String> items) throws IOException {
        ctx.ensureSpace(35);

        // Section header
        ctx.stream.setNonStrokingColor(15, 23, 42); // Slate-900
        ctx.stream.beginText();
        ctx.stream.setFont(PDType1Font.HELVETICA_BOLD, 10);
        ctx.stream.newLineAtOffset(MARGIN_LEFT, ctx.y);
        ctx.stream.showText(sanitize(title));
        ctx.stream.endText();

        // Divider rule
        ctx.stream.setStrokingColor(203, 213, 225); // Slate-300
        ctx.stream.setLineWidth(0.8f);
        ctx.stream.moveTo(MARGIN_LEFT, ctx.y - 3);
        ctx.stream.lineTo(MARGIN_RIGHT, ctx.y - 3);
        ctx.stream.stroke();

        ctx.y -= 14;

        ctx.stream.setFont(PDType1Font.HELVETICA, 8.5f);
        ctx.stream.setNonStrokingColor(51, 65, 85); // Slate-700

        for (String item : items) {
            if (item == null || item.isBlank()) continue;
            List<String> lines = wrapText(sanitize(item), 95);
            for (int i = 0; i < lines.size(); i++) {
                ctx.ensureSpace(12);
                ctx.stream.beginText();
                ctx.stream.newLineAtOffset(MARGIN_LEFT + (i == 0 ? 6 : 14), ctx.y);
                String prefix = (i == 0 && items.size() > 1 && !title.contains("SUMMARY")) ? "- " : "";
                ctx.stream.showText(prefix + lines.get(i));
                ctx.stream.endText();
                ctx.y -= 11.5f;
            }
            ctx.y -= 3f;
        }

        ctx.y -= 8;
    }

    private void drawFooters(PDDocument doc) throws IOException {
        int totalPages = doc.getNumberOfPages();
        for (int i = 0; i < totalPages; i++) {
            PDPage page = doc.getPage(i);
            try (PDPageContentStream cs = new PDPageContentStream(doc, page, PDPageContentStream.AppendMode.APPEND, true, true)) {
                cs.setStrokingColor(226, 232, 240);
                cs.setLineWidth(0.5f);
                cs.moveTo(MARGIN_LEFT, PAGE_BOTTOM + 12);
                cs.lineTo(MARGIN_RIGHT, PAGE_BOTTOM + 12);
                cs.stroke();

                cs.setNonStrokingColor(100, 116, 139);
                cs.setFont(PDType1Font.HELVETICA, 7.5f);
                cs.beginText();
                cs.newLineAtOffset(MARGIN_LEFT, PAGE_BOTTOM);
                cs.showText("MediVault - Confidential Medical Health Summary. For informational & clinical review only.");
                cs.endText();

                cs.beginText();
                cs.newLineAtOffset(MARGIN_RIGHT - 50, PAGE_BOTTOM);
                cs.showText("Page " + (i + 1) + " of " + totalPages);
                cs.endText();
            }
        }
    }

    private static List<String> wrapText(String text, int maxCharsPerLine) {
        List<String> lines = new ArrayList<>();
        String[] words = text.split("\\s+");
        StringBuilder current = new StringBuilder();
        for (String w : words) {
            if (current.length() + w.length() + 1 > maxCharsPerLine) {
                if (!current.isEmpty()) {
                    lines.add(current.toString().trim());
                    current = new StringBuilder();
                }
            }
            if (!current.isEmpty()) current.append(" ");
            current.append(w);
        }
        if (!current.isEmpty()) {
            lines.add(current.toString().trim());
        }
        return lines.isEmpty() ? List.of(text) : lines;
    }

    private static String sanitize(String input) {
        if (input == null) return "";
        return input.replace("•", "-")
                .replace("–", "-")
                .replace("—", "-")
                .replace("“", "\"")
                .replace("”", "\"")
                .replace("‘", "'")
                .replace("’", "'")
                .replace("µ", "u")
                .replaceAll("[^\\x20-\\x7E]", " ")
                .trim();
    }

    private static class PdfContext {
        final PDDocument doc;
        PDPageContentStream stream;
        float y;

        PdfContext(PDDocument doc) throws IOException {
            this.doc = doc;
            newPage();
        }

        void newPage() throws IOException {
            if (stream != null) {
                stream.close();
            }
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);
            stream = new PDPageContentStream(doc, page);
            y = PAGE_TOP;
        }

        void ensureSpace(float needed) throws IOException {
            if (y - needed < PAGE_BOTTOM + 20) {
                newPage();
            }
        }

        void closeCurrentStream() throws IOException {
            if (stream != null) {
                stream.close();
            }
        }
    }
}
