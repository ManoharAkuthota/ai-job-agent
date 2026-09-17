package com.jobagent.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobagent.model.AgentSettings;
import com.jobagent.model.Job;
import com.jobagent.model.TailoredResume;
import com.jobagent.model.UserProfile;
import com.jobagent.repository.AgentSettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
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

    @Autowired(required = false)
    private AgentSettingsRepository settingsRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
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

        String domainLower = (profile.getTargetDomain() != null ? profile.getTargetDomain() : "").toLowerCase();
        String titleLower = (job.getTitle() != null ? job.getTitle() : "").toLowerCase();
        boolean isFrontendCandidate = domainLower.contains("front") || domainLower.contains("react") || domainLower.contains("ui");
        boolean isFrontendJob = titleLower.contains("front") || titleLower.contains("react") || titleLower.contains("ui") || titleLower.contains("web");
        boolean isBackendJob = (titleLower.contains("backend") || titleLower.contains("microservice") || titleLower.contains("core banking") || titleLower.contains("java")) && !isFrontendJob;

        if (isFrontendCandidate) {
            if (isFrontendJob) {
                score += 25;
            } else if (isBackendJob) {
                score = Math.max(30, score - 30);
            }
        }

        return Math.min(Math.max(score, 35), 98);
    }

    /**
     * Tailors resume for a specific job using Ollama (Llama 3), Gemini Free API,
     * or smart keyword-optimization NLP fallback.
     */
    public TailoredResume tailorResume(UserProfile profile, Job job) {
        TailoredResume tailored = new TailoredResume();
        tailored.setJobId(job.getId());
        tailored.setJobTitle(job.getTitle());
        tailored.setCompany(job.getCompany());

        int matchScore = calculateMatchScore(profile, job);
        tailored.setAtsMatchScore(matchScore);

        AgentSettings settings = getSettings();
        String provider = (settings != null && settings.getAiProvider() != null)
                ? settings.getAiProvider().toUpperCase() : "AUTO";

        String prompt = "You are an expert ATS Resume Optimizer. Given the Candidate Profile and the Job Description below, generate a tailored resume response in pure JSON format with three fields: 'tailoredSummary' (a 3-sentence targeted career summary highlighting matching experience for this role), 'highlightedSkills' (comma-separated list prioritizing skills matching this job), and 'tailoredExperience' (bullet points aligning past work to the job requirements).\n\n"
                + "Job Title: " + job.getTitle() + "\n"
                + "Company: " + job.getCompany() + "\n"
                + "Job Description: " + job.getDescription() + "\n\n"
                + "Candidate Name: " + profile.getFullName() + "\n"
                + "Candidate Skills: " + profile.getSkills() + "\n"
                + "Candidate Summary: " + profile.getSummary() + "\n"
                + "Candidate Experience: " + profile.getExperience() + "\n\n"
                + "Output format: {\"tailoredSummary\": \"...\", \"highlightedSkills\": \"...\", \"tailoredExperience\": \"...\"}";

        if (!"RULE_BASED".equals(provider)) {
            String aiResult = generateTextWithFallback(prompt, settings);
            if (aiResult != null && !aiResult.isBlank()) {
                try {
                    String cleanedJson = aiResult.replaceAll("```json", "").replaceAll("```", "").trim();
                    JsonNode parsedAi = objectMapper.readTree(cleanedJson);
                    if (parsedAi.has("tailoredSummary")) {
                        tailored.setTailoredSummary(parsedAi.path("tailoredSummary").asText(profile.getSummary()));
                        tailored.setHighlightedSkills(parsedAi.path("highlightedSkills").asText(profile.getSkills()));
                        tailored.setTailoredExperience(parsedAi.path("tailoredExperience").asText(profile.getExperience()));
                        return tailored;
                    }
                } catch (Exception e) {
                    System.err.println("Failed to parse AI resume JSON: " + e.getMessage());
                }
            }
        }

        // Smart built-in tailoring fallback
        return generateRuleBasedTailoredResume(profile, job, tailored);
    }

    /**
     * Dispatches prompt to Ollama, Gemini, or returns null for rule-based engine.
     */
    public String generateTextWithFallback(String prompt, AgentSettings settings) {
        if (settings == null) settings = getSettings();
        String provider = (settings.getAiProvider() != null) ? settings.getAiProvider().toUpperCase() : "AUTO";
        String endpoint = (settings.getOllamaEndpoint() != null && !settings.getOllamaEndpoint().isBlank())
                ? settings.getOllamaEndpoint() : "http://localhost:11434";
        String model = (settings.getOllamaModel() != null && !settings.getOllamaModel().isBlank())
                ? settings.getOllamaModel() : "llama3";
        String geminiKey = (settings.getGeminiApiKey() != null && !settings.getGeminiApiKey().isBlank())
                ? settings.getGeminiApiKey() : this.geminiApiKey;

        if ("OLLAMA".equals(provider)) {
            try {
                return callOllama(prompt, endpoint, model);
            } catch (Exception e) {
                System.err.println("Ollama failed (" + e.getMessage() + "), falling back to Gemini if available...");
                if (geminiKey != null && !geminiKey.isBlank()) {
                    try { return callGemini(prompt, geminiKey); } catch (Exception ignored) {}
                }
            }
            return null;
        }

        if ("GEMINI".equals(provider)) {
            if (geminiKey != null && !geminiKey.isBlank()) {
                try {
                    return callGemini(prompt, geminiKey);
                } catch (Exception e) {
                    System.err.println("Gemini failed (" + e.getMessage() + ")");
                }
            }
            return null;
        }

        if ("AUTO".equals(provider)) {
            // Check if Ollama is alive first
            try {
                if (isOllamaAlive(endpoint)) {
                    return callOllama(prompt, endpoint, model);
                }
            } catch (Exception ignored) {}

            // Next check Gemini
            if (geminiKey != null && !geminiKey.isBlank()) {
                try {
                    return callGemini(prompt, geminiKey);
                } catch (Exception ignored) {}
            }
        }

        return null; // Signals caller to use rule-based logic
    }

    /**
     * Calls local Ollama inference API.
     */
    public String callOllama(String prompt, String endpoint, String model) throws Exception {
        String cleanEndpoint = endpoint.replaceAll("/+$", "");
        String url = cleanEndpoint + "/api/generate";

        Map<String, Object> reqBody = Map.of(
                "model", model,
                "prompt", prompt,
                "stream", false
        );

        String jsonPayload = objectMapper.writeValueAsString(reqBody);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .timeout(Duration.ofSeconds(45))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() == 200) {
            JsonNode root = objectMapper.readTree(response.body());
            return root.path("response").asText("");
        } else {
            throw new RuntimeException("Ollama returned status " + response.statusCode() + ": " + response.body());
        }
    }

    /**
     * Checks if Ollama service is reachable.
     */
    public boolean isOllamaAlive(String endpoint) {
        try {
            String cleanEndpoint = endpoint.replaceAll("/+$", "");
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(cleanEndpoint + "/api/tags"))
                    .GET()
                    .timeout(Duration.ofMillis(200))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            return response.statusCode() == 200;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Status inspector for frontend settings page.
     */
    public Map<String, Object> checkOllamaHealth(String endpoint) {
        Map<String, Object> result = new HashMap<>();
        String cleanEndpoint = (endpoint != null && !endpoint.isBlank())
                ? endpoint.replaceAll("/+$", "") : "http://localhost:11434";
        result.put("endpoint", cleanEndpoint);

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(cleanEndpoint + "/api/tags"))
                    .GET()
                    .timeout(Duration.ofSeconds(3))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                result.put("connected", true);
                JsonNode root = objectMapper.readTree(response.body());
                List<String> models = new ArrayList<>();
                if (root.has("models") && root.get("models").isArray()) {
                    for (JsonNode m : root.get("models")) {
                        models.add(m.path("name").asText());
                    }
                }
                result.put("models", models);
                result.put("message", "Ollama is online and connected!");
            } else {
                result.put("connected", false);
                result.put("message", "Ollama responded with HTTP " + response.statusCode());
            }
        } catch (Exception e) {
            result.put("connected", false);
            result.put("message", "Could not connect to Ollama: " + e.getMessage());
        }
        return result;
    }

    private String callGemini(String prompt, String apiKey) throws Exception {
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
            return root.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
        }
        throw new RuntimeException("Gemini HTTP " + response.statusCode() + ": " + response.body());
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

    private AgentSettings getSettings() {
        if (settingsRepository != null) {
            return settingsRepository.findById(1L).orElseGet(AgentSettings::new);
        }
        return new AgentSettings();
    }

    public void setGeminiApiKey(String geminiApiKey) {
        this.geminiApiKey = geminiApiKey;
    }
}
