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
    private final com.jobagent.service.BrowserAutoApplyService browserAutoApplyService;
    private final com.jobagent.service.AiAgentService aiAgentService;
    private final com.jobagent.service.ResumeGeneratorService resumeGeneratorService;
    private final com.jobagent.repository.UserProfileRepository userProfileRepository;

    public ApplicationController(JobApplicationRepository applicationRepository,
                                 JobRepository jobRepository,
                                 TailoredResumeRepository tailoredResumeRepository,
                                 com.jobagent.service.BrowserAutoApplyService browserAutoApplyService,
                                 com.jobagent.service.AiAgentService aiAgentService,
                                 com.jobagent.service.ResumeGeneratorService resumeGeneratorService,
                                 com.jobagent.repository.UserProfileRepository userProfileRepository) {
        this.applicationRepository = applicationRepository;
        this.jobRepository = jobRepository;
        this.tailoredResumeRepository = tailoredResumeRepository;
        this.browserAutoApplyService = browserAutoApplyService;
        this.aiAgentService = aiAgentService;
        this.resumeGeneratorService = resumeGeneratorService;
        this.userProfileRepository = userProfileRepository;
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

        com.jobagent.model.UserProfile profile = userProfileRepository.findAll().stream().findFirst().orElseGet(() -> {
            com.jobagent.model.UserProfile p = new com.jobagent.model.UserProfile();
            p.setFullName("AKUTHOTA MANOHAR");
            p.setEmail("manoharsriakuthota@gmail.com");
            return p;
        });

        TailoredResume resume = tailoredResumeRepository.findByJobId(jobId).orElse(null);
        if (resume == null) {
            resume = aiAgentService.tailorResume(profile, job);
            String html = resumeGeneratorService.buildHtmlResume(profile, resume);
            resume.setResumeHtml(html);
            String pdfPath = resumeGeneratorService.generatePdfResume(profile, resume);
            resume.setPdfFilePath(pdfPath);
            resume = tailoredResumeRepository.save(resume);
            job.setStatus("TAILORED");
            jobRepository.save(job);
        }

        // Autonomous Playwright Browser submission & proof capture
        com.jobagent.service.BrowserAutoApplyService.AutoApplyResult applyResult =
                browserAutoApplyService.executeAutonomousApply(job, profile, resume);

        TailoredResume finalResume = resume;
        JobApplication application = applicationRepository.findByJobId(jobId).orElseGet(() ->
                new JobApplication(job.getId(), job.getTitle(), job.getCompany(), job.getLocation(), job.getUrl(), finalResume.getId())
        );

        application.setTailoredResumeId(resume.getId());
        application.setStatus("APPLIED");
        application.setAppliedMethod("AUTONOMOUS_PLAYWRIGHT");
        application.setScreenshotProofPath(applyResult.proofScreenshotPath());
        if (body != null && body.containsKey("notes") && !body.get("notes").isBlank()) {
            application.setNotes(body.get("notes") + " | " + applyResult.message());
        } else {
            application.setNotes(applyResult.message());
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
