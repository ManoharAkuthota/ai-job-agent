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
import java.time.LocalDateTime;
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

    private static final List<String> HIGH_DEMAND_BACKEND_SKILLS = List.of(
            "Docker", "Kubernetes", "AWS", "Redis", "Apache Kafka", "CI/CD", "Spring Security", "Microservices"
    );

    private static final List<String> STRONG_ACTION_VERBS = List.of(
            "architected", "engineered", "implemented", "developed", "optimized",
            "spearheaded", "integrated", "automated", "designed", "deployed", "scaled"
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

        // 1. Extract Candidate Contact & Social Links
        String email = extractRegex(rawText, "[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}");
        if (email != null && !email.isBlank()) {
            profile.setEmail(email.trim());
        }

        String phone = extractRegex(rawText, "(?:\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}|\\b\\d{10}\\b");
        if (phone != null && !phone.isBlank()) {
            profile.setPhone(phone.trim());
        }

        String linkedin = extractRegex(rawText, "(https?://(?:www\\.)?linkedin\\.com/in/[a-zA-Z0-9_-]+)");
        if (linkedin != null) profile.setLinkedinUrl(linkedin);

        String github = extractRegex(rawText, "(https?://(?:www\\.)?github\\.com/[a-zA-Z0-9_-]+)");
        if (github != null) profile.setGithubUrl(github);

        // 2. Extract Candidate Name
        String name = extractName(rawText);
        if (name != null && !name.isBlank()) {
            profile.setFullName(name);
        }

        // 3. Extract Technical Skills
        List<String> matchedSkills = extractSkills(rawText);
        if (!matchedSkills.isEmpty()) {
            profile.setSkills(String.join(", ", matchedSkills));
        }

        // 4. Infer Domain
        String domain = inferDomain(matchedSkills);
        profile.setTargetDomain(domain);

        // Update profile in DB
        UserProfile savedProfile = profileRepository.save(profile);

        // 5. Compute In-Depth ATS Score & Detailed Deduction Analysis
        AtsScoreBreakdown atsAnalysis = evaluateAts(rawText, matchedSkills, email, phone, linkedin, github);

        // 6. Re-score strictly fresh jobs within the 7-day window
        LocalDateTime cutoff = LocalDateTime.now().minusDays(7);
        List<Job> freshJobs = jobRepository.findAllByDiscoveredAtAfterOrderByMatchScoreDesc(cutoff);

        // If fresh jobs list is empty, fallback to all jobs with cutoff
        if (freshJobs.isEmpty()) {
            freshJobs = jobRepository.findAll();
        }

        for (Job job : freshJobs) {
            int score = calculateMatchScore(job, matchedSkills, domain);
            job.setMatchScore(score);
        }
        jobRepository.saveAll(freshJobs);

        // Sort fresh matching jobs by score descending (strictly past 7 days)
        List<Job> sortedMatches = freshJobs.stream()
                .filter(j -> j.getDiscoveredAt() == null || !j.getDiscoveredAt().isBefore(cutoff))
                .sorted(Comparator.comparingInt(Job::getMatchScore).reversed())
                .limit(50)
                .collect(Collectors.toList());

        return new ResumeParseResult(
                true,
                "Resume parsed & ATS evaluated successfully! ATS Score: " + atsAnalysis.overallScore() + "/100.",
                savedProfile,
                matchedSkills,
                atsAnalysis,
                sortedMatches
        );
    }

    private AtsScoreBreakdown evaluateAts(String rawText, List<String> matchedSkills,
                                          String email, String phone, String linkedin, String github) {
        String lowerText = rawText.toLowerCase();
        List<AtsFeedbackItem> improvements = new ArrayList<>();
        List<String> strengths = new ArrayList<>();
        List<String> missingKeywords = new ArrayList<>();

        // Pillar 1: Contact & Social Profiles (Max 15 pts)
        int contactScore = 0;
        if (email != null && !email.isBlank()) contactScore += 4;
        if (phone != null && !phone.isBlank()) contactScore += 4;
        if (linkedin != null && !linkedin.isBlank()) contactScore += 4;
        if (github != null && !github.isBlank()) contactScore += 3;

        if (linkedin == null || linkedin.isBlank()) {
            improvements.add(new AtsFeedbackItem(
                    "Contact & Links",
                    "RECOMMENDED",
                    "Missing LinkedIn Profile URL",
                    "Over 85% of technical recruiters cross-reference ATS submissions with your live LinkedIn profile.",
                    "Add a prominent clickable LinkedIn URL (e.g., https://linkedin.com/in/yourname) in your contact header."
            ));
        } else {
            strengths.add("LinkedIn profile is clearly linked and detectable by ATS.");
        }

        if (github == null || github.isBlank()) {
            improvements.add(new AtsFeedbackItem(
                    "Contact & Links",
                    "RECOMMENDED",
                    "Missing GitHub / Code Portfolio Link",
                    "Engineering hiring managers and technical ATS filters prioritize candidates with verifiable public repositories.",
                    "Include your GitHub link (e.g., https://github.com/yourusername) to showcase your backend and full-stack projects."
            ));
        } else {
            strengths.add("GitHub repository link is present for code verification.");
        }

        // Pillar 2: Technical Skills Density (Max 30 pts)
        int skillsCount = matchedSkills.size();
        int skillsScore;
        if (skillsCount >= 12) skillsScore = 30;
        else if (skillsCount >= 8) skillsScore = 24;
        else if (skillsCount >= 5) skillsScore = 18;
        else skillsScore = 12;

        for (String highDemand : HIGH_DEMAND_BACKEND_SKILLS) {
            boolean found = matchedSkills.stream().anyMatch(s -> s.equalsIgnoreCase(highDemand));
            if (!found) {
                missingKeywords.add(highDemand);
            }
        }

        if (!missingKeywords.isEmpty()) {
            String missingListStr = String.join(", ", missingKeywords.subList(0, Math.min(4, missingKeywords.size())));
            improvements.add(new AtsFeedbackItem(
                    "Core Skills",
                    "CRITICAL",
                    "Missing High-Demand Skills (" + missingListStr + ")",
                    "Modern enterprise ATS systems screen specifically for cloud, caching, and containerization buzzwords.",
                    "Integrate skills like " + missingListStr + " into your projects or technical skills section."
            ));
        } else {
            strengths.add("Exceptional coverage of modern backend and full-stack tech stack keywords.");
        }

        // Pillar 3: Quantifiable Impact & Metrics (Max 20 pts)
        int metricCount = 0;
        Pattern metricPattern = Pattern.compile("\\b\\d+(?:\\.\\d+)?%|\\b\\d+(?:,\\d+)*(?:\\+)?\\s*(?:tps|users|req|ms|seconds|minutes|lpa|k|m)\\b|\\b\\d+\\+?\\b");
        Matcher metricMatcher = metricPattern.matcher(rawText);
        while (metricMatcher.find()) {
            metricCount++;
        }

        int impactScore;
        if (metricCount >= 6) {
            impactScore = 20;
            strengths.add("Strong use of quantifiable metrics and measurable project outcomes.");
        } else if (metricCount >= 3) {
            impactScore = 14;
            improvements.add(new AtsFeedbackItem(
                    "Impact & Metrics",
                    "CRITICAL",
                    "Low Density of Quantifiable Impact Metrics",
                    "Your experience contains few numbers or percentages. ATS algorithms rank candidates higher when bullet points demonstrate measurable business or technical results.",
                    "Rewrite project bullet points using the Google X-Y-Z formula: 'Accomplished [X], as measured by [Y] (e.g. 35% speedup, 5000+ TPS), by doing [Z]'."
            ));
        } else {
            impactScore = 8;
            improvements.add(new AtsFeedbackItem(
                    "Impact & Metrics",
                    "CRITICAL",
                    "Missing Measurable Numerical Achievements",
                    "Your resume describes responsibilities rather than outcomes. Recruiters and ATS scorecards prioritize quantifiable deliverables.",
                    "Add measurable benchmarks (e.g., 'Reduced query latency by 40%', 'Supported 10,000+ concurrent requests', 'Achieved 99.9% uptime')."
            ));
        }

        // Pillar 4: ATS Document Structure & Section Headings (Max 20 pts)
        int structureScore = 0;
        boolean hasExp = lowerText.contains("experience") || lowerText.contains("employment") || lowerText.contains("work history");
        boolean hasEdu = lowerText.contains("education") || lowerText.contains("academic") || lowerText.contains("bachelor");
        boolean hasProj = lowerText.contains("project") || lowerText.contains("personal project");
        boolean hasSkillsSec = lowerText.contains("skills") || lowerText.contains("technical skills");
        boolean hasSummary = lowerText.contains("summary") || lowerText.contains("objective") || lowerText.contains("profile");

        if (hasExp) structureScore += 5;
        if (hasEdu) structureScore += 4;
        if (hasProj) structureScore += 5;
        if (hasSkillsSec) structureScore += 4;
        if (hasSummary) structureScore += 2;

        if (!hasSummary) {
            improvements.add(new AtsFeedbackItem(
                    "Structure",
                    "RECOMMENDED",
                    "Missing Professional Executive Summary",
                    "A concise 3-4 sentence professional summary at the top helps both human screeners and semantic ATS parsers instantly categorize your level and domain.",
                    "Add an 'Executive Summary' highlighting your domain (e.g., 'Junior Java Developer specializing in Spring Boot microservices and CPaaS architecture')."
            ));
        } else {
            strengths.add("Clear professional summary detected.");
        }

        if (!hasProj) {
            improvements.add(new AtsFeedbackItem(
                    "Structure",
                    "CRITICAL",
                    "Projects Section Missing or Unclear",
                    "For junior and full-stack developers, clear project sections are critical to passing automated screening.",
                    "Add a dedicated 'Projects' section featuring 2-3 production-grade applications."
            ));
        } else {
            strengths.add("Dedicated projects section present.");
        }

        // Pillar 5: Action Verbs & Engineering Phrasing (Max 15 pts)
        int verbCount = 0;
        for (String verb : STRONG_ACTION_VERBS) {
            if (lowerText.contains(verb)) {
                verbCount++;
            }
        }

        int actionVerbsScore;
        if (verbCount >= 5) {
            actionVerbsScore = 15;
            strengths.add("Strong engineering action verbs used throughout work and project descriptions.");
        } else if (verbCount >= 2) {
            actionVerbsScore = 10;
            improvements.add(new AtsFeedbackItem(
                    "Action Verbs",
                    "RECOMMENDED",
                    "Moderate Action Verb Variety",
                    "Several bullet points rely on standard passive wording rather than impactful technical action verbs.",
                    "Begin every bullet point with strong engineering action verbs like 'Architected', 'Engineered', 'Orchestrated', or 'Refactored'."
            ));
        } else {
            actionVerbsScore = 6;
            improvements.add(new AtsFeedbackItem(
                    "Action Verbs",
                    "CRITICAL",
                    "Weak / Passive Phrasing in Experience Bullets",
                    "Phrases like 'worked on' or 'responsible for' trigger lower relevance scores in modern semantic ATS parsers.",
                    "Replace passive language with authoritative verbs (e.g., 'Engineered RESTful CPaaS microservices', 'Scaled relational database queries')."
            ));
        }

        // Calculate Overall ATS Score (out of 100)
        int overall = contactScore + skillsScore + impactScore + structureScore + actionVerbsScore;
        int finalScore = Math.min(96, Math.max(40, overall));

        return new AtsScoreBreakdown(
                finalScore,
                contactScore,
                skillsScore,
                impactScore,
                structureScore,
                actionVerbsScore,
                strengths,
                improvements,
                missingKeywords
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
        int score = 42;
        String jobText = ((job.getTitle() != null ? job.getTitle() : "") + " " +
                (job.getDescription() != null ? job.getDescription() : "")).toLowerCase();

        int skillMatches = 0;
        for (String skill : candidateSkills) {
            if (jobText.contains(skill.toLowerCase())) {
                skillMatches++;
            }
        }

        score += Math.min(46, skillMatches * 7);

        if (job.getTitle() != null) {
            String titleLower = job.getTitle().toLowerCase();
            if (titleLower.contains("java") && targetDomain.toLowerCase().contains("java")) {
                score += 8;
            }
            if (titleLower.contains("full stack") || titleLower.contains("fullstack")) {
                score += 4;
            }
        }

        return Math.min(99, Math.max(40, score));
    }

    public record AtsFeedbackItem(
            String category,
            String severity,
            String issue,
            String reason,
            String suggestion
    ) {}

    public record AtsScoreBreakdown(
            int overallScore,
            int contactScore,
            int skillsScore,
            int impactScore,
            int structureScore,
            int actionVerbsScore,
            List<String> strengths,
            List<AtsFeedbackItem> improvements,
            List<String> missingKeywords
    ) {}

    public record ResumeParseResult(
            boolean success,
            String message,
            UserProfile profile,
            List<String> extractedSkills,
            AtsScoreBreakdown atsAnalysis,
            List<Job> matchedJobs
    ) {}
}