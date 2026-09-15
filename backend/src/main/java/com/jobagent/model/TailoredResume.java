package com.jobagent.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tailored_resumes")
public class TailoredResume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long jobId;

    private String jobTitle;
    private String company;

    @Column(columnDefinition = "LONGTEXT")
    private String tailoredSummary;

    @Column(columnDefinition = "LONGTEXT")
    private String highlightedSkills;

    @Column(columnDefinition = "LONGTEXT")
    private String tailoredExperience;

    @Column(columnDefinition = "LONGTEXT")
    private String resumeHtml;

    private String pdfFilePath;

    private Integer atsMatchScore = 0;

    private LocalDateTime createdAt;

    public TailoredResume() {
        this.createdAt = LocalDateTime.now();
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

    public String getTailoredSummary() { return tailoredSummary; }
    public void setTailoredSummary(String tailoredSummary) { this.tailoredSummary = tailoredSummary; }

    public String getHighlightedSkills() { return highlightedSkills; }
    public void setHighlightedSkills(String highlightedSkills) { this.highlightedSkills = highlightedSkills; }

    public String getTailoredExperience() { return tailoredExperience; }
    public void setTailoredExperience(String tailoredExperience) { this.tailoredExperience = tailoredExperience; }

    public String getResumeHtml() { return resumeHtml; }
    public void setResumeHtml(String resumeHtml) { this.resumeHtml = resumeHtml; }

    public String getPdfFilePath() { return pdfFilePath; }
    public void setPdfFilePath(String pdfFilePath) { this.pdfFilePath = pdfFilePath; }

    public Integer getAtsMatchScore() { return atsMatchScore; }
    public void setAtsMatchScore(Integer atsMatchScore) { this.atsMatchScore = atsMatchScore; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
