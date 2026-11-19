package com.medivault.repository;

import com.medivault.model.DocumentExtraction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface DocumentExtractionRepository extends JpaRepository<DocumentExtraction, String> {
    Optional<DocumentExtraction> findByDocument_Id(String documentId);
}
