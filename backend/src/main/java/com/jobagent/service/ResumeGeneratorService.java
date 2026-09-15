package com.jobagent.service;

import com.jobagent.model.TailoredResume;
import com.jobagent.model.UserProfile;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.pdf.draw.LineSeparator;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.FileOutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class ResumeGeneratorService {

    @Value("${agent.storage.resume-dir:resumes_generated}")
    private String resumeDir;

    /**
     * Builds an ATS-friendly HTML representation of the tailored resume.
     */
    public String buildHtmlResume(UserProfile profile, TailoredResume tailored) {
        String name = (profile != null && profile.getFullName() != null) ? profile.getFullName() : "AKUTHOTA MANOHAR";
        String email = (profile != null && profile.getEmail() != null) ? profile.getEmail() : "manoharsriakuthota@gmail.com";
        String phone = (profile != null && profile.getPhone() != null) ? profile.getPhone() : "8096870549";
        String location = (profile != null && profile.getLocation() != null) ? profile.getLocation() : "Ahmedabad, India";
        String summary = (profile != null && profile.getSummary() != null) ? profile.getSummary() : tailored.getTailoredSummary();
        String skills = tailored.getHighlightedSkills();
        String experience = (profile != null && profile.getExperience() != null) ? profile.getExperience() : tailored.getTailoredExperience();
        String projects = (profile != null && profile.getProjects() != null) ? profile.getProjects() : "";
        String education = (profile != null && profile.getEducation() != null) ? profile.getEducation() : "";

        return "<!DOCTYPE html>\n" +
                "<html>\n" +
                "<head>\n" +
                "<meta charset='utf-8'/>\n" +
                "<style>\n" +
                "  body { font-family: Arial, Helvetica, sans-serif; line-height: 1.5; color: #111; margin: 35px; }\n" +
                "  .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 16px; }\n" +
                "  .name { font-size: 24px; font-weight: bold; color: #1e3a8a; letter-spacing: 0.5px; }\n" +
                "  .contact { font-size: 13px; color: #475569; margin-top: 4px; }\n" +
                "  .section-title { font-size: 14px; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #94a3b8; margin-top: 16px; margin-bottom: 6px; color: #0f172a; padding-bottom: 2px; }\n" +
                "  .content { font-size: 13px; margin-bottom: 10px; white-space: pre-line; line-height: 1.5; }\n" +
                "  .badge { background: #e0e7ff; color: #3730a3; padding: 2px 6px; border-radius: 4px; font-size: 11px; display: inline-block; margin-right: 4px; margin-bottom: 4px; }\n" +
                "</style>\n" +
                "</head>\n" +
                "<body>\n" +
                "  <div class='header'>\n" +
                "    <div class='name'>" + escape(name) + "</div>\n" +
                "    <div class='contact'>" + escape(location) + " | " + escape(phone) + " | " + escape(email) + " | LinkedIn</div>\n" +
                "  </div>\n" +
                "  <div class='section-title'>Professional Summary</div>\n" +
                "  <div class='content'>" + escape(summary) + "</div>\n" +
                "  <div class='section-title'>Technical Skills (Daily ATS Optimized)</div>\n" +
                "  <div class='content'>" + escape(skills) + "</div>\n" +
                "  <div class='section-title'>Work Experience</div>\n" +
                "  <div class='content'>" + escape(experience) + "</div>\n" +
                (!projects.isBlank() ? "  <div class='section-title'>Academic Projects</div>\n  <div class='content'>" + escape(projects) + "</div>\n" : "") +
                (!education.isBlank() ? "  <div class='section-title'>Education</div>\n  <div class='content'>" + escape(education) + "</div>\n" : "") +
                "</body>\n" +
                "</html>";
    }

    /**
     * Generates a clean, ATS-scannable single-column PDF file.
     */
    public String generatePdfResume(UserProfile profile, TailoredResume tailored) {
        try {
            Path dirPath = Paths.get(resumeDir);
            if (!Files.exists(dirPath)) {
                Files.createDirectories(dirPath);
            }

            String filename = "Resume_Akuthota_Manohar_" + sanitize(tailored.getCompany()) + "_" + System.currentTimeMillis() + ".pdf";
            File pdfFile = dirPath.resolve(filename).toFile();

            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, new FileOutputStream(pdfFile));
            document.open();

            // Font styles
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20, Font.BOLD, new java.awt.Color(30, 58, 138));
            Font subTitleFont = FontFactory.getFont(FontFactory.HELVETICA, 10, Font.NORMAL, java.awt.Color.DARK_GRAY);
            Font headingFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Font.BOLD, java.awt.Color.BLACK);
            Font bodyFont = FontFactory.getFont(FontFactory.HELVETICA, 9.5f, Font.NORMAL, java.awt.Color.BLACK);

            String name = (profile != null && profile.getFullName() != null) ? profile.getFullName() : "AKUTHOTA MANOHAR";
            String email = (profile != null && profile.getEmail() != null) ? profile.getEmail() : "manoharsriakuthota@gmail.com";
            String phone = (profile != null && profile.getPhone() != null) ? profile.getPhone() : "8096870549";
            String location = (profile != null && profile.getLocation() != null) ? profile.getLocation() : "Ahmedabad, India";

            // Header: Name & Contact
            Paragraph pName = new Paragraph(name, titleFont);
            pName.setAlignment(Element.ALIGN_CENTER);
            document.add(pName);

            Paragraph pContact = new Paragraph(location + " | " + phone + " | " + email + " | LinkedIn", subTitleFont);
            pContact.setAlignment(Element.ALIGN_CENTER);
            pContact.setSpacingAfter(8);
            document.add(pContact);

            LineSeparator line = new LineSeparator();
            line.setLineWidth(1.2f);
            line.setPercentage(100);
            line.setLineColor(new java.awt.Color(30, 58, 138));
            document.add(line);

            // 1. Summary
            String summary = (profile != null && profile.getSummary() != null) ? profile.getSummary() : tailored.getTailoredSummary();
            addSection(document, "PROFESSIONAL SUMMARY", summary, headingFont, bodyFont);

            // 2. Technical Skills (Dynamically optimized daily)
            addSection(document, "TECHNICAL SKILLS", tailored.getHighlightedSkills(), headingFont, bodyFont);

            // 3. Work Experience (Strictly authentic)
            String experience = (profile != null && profile.getExperience() != null) ? profile.getExperience() : tailored.getTailoredExperience();
            addSection(document, "WORK EXPERIENCE", experience, headingFont, bodyFont);

            // 4. Academic Projects (Strictly authentic)
            if (profile != null && profile.getProjects() != null && !profile.getProjects().isBlank()) {
                addSection(document, "ACADEMIC PROJECTS", profile.getProjects(), headingFont, bodyFont);
            }

            // 5. Education (Strictly authentic)
            if (profile != null && profile.getEducation() != null && !profile.getEducation().isBlank()) {
                addSection(document, "EDUCATION", profile.getEducation(), headingFont, bodyFont);
            }

            document.close();
            return pdfFile.getAbsolutePath();
        } catch (Exception e) {
            System.err.println("Error generating PDF: " + e.getMessage());
            return null;
        }
    }

    private void addSection(Document document, String title, String content, Font headingFont, Font bodyFont) throws DocumentException {
        if (content == null || content.isBlank()) return;

        Paragraph pTitle = new Paragraph(title, headingFont);
        pTitle.setSpacingBefore(10);
        pTitle.setSpacingAfter(2);
        document.add(pTitle);

        LineSeparator subLine = new LineSeparator();
        subLine.setLineWidth(0.5f);
        subLine.setLineColor(java.awt.Color.LIGHT_GRAY);
        document.add(subLine);

        Paragraph pBody = new Paragraph(content, bodyFont);
        pBody.setSpacingBefore(3);
        pBody.setSpacingAfter(6);
        document.add(pBody);
    }

    private String sanitize(String input) {
        if (input == null) return "Unknown";
        return input.replaceAll("[^a-zA-Z0-9_-]", "_");
    }

    private String escape(String input) {
        if (input == null) return "";
        return input.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
