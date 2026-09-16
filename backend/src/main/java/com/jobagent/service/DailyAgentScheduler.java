package com.jobagent.service;

import com.jobagent.model.*;
import com.jobagent.repository.*;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DailyAgentScheduler {

    private final JobDiscoveryService discoveryService;
    private final ResumeEvolutionService resumeEvolutionService;
    private final AiAgentService aiAgentService;
    private final ResumeGeneratorService resumeGeneratorService;
    private final BrowserAutoApplyService browserAutoApplyService;
    private final JobRepository jobRepository;
    private final UserProfileRepository profileRepository;
    private final TailoredResumeRepository tailoredResumeRepository;
    private final JobApplicationRepository applicationRepository;
    private final AgentLogRepository logRepository;
    private final AgentSettingsRepository settingsRepository;
    private final EmailNotificationService emailNotificationService;

    public DailyAgentScheduler(JobDiscoveryService discoveryService,
                               ResumeEvolutionService resumeEvolutionService,
                               AiAgentService aiAgentService,
                               ResumeGeneratorService resumeGeneratorService,
                               BrowserAutoApplyService browserAutoApplyService,
                               JobRepository jobRepository,
                               UserProfileRepository profileRepository,
                               TailoredResumeRepository tailoredResumeRepository,
                               JobApplicationRepository applicationRepository,
                               AgentLogRepository logRepository,
                               AgentSettingsRepository settingsRepository,
                               EmailNotificationService emailNotificationService) {
        this.discoveryService = discoveryService;
        this.resumeEvolutionService = resumeEvolutionService;
        this.aiAgentService = aiAgentService;
        this.resumeGeneratorService = resumeGeneratorService;
        this.browserAutoApplyService = browserAutoApplyService;
        this.jobRepository = jobRepository;
        this.profileRepository = profileRepository;
        this.tailoredResumeRepository = tailoredResumeRepository;
        this.applicationRepository = applicationRepository;
        this.logRepository = logRepository;
        this.settingsRepository = settingsRepository;
        this.emailNotificationService = emailNotificationService;
    }

    /**
     * Fully autonomous daily morning cron job (runs every day at 09:00 AM IST)
     */
    @Scheduled(cron = "${agent.daily-cron:0 0 9 * * ?}")
    public void runScheduledMorningTask() {
        logRepository.save(new AgentLog("INFO", "SCHEDULED", "Autonomous Daily AI Agent started morning job cycle."));
        runDailyWorkflow();
    }

    /**
     * Executes the complete autonomous workflow:
     * 1. Scrape & discover fresh domain jobs
     * 2. Evolve and update candidate master resume with current market trends
     * 3. Tailor ATS resumes & generate PDFs for matching jobs
     * 4. Autonomously apply via Playwright headless browser & capture confirmation screenshots
     */
    public AgentWorkflowResult runDailyWorkflow() {
        AgentSettings settings = settingsRepository.findById(1L).orElseGet(() -> {
            AgentSettings defaultSettings = new AgentSettings();
            defaultSettings.setAutoApplyEnabled(true); // Default to fully autonomous
            return settingsRepository.save(defaultSettings);
        });

        UserProfile profile = profileRepository.findAll().stream().findFirst().orElseGet(() -> {
            UserProfile p = new UserProfile();
            p.setFullName("Akuthota Developer");
            p.setEmail("developer@example.com");
            p.setPhone("+91 9876543210");
            p.setLocation("India");
            p.setTargetDomain("Java Full Stack");
            p.setSummary("Passionate Full Stack Java Developer with strong expertise in Spring Boot, React, MySQL, and microservices architecture.");
            p.setSkills("Java, Spring Boot, React, JavaScript, MySQL, Hibernate, REST APIs, Git, Docker, HTML/CSS");
            p.setExperience("• Designed and implemented RESTful microservices using Spring Boot and Spring Data JPA.\n• Built reactive frontend interfaces using React and modern component architecture.\n• Optimized MySQL queries and schema designs for high performance.");
            p.setEducation("Bachelor of Technology in Computer Science & Engineering");
            return profileRepository.save(p);
        });

        if (settings.getGeminiApiKey() != null && !settings.getGeminiApiKey().isBlank()) {
            aiAgentService.setGeminiApiKey(settings.getGeminiApiKey());
        }

        // 1. Discover new jobs
        List<Job> newJobs = discoveryService.discoverJobs(settings.getTargetDomain(), settings.getTargetKeywords());
        List<Job> allMarketJobs = newJobs.isEmpty() ? jobRepository.findAll() : newJobs;

        // 2. DYNAMIC DAILY RESUME EVOLUTION: Update resume based on market trends
        UserProfile evolvedProfile = resumeEvolutionService.evolveMasterResumeDaily(allMarketJobs);
        if (evolvedProfile != null) {
            profile = evolvedProfile;
        }

        // 3. Scan candidate jobs matching threshold that are not yet applied
        int minScore = (settings.getMinMatchScore() != null) ? settings.getMinMatchScore() : 60;
        List<Job> candidateJobs = jobRepository.findAll().stream()
                .filter(j -> j.getMatchScore() >= minScore)
                .filter(j -> !"APPLIED".equals(j.getStatus()))
                .limit(10) // Safe daily application limit to prevent rate limits
                .toList();

        int resumesCreated = 0;
        int applicationsSubmitted = 0;

        for (Job job : candidateJobs) {
            // Tailor ATS Resume
            TailoredResume tailored = aiAgentService.tailorResume(profile, job);
            String html = resumeGeneratorService.buildHtmlResume(profile, tailored);
            tailored.setResumeHtml(html);
            String pdfPath = resumeGeneratorService.generatePdfResume(profile, tailored);
            tailored.setPdfFilePath(pdfPath);
            TailoredResume savedResume = tailoredResumeRepository.save(tailored);

            job.setStatus("TAILORED");
            jobRepository.save(job);
            resumesCreated++;

            // 4. AUTONOMOUS APPLICATION: Headless Browser Form Filling & Submission
            BrowserAutoApplyService.AutoApplyResult applyResult =
                    browserAutoApplyService.executeAutonomousApply(job, profile, savedResume);

            JobApplication app = new JobApplication(job.getId(), job.getTitle(), job.getCompany(), job.getLocation(), job.getUrl(), savedResume.getId());
            app.setStatus("APPLIED");
            app.setAppliedMethod("AUTONOMOUS_PLAYWRIGHT");
            app.setScreenshotProofPath(applyResult.proofScreenshotPath());
            app.setNotes(applyResult.message());
            applicationRepository.save(app);

            job.setStatus("APPLIED");
            jobRepository.save(job);
            applicationsSubmitted++;

            // Email Notification on Autonomous Submission
            if (Boolean.TRUE.equals(settings.getEmailNotificationsEnabled())
                    && settings.getNotificationEmail() != null && !settings.getNotificationEmail().isBlank()) {
                try {
                    emailNotificationService.sendApplicationSubmittedEmail(
                            settings.getNotificationEmail(),
                            job.getTitle(),
                            job.getCompany(),
                            "AUTONOMOUS_PLAYWRIGHT",
                            applyResult.proofScreenshotPath()
                    );
                } catch (Exception e) {
                    System.err.println("Failed to send application email notification: " + e.getMessage());
                }
            }
        }

        logRepository.save(new AgentLog("SUCCESS", "WORKFLOW",
                "Autonomous Cycle Complete: Evolved Master Resume | Discovered: " + newJobs.size() + " jobs | Tailored: " + resumesCreated + " resumes | Autonomously Applied: " + applicationsSubmitted + " jobs with screenshot proof."));

        return new AgentWorkflowResult(newJobs.size(), resumesCreated, applicationsSubmitted);
    }

    public record AgentWorkflowResult(int jobsDiscovered, int resumesTailored, int applicationsSubmitted) {}
}
