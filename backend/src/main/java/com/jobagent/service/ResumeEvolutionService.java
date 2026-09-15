package com.jobagent.service;

import com.jobagent.model.AgentLog;
import com.jobagent.model.Job;
import com.jobagent.model.UserProfile;
import com.jobagent.repository.AgentLogRepository;
import com.jobagent.repository.UserProfileRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ResumeEvolutionService {

    private final UserProfileRepository profileRepository;
    private final AgentLogRepository logRepository;

    public ResumeEvolutionService(UserProfileRepository profileRepository, AgentLogRepository logRepository) {
        this.profileRepository = profileRepository;
        this.logRepository = logRepository;
    }

    /**
     * Autonomously analyzes today's newly discovered jobs and updates ONLY the technical skills information.
     * All personal candidate information (Name, Contact, Summary, Experience, Projects, Education)
     * is STRICTLY IMMUTABLE and preserved exactly as written by Akuthota Manohar.
     */
    public UserProfile evolveMasterResumeDaily(List<Job> todayJobs) {
        UserProfile profile = profileRepository.findAll().stream().findFirst().orElse(null);
        if (profile == null || todayJobs == null || todayJobs.isEmpty()) {
            return profile;
        }

        // Target relevant skills in the Java Full Stack / Microservices domain
        List<String> domainCandidateSkills = List.of(
                "Java", "Spring Boot", "Spring Security", "JWT", "Microservices", "Apache Kafka",
                "React", "Angular", "JavaScript", "HTML", "CSS", "Node.js", "Express",
                "MySQL", "MongoDB", "GitHub", "REST APIs", "Postman", "Python", "Docker", "AWS", "CI/CD"
        );

        // 1. Analyze frequency of in-demand skills in today's job market postings
        Map<String, Integer> marketFrequencies = new HashMap<>();
        for (Job job : todayJobs) {
            String text = ((job.getTitle() != null ? job.getTitle() : "") + " " +
                           (job.getDescription() != null ? job.getDescription() : "")).toLowerCase();

            for (String skill : domainCandidateSkills) {
                if (text.contains(skill.toLowerCase())) {
                    marketFrequencies.put(skill, marketFrequencies.getOrDefault(skill, 0) + 1);
                }
            }
        }

        // 2. Parse current baseline skills
        Set<String> currentSkills = (profile.getSkills() != null)
                ? Arrays.stream(profile.getSkills().split("[,|;]"))
                        .map(String::trim)
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toCollection(LinkedHashSet::new))
                : new LinkedHashSet<>(domainCandidateSkills);

        // Sort skills prioritizing today's most requested skills first
        List<String> sortedSkills = new ArrayList<>(currentSkills);
        sortedSkills.sort((a, b) -> {
            int freqA = marketFrequencies.getOrDefault(a, 0);
            int freqB = marketFrequencies.getOrDefault(b, 0);
            return Integer.compare(freqB, freqA);
        });

        // 3. Update ONLY the skills field
        profile.setSkills(String.join(", ", sortedSkills));

        // Save updated skills without modifying any personal details or work history
        UserProfile saved = profileRepository.save(profile);

        List<String> top3 = sortedSkills.stream().limit(4).toList();
        String message = "Daily Skills Evolution: Re-indexed technical skills based on today's " + todayJobs.size()
                + " job postings. Highest prioritized skills today: " + String.join(", ", top3)
                + ". Personal details and work experience remained 100% untouched.";

        logRepository.save(new AgentLog("SUCCESS", "SKILLS_UPDATE", message));
        return saved;
    }
}
