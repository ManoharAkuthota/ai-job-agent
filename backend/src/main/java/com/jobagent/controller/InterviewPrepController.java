package com.jobagent.controller;

import com.jobagent.model.InterviewPrep;
import com.jobagent.service.InterviewPrepService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interview-prep")
public class InterviewPrepController {

    private final InterviewPrepService interviewPrepService;

    public InterviewPrepController(InterviewPrepService interviewPrepService) {
        this.interviewPrepService = interviewPrepService;
    }

    @PostMapping("/generate/{jobId}")
    public ResponseEntity<?> generateInterviewPrep(@PathVariable Long jobId) {
        try {
            InterviewPrep prep = interviewPrepService.generateInterviewPrep(jobId);
            return ResponseEntity.ok(prep);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(java.util.Map.of(
                    "error", e.getMessage() != null ? e.getMessage() : "Error generating interview kit",
                    "type", e.getClass().getSimpleName()
            ));
        }
    }

    @GetMapping
    public ResponseEntity<?> getAllInterviewPreps() {
        try {
            return ResponseEntity.ok(interviewPrepService.getAllInterviewPreps());
        } catch (Throwable t) {
            t.printStackTrace();
            return ResponseEntity.status(500).body(java.util.Map.of(
                    "error", t.getMessage() != null ? t.getMessage() : t.toString(),
                    "type", t.getClass().getSimpleName()
            ));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getInterviewPrepById(@PathVariable Long id) {
        try {
            return interviewPrepService.getInterviewPrepById(id)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Throwable t) {
            t.printStackTrace();
            return ResponseEntity.status(500).body(java.util.Map.of(
                    "error", t.getMessage() != null ? t.getMessage() : t.toString()
            ));
        }
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<?> getLatestByJobId(@PathVariable Long jobId) {
        try {
            return interviewPrepService.getLatestByJobId(jobId)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (Throwable t) {
            t.printStackTrace();
            return ResponseEntity.status(500).body(java.util.Map.of(
                    "error", t.getMessage() != null ? t.getMessage() : t.toString()
            ));
        }
    }
}
