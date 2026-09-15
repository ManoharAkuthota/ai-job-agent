package com.jobagent.controller;

import com.jobagent.model.Job;
import com.jobagent.repository.JobRepository;
import com.jobagent.service.JobDiscoveryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
public class JobController {

    private final JobRepository jobRepository;
    private final JobDiscoveryService discoveryService;

    public JobController(JobRepository jobRepository, JobDiscoveryService discoveryService) {
        this.jobRepository = jobRepository;
        this.discoveryService = discoveryService;
    }

    @GetMapping
    public List<Job> getJobs(@RequestParam(required = false) String status,
                             @RequestParam(required = false) Integer minScore,
                             @RequestParam(defaultValue = "7") int days) {
        java.time.LocalDateTime cutoff = java.time.LocalDateTime.now().minusDays(Math.max(1, Math.min(days, 7)));

        if (status != null && !status.isBlank()) {
            return jobRepository.findByStatusAndDiscoveredAtAfterOrderByDiscoveredAtDesc(status, cutoff);
        }
        if (minScore != null) {
            return jobRepository.findByMatchScoreGreaterThanEqualAndDiscoveredAtAfterOrderByMatchScoreDesc(minScore, cutoff);
        }
        return jobRepository.findAllByDiscoveredAtAfterOrderByMatchScoreDesc(cutoff);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Job> getJob(@PathVariable Long id) {
        return jobRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/scan")
    public ResponseEntity<List<Job>> scanJobs(@RequestParam(defaultValue = "Java Full Stack") String domain,
                                              @RequestParam(defaultValue = "Java, Spring Boot, React, MySQL") String keywords) {
        List<Job> found = discoveryService.discoverJobs(domain, keywords);
        return ResponseEntity.ok(found);
    }

    @PostMapping("/cleanup")
    public ResponseEntity<String> cleanupStaleJobs() {
        discoveryService.purgeIrrelevantJobs();
        return ResponseEntity.ok("Purged outdated (>7 days) and irrelevant jobs.");
    }
}
