package com.jobagent.service;

import com.jobagent.model.Job;
import com.jobagent.model.UserProfile;
import com.jobagent.repository.JobRepository;
import com.jobagent.repository.UserProfileRepository;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ResumeParserService {

    private final UserProfileRepository profileRepository;
    private final JobRepository jobRepository;

    private static final List<String> KNOWN_TECH_KEYWORDS = List.of(
            "java", "spring boot", "spring security", "jwt", "microservices", "kafka", "apache kafka",
            "react", "angular", "vue", "javascript", "typescript", "node.js", "nodejs", "express",
            "mysql", "postgresql", "mongodb", "redis", "oracle", "sql",
            "docker", "kubernetes", "aws", "azure", "gcp", "git", "github", "ci/cd", "rest", "rest api", "restful",
            "hibernate", "jpa", "maven", "gradle", "python", "html", "css", "tailwind", "c++", "c#"
    );

    public ResumeParserService(UserProfileRepository profileRepository, JobRepository jobRepository) {
        this.profileRepository = profileRepository;
        this.jobRepository = jobRepository;
    }

    public ResumeParseResult parseAndMatch(MultipartFile file) throws Exception {
        String rawText = extractText(file);
        if (rawText == null || rawText.isBlank()) {
            throw new IllegalArgumentException("Could not extract any readable text from the uploaded file.");
        }

        UserProfile profile = profileRepository.findAll().stream().findFirst().orElse(new UserProfile());

        // Extract Candidate Contact & Social Links
        String email = extractRegex(rawText, "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
        if (email != null && !email.isBlank()) {
            profile.setEmail(email.trim());
        }

        String phone = extractRegex(rawText, "(?:\\+?\\d{1,3}[-.\s]?)?\\(?\\d{3}\\)?[-.\s]?\\d{3}[-.\s]?\\d{4}|\\b\\d{10}\\b");
        if (phone != null && !phone.isBlank()) {
            profile.setPhone(phone.trim());
        }

        String linkedin = extractRegex(rawText, "(https?://(?:www\\.)?linkedin\\.com/in/[a-zA-Z0-9_-]+)");
        if (linkedin != null) profile.setLinkedinUrl(linkedin);

        String github = extractRegex(rawText, "(https?://(?:www\\.)?github\\.com/[a-zA-Z0-9_-]+)");
        if (github != null) profile.setGithubUrl(github);

        // Extract Name from first 3 non-empty lines if valid
        String name = extractName(rawText);
        if (name != null && !name.isBlank()) {
            profile.setFullName(name);
        }

        // Extract Skills
        List<String> matchedSkills = extractSkills(rawText);
        if (!matchedSkills.isEmpty()) {
            profile.setSkills(String.join(", ", matchedSkills));
        }

        // Extract Domain
        String domain = inferDomain(matchedSkills);
        profile.setTargetDomain(domain);

        // Update profile in DB
        UserProfile savedProfile = profileRepository.save(profile);

        // Re-score all jobs against the parsed resume
        List<Job> allJobs = jobRepository.findAll();
        for (Job job : allJobs) {
            int score = calculateMatchScore(job, matchedSkills, domain);
            job.setMatchScore(score);
            jobRepository.save(job);
        }

        // Sort matching jobs by score descending
        List<Job> sortedMatches = allJobs.stream()
                .sorted(Comparator.comparingInt(Job::getMatchScore).reversed())
                .limit(50)
                .collect(Collectors.toList());

        return new ResumeParseResult(
                true,
                "Resume parsed successfully! Extracted " + matchedSkills.size() + " key technical skills.",
                savedProfile,
                matchedSkills,
                sortedMatches
        );
    }

    private String extractText(MultipartFile file) throws Exception {
        String filename = file.getOriginalFilename() != null ? file.getOriginalFilename().toLowerCase() : "";
        if (filename.endsWith(".pdf")) {
            try (PDDocument document = Loader.loadPDF(file.getBytes())) {
                PDFTextStripper stripper = new PDFTextStripper();
                return stripper.getText(document);
            }
        } else {
            // Read as text
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
                return reader.lines().collect(Collectors.joining("\n"));
            }
        }
    }

    private String extractName(String rawText) {
        String[] lines = rawText.split("\\r?\\n");
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.length() >= 3 && trimmed.length() <= 40
                    && !trimmed.toLowerCase().contains("resume")
                    && !trimmed.toLowerCase().contains("curriculum")
                    && !trimmed.contains("@")
                    && !trimmed.matches(".*\\d{5,}.*")) {
                return trimmed;
            }
        }
        return null;
    }

    private String extractRegex(String text, String regex) {
        Pattern pattern = Pattern.compile(regex, Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(text);
        if (matcher.find()) {
            return matcher.group(0);
        }
        return null;
    }

    private List<String> extractSkills(String rawText) {
        String lower = rawText.toLowerCase();
        Set<String> detected = new LinkedHashSet<>();

        for (String kw : KNOWN_TECH_KEYWORDS) {
            // Word boundary match
            Pattern p = Pattern.compile("\\b" + Pattern.quote(kw) + "\\b", Pattern.CASE_INSENSITIVE);
            if (p.matcher(lower).find()) {
                detected.add(capitalizeKeyword(kw));
            }
        }

        return new ArrayList<>(detected);
    }

    private String capitalizeKeyword(String kw) {
        if (kw.equalsIgnoreCase("sql") || kw.equalsIgnoreCase("jwt") || kw.equalsIgnoreCase("jpa") || kw.equalsIgnoreCase("aws") || kw.equalsIgnoreCase("gcp")) {
            return kw.toUpperCase();
        }
        String[] words = kw.split(" ");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (!sb.isEmpty()) sb.append(" ");
            if (!w.isEmpty()) {
                sb.append(Character.toUpperCase(w.charAt(0))).append(w.substring(1));
            }
        }
        return sb.toString();
    }

    private String inferDomain(List<String> skills) {
        String lowerSkills = skills.stream().map(String::toLowerCase).collect(Collectors.joining(" "));
        if (lowerSkills.contains("react") && lowerSkills.contains("spring")) {
            return "Java Full Stack Developer";
        } else if (lowerSkills.contains("spring") || lowerSkills.contains("microservices") || lowerSkills.contains("kafka")) {
            return "Java Backend Developer";
        } else if (lowerSkills.contains("react") || lowerSkills.contains("angular") || lowerSkills.contains("vue")) {
            return "Frontend Developer";
        } else if (lowerSkills.contains("python")) {
            return "Python / AI Engineer";
        }
        return "Software Engineer";
    }

    private int calculateMatchScore(Job job, List<String> candidateSkills, String targetDomain) {
        int score = 40; // Base baseline score
        String jobText = ((job.getTitle() != null ? job.getTitle() : "") + " " +
                (job.getDescription() != null ? job.getDescription() : "")).toLowerCase();

        int skillMatches = 0;
        for (String skill : candidateSkills) {
            if (jobText.contains(skill.toLowerCase())) {
                skillMatches++;
            }
        }

        // Add 5 points per matched skill up to 45
        score += Math.min(45, skillMatches * 6);

        // Domain affinity bonus
        if (job.getTitle() != null) {
            String titleLower = job.getTitle().toLowerCase();
            if (titleLower.contains("java") && targetDomain.toLowerCase().contains("java")) {
                score += 10;
            }
            if (titleLower.contains("full stack") || titleLower.contains("fullstack")) {
                score += 5;
            }
        }

        return Math.min(99, Math.max(35, score));
    }

    public record ResumeParseResult(
            boolean success,
            String message,
            UserProfile profile,
            List<String> extractedSkills,
            List<Job> matchedJobs
    ) {}
}