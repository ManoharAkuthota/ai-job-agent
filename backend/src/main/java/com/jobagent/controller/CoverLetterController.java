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
@CrossOrigin(origins = "*")
public class CoverLetterController {

    private final CoverLetterService coverLetterService;

    public CoverLetterController(CoverLetterService coverLetterService) {
        this.coverLetterService = coverLetterService;
    }

    @PostMapping("/generate/{jobId}")
    public ResponseEntity<CoverLetter> generateCoverLetter(@PathVariable Long jobId) {
        try {
            CoverLetter coverLetter = coverLetterService.generateCoverLetter(jobId);
            return ResponseEntity.ok(coverLetter);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<CoverLetter>> getAllCoverLetters() {
        return ResponseEntity.ok(coverLetterService.getAllCoverLetters());
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
