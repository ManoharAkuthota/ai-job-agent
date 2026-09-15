package com.jobagent.controller;

import com.jobagent.model.Job;
import com.jobagent.model.TailoredResume;
import com.jobagent.model.UserProfile;
import com.jobagent.repository.JobRepository;
import com.jobagent.repository.TailoredResumeRepository;
import com.jobagent.repository.UserProfileRepository;
import com.jobagent.service.AiAgentService;
import com.jobagent.service.ResumeGeneratorService;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.File;
import java.nio.file.Files;
import java.util.List;

@RestController
@RequestMapping("/api/resumes")
public class ResumeController {

    private final TailoredResumeRepository tailoredResumeRepository;
    private final JobRepository jobRepository;
    private final UserProfileRepository profileRepository;
    private final AiAgentService aiAgentService;
    private final ResumeGeneratorService resumeGeneratorService;

    public ResumeController(TailoredResumeRepository tailoredResumeRepository,
                            JobRepository jobRepository,
                            UserProfileRepository profileRepository,
                            AiAgentService aiAgentService,
                            ResumeGeneratorService resumeGeneratorService) {
        this.tailoredResumeRepository = tailoredResumeRepository;
        this.jobRepository = jobRepository;
        this.profileRepository = profileRepository;
        this.aiAgentService = aiAgentService;
        this.resumeGeneratorService = resumeGeneratorService;
    }

    @GetMapping
    public List<TailoredResume> getAllResumes() {
        return tailoredResumeRepository.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/{id}")
    public ResponseEntity<TailoredResume> getResumeById(@PathVariable Long id) {
        return tailoredResumeRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<TailoredResume> getResumeByJobId(@PathVariable Long jobId) {
        return tailoredResumeRepository.findByJobId(jobId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/tailor/{jobId}")
    public ResponseEntity<?> tailorResumeForJob(@PathVariable Long jobId) {
        Job job = jobRepository.findById(jobId).orElse(null);
        if (job == null) {
            return ResponseEntity.badRequest().body("Job not found with ID: " + jobId);
        }

        UserProfile profile = profileRepository.findAll().stream().findFirst().orElse(null);
        if (profile == null) {
            return ResponseEntity.badRequest().body("Master Profile must be configured before tailoring resume.");
        }

        TailoredResume tailored = aiAgentService.tailorResume(profile, job);
        String html = resumeGeneratorService.buildHtmlResume(profile, tailored);
        tailored.setResumeHtml(html);
        String pdfPath = resumeGeneratorService.generatePdfResume(profile, tailored);
        tailored.setPdfFilePath(pdfPath);

        TailoredResume saved = tailoredResumeRepository.save(tailored);
        job.setStatus("TAILORED");
        jobRepository.save(job);

        return ResponseEntity.ok(saved);
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<Resource> downloadPdf(@PathVariable Long id) {
        TailoredResume resume = tailoredResumeRepository.findById(id).orElse(null);
        if (resume == null || resume.getPdfFilePath() == null) {
            return ResponseEntity.notFound().build();
        }

        try {
            File file = new File(resume.getPdfFilePath());
            if (!file.exists()) {
                return ResponseEntity.notFound().build();
            }
            byte[] fileBytes = Files.readAllBytes(file.toPath());
            ByteArrayResource resource = new ByteArrayResource(fileBytes);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .contentLength(file.length())
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
