package com.jobagent.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "agent_logs")
public class AgentLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime timestamp;
    private String level; // INFO, SUCCESS, WARN, ERROR
    private String action; // DISCOVERY, TAILORING, APPLICATION, SYSTEM

    @Column(columnDefinition = "TEXT")
    private String message;

    public AgentLog() {
        this.timestamp = LocalDateTime.now();
    }

    public AgentLog(String level, String action, String message) {
        this.timestamp = LocalDateTime.now();
        this.level = level;
        this.action = action;
        this.message = message;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
