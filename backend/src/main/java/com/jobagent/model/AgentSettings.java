package com.jobagent.model;

import jakarta.persistence.*;

@Entity
@Table(name = "agent_settings")
public class AgentSettings {

    @Id
    private Long id = 1L; // Single configuration row

    private String targetDomain = "Java Full Stack";
    private String targetKeywords = "Java, Spring Boot, React, MySQL, REST API";
    private String preferredLocation = "Remote, India, Hybrid";
    private Integer minMatchScore = 60;
    private Boolean autoApplyEnabled = false;
    private String geminiApiKey = "";
    private String cronExpression = "0 0 9 * * ?"; // Daily 9:00 AM

    public AgentSettings() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTargetDomain() { return targetDomain; }
    public void setTargetDomain(String targetDomain) { this.targetDomain = targetDomain; }

    public String getTargetKeywords() { return targetKeywords; }
    public void setTargetKeywords(String targetKeywords) { this.targetKeywords = targetKeywords; }

    public String getPreferredLocation() { return preferredLocation; }
    public void setPreferredLocation(String preferredLocation) { this.preferredLocation = preferredLocation; }

    public Integer getMinMatchScore() { return minMatchScore; }
    public void setMinMatchScore(Integer minMatchScore) { this.minMatchScore = minMatchScore; }

    public Boolean getAutoApplyEnabled() { return autoApplyEnabled; }
    public void setAutoApplyEnabled(Boolean autoApplyEnabled) { this.autoApplyEnabled = autoApplyEnabled; }

    public String getGeminiApiKey() { return geminiApiKey; }
    public void setGeminiApiKey(String geminiApiKey) { this.geminiApiKey = geminiApiKey; }

    public String getCronExpression() { return cronExpression; }
    public void setCronExpression(String cronExpression) { this.cronExpression = cronExpression; }
}
