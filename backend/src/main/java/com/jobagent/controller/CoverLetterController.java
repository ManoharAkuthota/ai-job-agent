package com.jobagent.controller;

import com.jobagent.model.CoverLetter;
import com.jobagent.service.CoverLetterService;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.util.List;

@RestController
@RequestMapping("/api/cover-letters")
public class CoverLetterController {

    private final CoverLetterService coverLetterService;

    public CoverLetterController(CoverLetterService coverLetterService) {
        this.coverLetterService = coverLetterService;
    }

    @PostMapping("/generate/{jobId}")
    public ResponseEntity<?> generateCoverLetter(@PathVariable Long jobId) {
        try {
            CoverLetter coverLetter = coverLetterService.generateCoverLetter(jobId);
            return ResponseEntity.ok(coverLetter);
        } catch (Throwable e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(java.util.Map.of(
                    "error", e.getMessage() != null ? e.getMessage() : "Error generating cover letter",
                    "type", e.getClass().getSimpleName()
            ));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllCoverLetters() {
        try {
            return ResponseEntity.ok(coverLetterService.getAllCoverLetters());
        } catch (Throwable t) {
            t.printStackTrace();
            return ResponseEntity.status(500).body(java.util.Map.of(
                    "error", t.getMessage() != null ? t.getMessage() : t.toString(),
                    "type", t.getClass().getSimpleName()
            ));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<CoverLetter> getCoverLetterById(@PathVariable Long id) {
        CoverLetter cl = coverLetterService.getCoverLetterById(id);
        if (cl == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(cl);
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<Resource> downloadCoverLetterPdf(@PathVariable Long id) {
        CoverLetter cl = coverLetterService.getCoverLetterById(id);
        if (cl == null || cl.getPdfFilePath() == null) {
            return ResponseEntity.notFound().build();
        }

        File file = new File(cl.getPdfFilePath());
        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(file);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(resource);
    }
}
