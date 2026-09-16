package com.jobagent.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "interview_preps")
public class InterviewPrep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long jobId;

    private String jobTitle;

    private String company;

    private String targetDomain;

    @Column(columnDefinition = "LONGTEXT")
    private String technicalQuestionsJson;

    @Column(columnDefinition = "LONGTEXT")
    private String behavioralQuestionsJson;

    @Column(columnDefinition = "LONGTEXT")
    private String systemDesignJson;

    private LocalDateTime createdAt = LocalDateTime.now();

    public InterviewPrep() {}

    public InterviewPrep(Long jobId, String jobTitle, String company, String targetDomain,
                         String technicalQuestionsJson, String behavioralQuestionsJson, String systemDesignJson) {
        this.jobId = jobId;
        this.jobTitle = jobTitle;
        this.company = company;
        this.targetDomain = targetDomain;
        this.technicalQuestionsJson = technicalQuestionsJson;
        this.behavioralQuestionsJson = behavioralQuestionsJson;
        this.systemDesignJson = systemDesignJson;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getJobId() { return jobId; }
    public void setJobId(Long jobId) { this.jobId = jobId; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getTargetDomain() { return targetDomain; }
    public void setTargetDomain(String targetDomain) { this.targetDomain = targetDomain; }

    public String getTechnicalQuestionsJson() { return technicalQuestionsJson; }
    public void setTechnicalQuestionsJson(String technicalQuestionsJson) { this.technicalQuestionsJson = technicalQuestionsJson; }

    public String getBehavioralQuestionsJson() { return behavioralQuestionsJson; }
    public void setBehavioralQuestionsJson(String behavioralQuestionsJson) { this.behavioralQuestionsJson = behavioralQuestionsJson; }

    public String getSystemDesignJson() { return systemDesignJson; }
    public void setSystemDesignJson(String systemDesignJson) { this.systemDesignJson = systemDesignJson; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
