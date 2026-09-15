package com.jobagent.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_applications")
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long jobId;

    private String jobTitle;
    private String company;
    private String location;
    private String jobUrl;

    private LocalDateTime appliedAt;

    private String status = "APPLIED"; // APPLIED, REVIEWING, INTERVIEW, OFFER, REJECTED

    @Column(columnDefinition = "TEXT")
    private String notes;

    private Long tailoredResumeId;

    private String screenshotProofPath; // Path to saved browser submission screenshot

    private String appliedMethod = "AUTONOMOUS_PLAYWRIGHT"; // AUTONOMOUS_PLAYWRIGHT, MANUAL, EMAIL

    public JobApplication() {
        this.appliedAt = LocalDateTime.now();
    }

    public JobApplication(Long jobId, String jobTitle, String company, String location, String jobUrl, Long tailoredResumeId) {
        this.jobId = jobId;
        this.jobTitle = jobTitle;
        this.company = company;
        this.location = location;
        this.jobUrl = jobUrl;
        this.tailoredResumeId = tailoredResumeId;
        this.appliedAt = LocalDateTime.now();
        this.status = "APPLIED";
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getJobId() { return jobId; }
    public void setJobId(Long jobId) { this.jobId = jobId; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getJobUrl() { return jobUrl; }
    public void setJobUrl(String jobUrl) { this.jobUrl = jobUrl; }

    public LocalDateTime getAppliedAt() { return appliedAt; }
    public void setAppliedAt(LocalDateTime appliedAt) { this.appliedAt = appliedAt; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public Long getTailoredResumeId() { return tailoredResumeId; }
    public void setTailoredResumeId(Long tailoredResumeId) { this.tailoredResumeId = tailoredResumeId; }

    public String getScreenshotProofPath() { return screenshotProofPath; }
    public void setScreenshotProofPath(String screenshotProofPath) { this.screenshotProofPath = screenshotProofPath; }

    public String getAppliedMethod() { return appliedMethod; }
    public void setAppliedMethod(String appliedMethod) { this.appliedMethod = appliedMethod; }
}
