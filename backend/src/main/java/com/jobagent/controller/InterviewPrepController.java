package com.jobagent.controller;

import com.jobagent.model.InterviewPrep;
import com.jobagent.service.InterviewPrepService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/interview-prep")
@CrossOrigin(origins = "*")
public class InterviewPrepController {

    private final InterviewPrepService interviewPrepService;

    public InterviewPrepController(InterviewPrepService interviewPrepService) {
        this.interviewPrepService = interviewPrepService;
    }

    @PostMapping("/generate/{jobId}")
    public ResponseEntity<InterviewPrep> generateInterviewPrep(@PathVariable Long jobId) {
        try {
            InterviewPrep prep = interviewPrepService.generateInterviewPrep(jobId);
            return ResponseEntity.ok(prep);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<InterviewPrep>> getAllInterviewPreps() {
        return ResponseEntity.ok(interviewPrepService.getAllInterviewPreps());
    }

    @GetMapping("/{id}")
    public ResponseEntity<InterviewPrep> getInterviewPrepById(@PathVariable Long id) {
        return interviewPrepService.getInterviewPrepById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/job/{jobId}")
    public ResponseEntity<InterviewPrep> getLatestByJobId(@PathVariable Long jobId) {
        return interviewPrepService.getLatestByJobId(jobId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
