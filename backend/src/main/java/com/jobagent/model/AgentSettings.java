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

    private String aiProvider = "AUTO"; // AUTO, OLLAMA, GEMINI, RULE_BASED
    private String ollamaEndpoint = "http://localhost:11434";
    private String ollamaModel = "llama3";
    private Boolean emailNotificationsEnabled = true;
    private String notificationEmail = "manoharsriakuthota@gmail.com";

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

    public String getAiProvider() { return aiProvider; }
    public void setAiProvider(String aiProvider) { this.aiProvider = aiProvider; }

    public String getOllamaEndpoint() { return ollamaEndpoint; }
    public void setOllamaEndpoint(String ollamaEndpoint) { this.ollamaEndpoint = ollamaEndpoint; }

    public String getOllamaModel() { return ollamaModel; }
    public void setOllamaModel(String ollamaModel) { this.ollamaModel = ollamaModel; }

    public Boolean getEmailNotificationsEnabled() { return emailNotificationsEnabled; }
    public void setEmailNotificationsEnabled(Boolean emailNotificationsEnabled) { this.emailNotificationsEnabled = emailNotificationsEnabled; }

    public String getNotificationEmail() { return notificationEmail; }
    public void setNotificationEmail(String notificationEmail) { this.notificationEmail = notificationEmail; }
}
