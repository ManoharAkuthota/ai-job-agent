package com.jobagent.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "cover_letters")
public class CoverLetter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long jobId;

    private String jobTitle;

    private String company;

    private String candidateName;

    private String candidateEmail;

    private String candidatePhone;

    @Column(columnDefinition = "TEXT")
    private String openingParagraph;

    @Column(columnDefinition = "TEXT")
    private String bodyParagraph;

    @Column(columnDefinition = "TEXT")
    private String closingParagraph;

    @Column(columnDefinition = "TEXT")
    private String fullText;

    private String pdfFilePath;

    private LocalDateTime createdAt = LocalDateTime.now();

    public CoverLetter() {}

    public CoverLetter(Long jobId, String jobTitle, String company, String candidateName,
                       String candidateEmail, String candidatePhone, String openingParagraph,
                       String bodyParagraph, String closingParagraph, String fullText) {
        this.jobId = jobId;
        this.jobTitle = jobTitle;
        this.company = company;
        this.candidateName = candidateName;
        this.candidateEmail = candidateEmail;
        this.candidatePhone = candidatePhone;
        this.openingParagraph = openingParagraph;
        this.bodyParagraph = bodyParagraph;
        this.closingParagraph = closingParagraph;
        this.fullText = fullText;
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

    public String getCandidateName() { return candidateName; }
    public void setCandidateName(String candidateName) { this.candidateName = candidateName; }

    public String getCandidateEmail() { return candidateEmail; }
    public void setCandidateEmail(String candidateEmail) { this.candidateEmail = candidateEmail; }

    public String getCandidatePhone() { return candidatePhone; }
    public void setCandidatePhone(String candidatePhone) { this.candidatePhone = candidatePhone; }

    public String getOpeningParagraph() { return openingParagraph; }
    public void setOpeningParagraph(String openingParagraph) { this.openingParagraph = openingParagraph; }

    public String getBodyParagraph() { return bodyParagraph; }
    public void setBodyParagraph(String bodyParagraph) { this.bodyParagraph = bodyParagraph; }

    public String getClosingParagraph() { return closingParagraph; }
    public void setClosingParagraph(String closingParagraph) { this.closingParagraph = closingParagraph; }

    public String getFullText() { return fullText; }
    public void setFullText(String fullText) { this.fullText = fullText; }

    public String getPdfFilePath() { return pdfFilePath; }
    public void setPdfFilePath(String pdfFilePath) { this.pdfFilePath = pdfFilePath; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
