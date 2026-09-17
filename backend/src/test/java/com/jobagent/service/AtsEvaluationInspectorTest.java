package com.jobagent.service;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.Test;

import java.io.File;

public class AtsEvaluationInspectorTest {

    @Test
    void inspectUserResume() throws Exception {
        File pdfFile = new File("C:/Users/Akuthota/.gemini/antigravity/brain/3772a694-10f1-4ae3-921e-dff1694ccd79/.user_uploaded/media_1789451784443.pdf");
        if (!pdfFile.exists()) {
            System.out.println("PDF file not found at " + pdfFile.getAbsolutePath());
            return;
        }

        try (PDDocument doc = Loader.loadPDF(pdfFile)) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(doc);

            ResumeParserService service = new ResumeParserService(null, null);
            java.lang.reflect.Method method = ResumeParserService.class.getDeclaredMethod("evaluateAts", String.class, java.util.List.class, String.class, String.class, String.class, String.class, String.class);
            method.setAccessible(true);

            java.lang.reflect.Method skillsMethod = ResumeParserService.class.getDeclaredMethod("extractSkills", String.class);
            skillsMethod.setAccessible(true);
            @SuppressWarnings("unchecked")
            java.util.List<String> skills = (java.util.List<String>) skillsMethod.invoke(service, text);

            ResumeParserService.AtsScoreBreakdown result = (ResumeParserService.AtsScoreBreakdown) method.invoke(service, text, skills, "Frontend Developer", "manoharsriakuthota@gmail.com", "8096870549", null, null);

            System.out.println("=================================================");
            System.out.println("ACCURATE ATS EVALUATION FOR AKUTHOTA MANOHAR");
            System.out.println("=================================================");
            System.out.println("Total ATS Score: " + result.overallScore() + " / 100");
            System.out.println("Pillar 1 (Contact & Links): " + result.contactScore() + " / 10");
            System.out.println("Pillar 2 (Technical Keywords): " + result.skillsScore() + " / 30");
            System.out.println("Pillar 3 (Quantifiable Impact): " + result.impactScore() + " / 25");
            System.out.println("Pillar 4 (ATS Structure): " + result.structureScore() + " / 20");
            System.out.println("Pillar 5 (Action Verbs & Tone): " + result.actionVerbsScore() + " / 15");
            System.out.println("-------------------------------------------------");
            System.out.println("Strengths: " + result.strengths());
            System.out.println("Missing High Demand: " + result.missingKeywords());
            System.out.println("Improvements / Deductions: " + result.improvements().size());
            for (ResumeParserService.AtsFeedbackItem item : result.improvements()) {
                System.out.println("  - [" + item.severity() + "] " + item.issue() + ": " + item.suggestion());
            }
            System.out.println("=================================================");
        }
    }
}
