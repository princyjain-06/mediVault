package com.medivault.service;

import lombok.extern.slf4j.Slf4j;
import net.sourceforge.tess4j.Tesseract;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;

import java.io.File;
import java.nio.file.Path;

/**
 * Local text extraction service using Apache PDFBox for digital PDFs
 * and Tess4J (Tesseract OCR) for images, with safe fallbacks.
 */
@Service
@Slf4j
public class TextExtractionService {

    /**
     * Extracts text from the given file based on MIME content type.
     * Returns empty string if extraction fails or is unsupported, without throwing.
     */
    public String extractText(Path filePath, String contentType) {
        if (filePath == null) return "";
        File file = filePath.toFile();
        if (!file.exists() || !file.canRead()) {
            log.warn("File cannot be read for extraction: {}", filePath);
            return "";
        }

        String mime = contentType != null ? contentType.toLowerCase().trim() : "";

        // 1. Plain text / notes files
        if (mime.contains("text") || mime.contains("plain") || mime.contains("txt")) {
            try {
                return java.nio.file.Files.readString(filePath);
            } catch (Exception e) {
                log.warn("Text file read failed for {}: {}", filePath, e.getMessage());
            }
        }

        // 2. Digital PDF extraction via Apache PDFBox (100% pure Java)
        if (mime.contains("pdf")) {
            try {
                return extractPdfText(file);
            } catch (Exception e) {
                log.warn("PDFBox extraction failed for {}: {}", filePath, e.getMessage());
            }
        }

        // 2. Image OCR via Tess4J / Tesseract
        if (mime.contains("image") || mime.contains("png") || mime.contains("jpeg") || mime.contains("jpg")) {
            try {
                return extractImageOcr(file);
            } catch (Throwable t) {
                // Catches UnsatisfiedLinkError, NoClassDefFoundError if native libtesseract is absent
                log.info("Tess4J OCR unavailable or failed for {}: {}", filePath, t.getMessage());
            }
        }

        return "";
    }

    /**
     * Pure-Java PDF text extraction using Apache PDFBox.
     */
    private String extractPdfText(File file) throws Exception {
        try (PDDocument document = PDDocument.load(file)) {
            if (document.isEncrypted()) {
                log.info("PDF is encrypted, attempting decryption with empty password");
                try {
                    document.setAllSecurityToBeRemoved(true);
                } catch (Exception ignored) {}
            }
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);
            String text = stripper.getText(document);
            return text != null ? text.trim() : "";
        }
    }

    /**
     * Image OCR using Tess4J.
     */
    private String extractImageOcr(File file) throws Exception {
        Tesseract tesseract = new Tesseract();
        // Set standard English training data if available, or default
        String datapath = System.getenv("TESSDATA_PREFIX");
        if (datapath != null && !datapath.isBlank()) {
            tesseract.setDatapath(datapath);
        }
        tesseract.setLanguage("eng");
        return tesseract.doOCR(file);
    }
}
