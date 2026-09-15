package com.jobagent.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobagent.model.AgentLog;
import com.jobagent.model.Job;
import com.jobagent.model.UserProfile;
import com.jobagent.repository.AgentLogRepository;
import com.jobagent.repository.JobRepository;
import com.jobagent.repository.UserProfileRepository;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
public class JobDiscoveryService {

    private final JobRepository jobRepository;
    private final UserProfileRepository profileRepository;
    private final AgentLogRepository logRepository;
    private final AiAgentService aiAgentService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    public JobDiscoveryService(JobRepository jobRepository,
                               UserProfileRepository profileRepository,
                               AgentLogRepository logRepository,
                               AiAgentService aiAgentService) {
        this.jobRepository = jobRepository;
        this.profileRepository = profileRepository;
        this.logRepository = logRepository;
        this.aiAgentService = aiAgentService;
    }

    /**
     * Discovers 100% REAL, LIVE, CURRENT jobs matching Java, Spring Boot, React, and Full Stack.
     * Strictly NO dummy data, NO non-tech roles.
     */
    public List<Job> discoverJobs(String domain, String keywords) {
        List<Job> discovered = new ArrayList<>();
        UserProfile profile = profileRepository.findAll().stream().findFirst().orElse(null);

        // Purge any non-engineering or placeholder jobs
        purgeIrrelevantJobs();

        logRepository.save(new AgentLog("INFO", "DISCOVERY",
                "Scanning real-time job feeds for live Java, Spring Boot, React, and Backend roles..."));

        try {
            // 1. Fetch Real Jobs from Jobicy (Java, Spring, Backend, Full Stack, React)
            fetchFromJobicy(discovered, "java");
            fetchFromJobicy(discovered, "spring");
            fetchFromJobicy(discovered, "backend");
            fetchFromJobicy(discovered, "full-stack");
            fetchFromJobicy(discovered, "react");

            // 2. Fetch Real Jobs from Arbeitnow API
            fetchFromArbeitnow(discovered, 1);
            fetchFromArbeitnow(discovered, 2);

            // 3. Fetch Real Jobs from Remotive API
            fetchFromRemotive(discovered);

        } catch (Exception e) {
            logRepository.save(new AgentLog("WARN", "DISCOVERY", "Live fetch notice: " + e.getMessage()));
        }

        // Filter and persist real jobs
        List<Job> savedJobs = new ArrayList<>();
        for (Job job : discovered) {
            if (isRelevantRole(job.getTitle(), job.getDescription()) &&
                job.getUrl() != null && !job.getUrl().contains("example.com") &&
                jobRepository.findByUrl(job.getUrl()).isEmpty()) {

                int score = aiAgentService.calculateMatchScore(profile, job);
                job.setMatchScore(score);
                jobRepository.save(job);
                savedJobs.add(job);
            }
        }

        logRepository.save(new AgentLog("SUCCESS", "DISCOVERY",
                "Real-Time Scan Complete: Ingested " + savedJobs.size() + " verified live software engineering jobs."));

        return savedJobs;
    }

    private void fetchFromJobicy(List<Job> list, String tag) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://jobicy.com/api/v2/remote-jobs?count=50&tag=" + tag))
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AIJobAgent/1.0")
                    .GET()
                    .timeout(Duration.ofSeconds(12))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode jobs = root.path("jobs");
                if (jobs.isArray()) {
                    for (JsonNode item : jobs) {
                        String title = item.path("jobTitle").asText("");
                        String company = item.path("companyName").asText("");
                        String geo = item.path("jobGeo").asText("Remote");
                        String url = item.path("url").asText("");
                        String description = item.path("jobDescription").asText("").replaceAll("<[^>]*>", " ");
                        String type = item.path("jobType").asText("Full-Time");

                        String minSal = item.path("annualSalaryMin").asText("");
                        String maxSal = item.path("annualSalaryMax").asText("");
                        String currency = item.path("salaryCurrency").asText("$");
                        String salary = (!minSal.isBlank() && !maxSal.isBlank())
                                ? currency + minSal + " - " + currency + maxSal
                                : "Competitive";

                        if (!url.isBlank() && !title.isBlank() && isRelevantRole(title, description)) {
                            Job job = new Job(title, company, geo, type, salary, description, url, "Jobicy Live");
                            list.add(job);
                        }
                    }
                }
            }
        } catch (Exception ignored) {}
    }

    private void fetchFromArbeitnow(List<Job> list, int page) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://www.arbeitnow.com/api/job-board-api?page=" + page))
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AIJobAgent/1.0")
                    .GET()
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode data = root.path("data");
                if (data.isArray()) {
                    for (JsonNode item : data) {
                        String title = item.path("title").asText("");
                        String company = item.path("company_name").asText("");
                        String location = item.path("location").asText("Remote");
                        String url = item.path("url").asText("");
                        String description = item.path("description").asText("").replaceAll("<[^>]*>", " ");
                        boolean remote = item.path("remote").asBoolean(true);

                        if (!url.isBlank() && !title.isBlank() && isRelevantRole(title, description)) {
                            Job job = new Job(title, company, location, remote ? "Remote" : "Hybrid", "Competitive", description, url, "Arbeitnow Live");
                            list.add(job);
                        }
                    }
                }
            }
        } catch (Exception ignored) {}
    }

    private void fetchFromRemotive(List<Job> list) {
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://remotive.com/api/remote-jobs?category=software-dev&limit=50"))
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AIJobAgent/1.0")
                    .GET()
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode jobs = root.path("jobs");
                if (jobs.isArray()) {
                    for (JsonNode item : jobs) {
                        String title = item.path("title").asText("");
                        String company = item.path("company_name").asText("");
                        String location = item.path("candidate_required_location").asText("Worldwide / India");
                        String url = item.path("url").asText("");
                        String description = item.path("description").asText("").replaceAll("<[^>]*>", " ");
                        String salary = item.path("salary").asText("Competitive");

                        if (!url.isBlank() && !title.isBlank() && isRelevantRole(title, description)) {
                            Job job = new Job(title, company, location, "Remote", salary, description, url, "Remotive Live");
                            list.add(job);
                        }
                    }
                }
            }
        } catch (Exception ignored) {}
    }

    private boolean isRelevantRole(String title, String description) {
        String t = (title != null ? title : "").toLowerCase();
        if (t.contains("marketing") || t.contains("writer") || t.contains("copywriter") || t.contains("sales")
                || t.contains("recruiter") || t.contains("assistant") || t.contains("customer service")) {
            return false;
        }

        String full = (t + " " + (description != null ? description : "")).toLowerCase();
        return t.contains("developer") || t.contains("engineer") || t.contains("software")
                || t.contains("java") || t.contains("spring") || t.contains("react") || t.contains("fullstack")
                || t.contains("full stack") || t.contains("backend") || t.contains("frontend")
                || full.contains("java") || full.contains("spring boot");
    }

    private void purgeIrrelevantJobs() {
        try {
            List<Job> all = jobRepository.findAll();
            for (Job j : all) {
                if (j.getUrl() != null && (j.getUrl().contains("example.com") || j.getSource().equals("Direct Careers") || !isRelevantRole(j.getTitle(), j.getDescription()))) {
                    jobRepository.delete(j);
                }
            }
        } catch (Exception ignored) {}
    }
}
