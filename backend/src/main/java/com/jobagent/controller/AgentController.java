package com.jobagent.controller;

import com.jobagent.model.AgentLog;
import com.jobagent.model.AgentSettings;
import com.jobagent.repository.AgentLogRepository;
import com.jobagent.repository.AgentSettingsRepository;
import com.jobagent.repository.JobApplicationRepository;
import com.jobagent.repository.JobRepository;
import com.jobagent.repository.TailoredResumeRepository;
import com.jobagent.service.AiAgentService;
import com.jobagent.service.DailyAgentScheduler;
import com.jobagent.service.EmailNotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/agent")
public class AgentController {

    private final DailyAgentScheduler dailyAgentScheduler;
    private final JobRepository jobRepository;
    private final TailoredResumeRepository tailoredResumeRepository;
    private final JobApplicationRepository applicationRepository;
    private final AgentLogRepository logRepository;
    private final AgentSettingsRepository settingsRepository;
    private final AiAgentService aiAgentService;
    private final EmailNotificationService emailNotificationService;

    public AgentController(DailyAgentScheduler dailyAgentScheduler,
                           JobRepository jobRepository,
                           TailoredResumeRepository tailoredResumeRepository,
                           JobApplicationRepository applicationRepository,
                           AgentLogRepository logRepository,
                           AgentSettingsRepository settingsRepository,
                           AiAgentService aiAgentService,
                           EmailNotificationService emailNotificationService) {
        this.dailyAgentScheduler = dailyAgentScheduler;
        this.jobRepository = jobRepository;
        this.tailoredResumeRepository = tailoredResumeRepository;
        this.applicationRepository = applicationRepository;
        this.logRepository = logRepository;
        this.settingsRepository = settingsRepository;
        this.aiAgentService = aiAgentService;
        this.emailNotificationService = emailNotificationService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getAgentStatus() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalJobsDiscovered", jobRepository.count());
        stats.put("resumesTailored", tailoredResumeRepository.count());
        stats.put("totalApplied", applicationRepository.countByStatus("APPLIED"));
        stats.put("interviewsScheduled", applicationRepository.countByStatus("INTERVIEW"));
        stats.put("schedulerActive", true);
        stats.put("dailyExecutionTime", "09:00 AM IST (Scheduled Daily)");

        AgentSettings settings = settingsRepository.findById(1L).orElseGet(AgentSettings::new);
        stats.put("targetDomain", settings.getTargetDomain());
        stats.put("autoApplyEnabled", settings.getAutoApplyEnabled());
        stats.put("aiProvider", settings.getAiProvider());
        stats.put("ollamaEndpoint", settings.getOllamaEndpoint());
        stats.put("emailNotificationsEnabled", settings.getEmailNotificationsEnabled());

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/logs")
    public List<AgentLog> getRecentLogs() {
        return logRepository.findTop50ByOrderByTimestampDesc();
    }

    @GetMapping("/settings")
    public AgentSettings getSettings() {
        return settingsRepository.findById(1L).orElseGet(() -> settingsRepository.save(new AgentSettings()));
    }

    @PostMapping("/settings")
    public AgentSettings updateSettings(@RequestBody AgentSettings updated) {
        updated.setId(1L);
        return settingsRepository.save(updated);
    }

    @PostMapping("/run-now")
    public ResponseEntity<?> runAgentNow() {
        DailyAgentScheduler.AgentWorkflowResult result = dailyAgentScheduler.runDailyWorkflow();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/check-ollama")
    public ResponseEntity<Map<String, Object>> checkOllama(@RequestParam(required = false, defaultValue = "http://localhost:11434") String endpoint) {
        Map<String, Object> health = aiAgentService.checkOllamaHealth(endpoint);
        return ResponseEntity.ok(health);
    }

    @PostMapping("/test-email")
    public ResponseEntity<Map<String, Object>> testEmail(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.isBlank()) {
            AgentSettings settings = settingsRepository.findById(1L).orElseGet(AgentSettings::new);
            email = settings.getNotificationEmail();
        }

        boolean sent = emailNotificationService.sendTestEmail(email);
        Map<String, Object> res = new HashMap<>();
        res.put("success", sent);
        res.put("recipient", email);
        res.put("message", sent ? "Test email dispatched successfully!" : "Failed to dispatch email. Check SMTP settings or backend logs.");
        return ResponseEntity.ok(res);
    }
}
