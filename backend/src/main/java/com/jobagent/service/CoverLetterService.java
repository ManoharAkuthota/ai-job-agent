package com.jobagent.service;

import com.jobagent.model.CoverLetter;
import com.jobagent.model.Job;
import com.jobagent.model.UserProfile;
import com.jobagent.repository.CoverLetterRepository;
import com.jobagent.repository.JobRepository;
import com.jobagent.repository.UserProfileRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class CoverLetterService {

    private final CoverLetterRepository coverLetterRepository;
    private final JobRepository jobRepository;
    private final UserProfileRepository profileRepository;

    @Value("${agent.storage.cover-letter-dir:generated_cover_letters}")
    private String coverLetterDir;

    public CoverLetterService(CoverLetterRepository coverLetterRepository,
                              JobRepository jobRepository,
                              UserProfileRepository profileRepository) {
        this.coverLetterRepository = coverLetterRepository;
        this.jobRepository = jobRepository;
        this.profileRepository = profileRepository;
    }

    public CoverLetter generateCoverLetter(Long jobId) throws Exception {
        Job job = null;
        if (jobId != null) {
            job = jobRepository.findById(jobId).orElse(null);
        }
        if (job == null) {
            job = jobRepository.findAll().stream().findFirst().orElse(null);
        }
        if (job == null) {
            job = new Job();
            job.setId(jobId != null ? jobId : 1L);
            job.setTitle("Java Full Stack Developer");
            job.setCompany("Target Tech Company");
            job.setDescription("Backend and full-stack software development with Java, Spring Boot, MySQL, and React.");
        }

        UserProfile profile = profileRepository.findAll().stream().findFirst().orElse(new UserProfile());
        String candidateName = (profile.getFullName() != null && !profile.getFullName().isBlank())
                ? profile.getFullName() : "Akuthota Manohar";
        String candidateEmail = (profile.getEmail() != null && !profile.getEmail().isBlank())
                ? profile.getEmail() : "manoharsriakuthota@gmail.com";
        String candidatePhone = (profile.getPhone() != null && !profile.getPhone().isBlank())
                ? profile.getPhone() : "8096870549";
        String candidateLocation = (profile.getLocation() != null && !profile.getLocation().isBlank())
                ? profile.getLocation() : "Ahmedabad, India";

        String company = (job.getCompany() != null && !job.getCompany().isBlank()) ? job.getCompany() : "Hiring Team";
        String role = (job.getTitle() != null && !job.getTitle().isBlank()) ? job.getTitle() : "Software Engineer";

        // Paragraph 1: Purpose & Introduction
        String opening = "Dear Hiring Manager at " + company + ",\n\n"
                + "I am writing to express my strong interest in the " + role + " position currently open at " + company + ". "
                + "As a Computer Science graduate and Java Developer with production experience building resilient backend microservices using Spring Boot, Spring Security, JWT, and Apache Kafka, "
                + "I am excited by " + company + "'s innovative engineering standards and believe my cross-stack foundation makes me an impactful addition to your team.";

        // Paragraph 2: Technical Alignment & Deliverables
        String body = "In my recent role at Keyanna Technologies, I engineered RESTful CPaaS (Communications Platform as a Service) backend microservices capable of processing high-volume event streaming with low latency. "
                + "I implemented robust authentication workflows using Spring Security and JWT token management, designed and optimized relational MySQL database schemas, and integrated Apache Kafka for event-driven message distribution. "
                + "Additionally, my hands-on experience with modern frontend frameworks including React and Angular enables me to collaborate effectively across the entire software development lifecycle, from system architecture to responsive UI delivery.";

        // Paragraph 3: Cultural Alignment & Call to Action
        String closing = company + "'s reputation for technical excellence and engineering rigor aligns seamlessly with my continuous learning mindset and passion for scalable distributed systems. "
                + "I welcome the opportunity to discuss how my technical expertise in Java, Spring Boot, microservices architecture, and full-stack development will contribute to your engineering objectives. "
                + "Thank you for your time and consideration.";

        String fullText = opening + "\n\n" + body + "\n\n" + closing + "\n\nSincerely,\n" + candidateName + "\n" + candidateEmail + " | " + candidatePhone + "\n" + candidateLocation;

        CoverLetter cl = new CoverLetter(
                job.getId(),
                role,
                company,
                candidateName,
                candidateEmail,
                candidatePhone,
                opening,
                body,
                closing,
                fullText
        );

        // Generate OpenPDF document
        String pdfPath = generateCoverLetterPdf(cl, candidateLocation);
        cl.setPdfFilePath(pdfPath);

        return coverLetterRepository.save(cl);
    }

    private String generateCoverLetterPdf(CoverLetter cl, String location) throws Exception {
        Path dir = Paths.get(coverLetterDir);
        if (!Files.exists(dir)) {
            Files.createDirectories(dir);
        }

        String filename = "CoverLetter_" + cl.getCompany().replaceAll("[^a-zA-Z0-9]", "_") + "_" + System.currentTimeMillis() + ".pdf";
        File file = dir.resolve(filename).toFile();

        Document document = new Document(PageSize.A4, 45, 45, 45, 45);
        PdfWriter.getInstance(document, new FileOutputStream(file));
        document.open();

        Font nameFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
        Font contactFont = FontFactory.getFont(FontFactory.HELVETICA, 10, java.awt.Color.GRAY);
        Font dateFont = FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 10, java.awt.Color.DARK_GRAY);
        Font headingFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
        Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 10.5f, java.awt.Color.BLACK);

        // Header
        Paragraph namePara = new Paragraph(cl.getCandidateName(), nameFont);
        namePara.setAlignment(Element.ALIGN_LEFT);
        document.add(namePara);

        Paragraph contactPara = new Paragraph(cl.getCandidateEmail() + "  |  " + cl.getCandidatePhone() + "  |  " + location, contactFont);
        contactPara.setSpacingAfter(18);
        document.add(contactPara);

        // Date
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("MMMM d, yyyy"));
        Paragraph datePara = new Paragraph(dateStr, dateFont);
        datePara.setSpacingAfter(14);
        document.add(datePara);

        // Recipient
        Paragraph recipientPara = new Paragraph("To: Hiring Team\n" + cl.getCompany() + "\nRe: Application for " + cl.getJobTitle(), headingFont);
        recipientPara.setSpacingAfter(16);
        document.add(recipientPara);

        // Paragraph 1
        Paragraph p1 = new Paragraph(cl.getOpeningParagraph(), bodyFont);
        p1.setSpacingAfter(12);
        p1.setLeading(15);
        document.add(p1);

        // Paragraph 2
        Paragraph p2 = new Paragraph(cl.getBodyParagraph(), bodyFont);
        p2.setSpacingAfter(12);
        p2.setLeading(15);
        document.add(p2);

        // Paragraph 3
        Paragraph p3 = new Paragraph(cl.getClosingParagraph(), bodyFont);
        p3.setSpacingAfter(18);
        p3.setLeading(15);
        document.add(p3);

        // Sign-off
        Paragraph signOff = new Paragraph("Sincerely,\n\n" + cl.getCandidateName(), headingFont);
        signOff.setLeading(16);
        document.add(signOff);

        document.close();
        return file.getAbsolutePath();
    }

    public List<CoverLetter> getAllCoverLetters() {
        return coverLetterRepository.findAllByOrderByCreatedAtDesc();
    }

    public CoverLetter getCoverLetterById(Long id) {
        return coverLetterRepository.findById(id).orElse(null);
    }
}
