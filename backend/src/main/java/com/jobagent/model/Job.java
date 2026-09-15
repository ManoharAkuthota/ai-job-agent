package com.jobagent.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "jobs")
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String company;

    private String location;

    private String jobType; // e.g. "Remote", "Full-time", "Hybrid"

    private String salary;

    @Column(columnDefinition = "LONGTEXT")
    private String description;

    @Column(length = 2048)
    private String url;

    private String source; // e.g. "Arbeitnow", "Remotive", "Manual"

    private String postedDate;

    private LocalDateTime discoveredAt;

    private Integer matchScore = 0; // 0 to 100 ATS match score

    private String status = "DISCOVERED"; // DISCOVERED, TAILORED, APPLIED, ARCHIVED

    public Job() {
        this.discoveredAt = LocalDateTime.now();
    }

    public Job(String title, String company, String location, String jobType, String salary,
               String description, String url, String source) {
        this(title, company, location, jobType, salary, description, url, source, "Today", LocalDateTime.now());
    }

    public Job(String title, String company, String location, String jobType, String salary,
               String description, String url, String source, String postedDate, LocalDateTime discoveredAt) {
        this.title = title;
        this.company = company;
        this.location = location;
        this.jobType = jobType;
        this.salary = salary;
        this.description = description;
        this.url = url;
        this.source = source;
        this.postedDate = postedDate != null ? postedDate : "Today";
        this.discoveredAt = discoveredAt != null ? discoveredAt : LocalDateTime.now();
        this.status = "DISCOVERED";
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getJobType() { return jobType; }
    public void setJobType(String jobType) { this.jobType = jobType; }

    public String getSalary() { return salary; }
    public void setSalary(String salary) { this.salary = salary; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getPostedDate() { return postedDate; }
    public void setPostedDate(String postedDate) { this.postedDate = postedDate; }

    public LocalDateTime getDiscoveredAt() { return discoveredAt; }
    public void setDiscoveredAt(LocalDateTime discoveredAt) { this.discoveredAt = discoveredAt; }

    public Integer getMatchScore() { return matchScore; }
    public void setMatchScore(Integer matchScore) { this.matchScore = matchScore; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
