package com.jobagent.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobagent.model.Job;
import com.jobagent.model.TailoredResume;
import com.jobagent.model.UserProfile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AiAgentService {

    @Value("${agent.gemini.api-key:}")
    private String geminiApiKey;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    /**
     * Calculates ATS match score (0 to 100) between user profile skills/summary and job description.
     */
    public int calculateMatchScore(UserProfile profile, Job job) {
        if (profile == null || job == null || job.getDescription() == null) {
            return 50;
        }

        Set<String> profileKeywords = extractKeywords(
                (profile.getSkills() != null ? profile.getSkills() : "") + " " +
                (profile.getTargetDomain() != null ? profile.getTargetDomain() : "") + " " +
                (profile.getSummary() != null ? profile.getSummary() : "")
        );

        String jobText = (job.getTitle() + " " + job.getDescription()).toLowerCase();
        if (profileKeywords.isEmpty()) return 50;

        int matchedCount = 0;
        for (String kw : profileKeywords) {
            if (jobText.contains(kw.toLowerCase())) {
                matchedCount++;
            }
        }

        double ratio = (double) matchedCount / Math.min(profileKeywords.size(), 15);
        int score = (int) Math.round(ratio * 100);
        return Math.min(Math.max(score, 35), 98);
    }

    /**
     * Tailors resume for a specific job using Gemini Free API if key is present,
     * or uses smart keyword-optimization NLP fallback.
     */
    public TailoredResume tailorResume(UserProfile profile, Job job) {
        TailoredResume tailored = new TailoredResume();
        tailored.setJobId(job.getId());
        tailored.setJobTitle(job.getTitle());
        tailored.setCompany(job.getCompany());

        int matchScore = calculateMatchScore(profile, job);
        tailored.setAtsMatchScore(matchScore);

        String apiKey = (geminiApiKey != null && !geminiApiKey.isBlank()) ? geminiApiKey : null;

        if (apiKey != null) {
            try {
                return callGeminiForTailoring(profile, job, apiKey, tailored);
            } catch (Exception e) {
                System.err.println("Gemini API call failed, falling back to smart rule-based engine: " + e.getMessage());
            }
        }

        // Smart built-in tailoring fallback
        return generateRuleBasedTailoredResume(profile, job, tailored);
    }

    private TailoredResume callGeminiForTailoring(UserProfile profile, Job job, String apiKey, TailoredResume target) throws Exception {
        String prompt = "You are an expert ATS Resume Optimizer. Given the Candidate Profile and the Job Description below, generate a tailored resume response in pure JSON format with three fields: 'tailoredSummary' (a 3-sentence targeted career summary highlighting matching experience for this role), 'highlightedSkills' (comma-separated list prioritizing skills matching this job), and 'tailoredExperience' (bullet points aligning past work to the job requirements).\n\n"
                + "Job Title: " + job.getTitle() + "\n"
                + "Company: " + job.getCompany() + "\n"
                + "Job Description: " + job.getDescription() + "\n\n"
                + "Candidate Name: " + profile.getFullName() + "\n"
                + "Candidate Skills: " + profile.getSkills() + "\n"
                + "Candidate Summary: " + profile.getSummary() + "\n"
                + "Candidate Experience: " + profile.getExperience() + "\n\n"
                + "Output format: {\"tailoredSummary\": \"...\", \"highlightedSkills\": \"...\", \"tailoredExperience\": \"...\"}";

        Map<String, Object> bodyMap = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)
                        ))
                )
        );

        String requestJson = objectMapper.writeValueAsString(bodyMap);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + apiKey))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestJson))
                .timeout(Duration.ofSeconds(30))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200) {
            JsonNode root = objectMapper.readTree(response.body());
            String responseText = root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
            
            // Clean markdown code fence if present
            String cleanedJson = responseText.replaceAll("```json", "").replaceAll("```", "").trim();
            JsonNode parsedAi = objectMapper.readTree(cleanedJson);

            target.setTailoredSummary(parsedAi.path("tailoredSummary").asText(profile.getSummary()));
            target.setHighlightedSkills(parsedAi.path("highlightedSkills").asText(profile.getSkills()));
            target.setTailoredExperience(parsedAi.path("tailoredExperience").asText(profile.getExperience()));
            return target;
        }

        return generateRuleBasedTailoredResume(profile, job, target);
    }

    private TailoredResume generateRuleBasedTailoredResume(UserProfile profile, Job job, TailoredResume target) {
        // Strictly preserve authentic summary as written by Akuthota Manohar
        target.setTailoredSummary(profile.getSummary() != null ? profile.getSummary() : "");

        // Reorder and prioritize skills to emphasize keywords found in Job
        String jobText = (job.getTitle() + " " + (job.getDescription() != null ? job.getDescription() : "")).toLowerCase();
        List<String> candidateSkills = (profile.getSkills() != null)
                ? Arrays.stream(profile.getSkills().split("[,|;]")).map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toList())
                : List.of("Java", "Spring Boot", "Spring Security", "JWT", "Microservices", "Apache Kafka", "MySQL", "React", "Angular", "REST APIs", "GitHub", "Postman");

        List<String> matched = new ArrayList<>();
        List<String> others = new ArrayList<>();
        for (String skill : candidateSkills) {
            if (jobText.contains(skill.toLowerCase())) {
                matched.add(skill);
            } else {
                others.add(skill);
            }
        }

        List<String> prioritized = new ArrayList<>(matched);
        prioritized.addAll(others);
        target.setHighlightedSkills(String.join(", ", prioritized));

        // Strictly preserve authentic work experience & projects without hallucination
        target.setTailoredExperience(profile.getExperience() != null ? profile.getExperience() : "");
        return target;
    }

    private Set<String> extractKeywords(String text) {
        if (text == null) return Collections.emptySet();
        return Arrays.stream(text.split("[,|;\\s]+"))
                .map(String::trim)
                .map(s -> s.replaceAll("[^a-zA-Z0-9+#]", ""))
                .filter(s -> s.length() > 2)
                .collect(Collectors.toSet());
    }

    public void setGeminiApiKey(String geminiApiKey) {
        this.geminiApiKey = geminiApiKey;
    }
}
