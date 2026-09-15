package com.jobagent.controller;

import com.jobagent.model.AgentLog;
import com.jobagent.model.AgentSettings;
import com.jobagent.repository.AgentLogRepository;
import com.jobagent.repository.AgentSettingsRepository;
import com.jobagent.repository.JobApplicationRepository;
import com.jobagent.repository.JobRepository;
import com.jobagent.repository.TailoredResumeRepository;
import com.jobagent.service.DailyAgentScheduler;
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

    public AgentController(DailyAgentScheduler dailyAgentScheduler,
                           JobRepository jobRepository,
                           TailoredResumeRepository tailoredResumeRepository,
                           JobApplicationRepository applicationRepository,
                           AgentLogRepository logRepository,
                           AgentSettingsRepository settingsRepository) {
        this.dailyAgentScheduler = dailyAgentScheduler;
        this.jobRepository = jobRepository;
        this.tailoredResumeRepository = tailoredResumeRepository;
        this.applicationRepository = applicationRepository;
        this.logRepository = logRepository;
        this.settingsRepository = settingsRepository;
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
}
