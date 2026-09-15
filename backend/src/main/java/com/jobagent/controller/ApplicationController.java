package com.jobagent.controller;

import com.jobagent.model.Job;
import com.jobagent.model.JobApplication;
import com.jobagent.model.TailoredResume;
import com.jobagent.repository.JobApplicationRepository;
import com.jobagent.repository.JobRepository;
import com.jobagent.repository.TailoredResumeRepository;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Files;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final JobApplicationRepository applicationRepository;
    private final JobRepository jobRepository;
    private final TailoredResumeRepository tailoredResumeRepository;

    public ApplicationController(JobApplicationRepository applicationRepository,
                                 JobRepository jobRepository,
                                 TailoredResumeRepository tailoredResumeRepository) {
        this.applicationRepository = applicationRepository;
        this.jobRepository = jobRepository;
        this.tailoredResumeRepository = tailoredResumeRepository;
    }

    @GetMapping
    public List<JobApplication> getAllApplications() {
        return applicationRepository.findAllByOrderByAppliedAtDesc();
    }

    @PostMapping("/apply/{jobId}")
    public ResponseEntity<?> applyForJob(@PathVariable Long jobId, @RequestBody(required = false) Map<String, String> body) {
        Job job = jobRepository.findById(jobId).orElse(null);
        if (job == null) {
            return ResponseEntity.badRequest().body("Job not found: " + jobId);
        }

        Long resumeId = null;
        TailoredResume resume = tailoredResumeRepository.findByJobId(jobId).orElse(null);
        if (resume != null) {
            resumeId = resume.getId();
        }

        JobApplication application = applicationRepository.findByJobId(jobId).orElseGet(() ->
                new JobApplication(job.getId(), job.getTitle(), job.getCompany(), job.getLocation(), job.getUrl(), null)
        );

        application.setTailoredResumeId(resumeId);
        application.setStatus("APPLIED");
        if (body != null && body.containsKey("notes")) {
            application.setNotes(body.get("notes"));
        } else {
            application.setNotes("Application submitted via AI Agent.");
        }

        job.setStatus("APPLIED");
        jobRepository.save(job);
        JobApplication saved = applicationRepository.save(application);

        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        JobApplication app = applicationRepository.findById(id).orElse(null);
        if (app == null) {
            return ResponseEntity.notFound().build();
        }

        String newStatus = body.get("status");
        if (newStatus != null && !newStatus.isBlank()) {
            app.setStatus(newStatus.toUpperCase());
        }
        if (body.containsKey("notes")) {
            app.setNotes(body.get("notes"));
        }

        return ResponseEntity.ok(applicationRepository.save(app));
    }

    @GetMapping("/{id}/proof")
    public ResponseEntity<Resource> getProofScreenshot(@PathVariable Long id) {
        JobApplication app = applicationRepository.findById(id).orElse(null);
        if (app == null || app.getScreenshotProofPath() == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            File file = new File(app.getScreenshotProofPath());
            if (!file.exists()) {
                return ResponseEntity.notFound().build();
            }
            byte[] bytes = Files.readAllBytes(file.toPath());
            ByteArrayResource resource = new ByteArrayResource(bytes);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_PNG)
                    .contentLength(file.length())
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteApplication(@PathVariable Long id) {
        if (!applicationRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        applicationRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
