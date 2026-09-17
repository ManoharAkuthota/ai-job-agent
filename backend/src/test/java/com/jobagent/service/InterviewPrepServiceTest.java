package com.jobagent.service;

import com.jobagent.model.InterviewPrep;
import com.jobagent.model.Job;
import com.jobagent.model.UserProfile;
import com.jobagent.repository.AgentSettingsRepository;
import com.jobagent.repository.InterviewPrepRepository;
import com.jobagent.repository.JobRepository;
import com.jobagent.repository.UserProfileRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class InterviewPrepServiceTest {

    @Test
    void testGenerateInterviewPrep() throws Exception {
        InterviewPrepRepository prepRepo = mock(InterviewPrepRepository.class);
        JobRepository jobRepo = mock(JobRepository.class);
        UserProfileRepository profileRepo = mock(UserProfileRepository.class);
        AgentSettingsRepository settingsRepo = mock(AgentSettingsRepository.class);
        AiAgentService aiAgentService = mock(AiAgentService.class);

        Job job = new Job();
        job.setId(90003L);
        job.setTitle("Backend Engineer (Java / Microservices)");
        job.setCompany("Zepto");
        job.setDescription("Looking for Backend Engineers to build high-throughput Java microservices with Kafka, Spring Boot, MySQL.");

        when(jobRepo.findById(90003L)).thenReturn(Optional.of(job));
        when(prepRepo.save(any(InterviewPrep.class))).thenAnswer(invocation -> {
            InterviewPrep p = invocation.getArgument(0);
            p.setId(1L);
            return p;
        });

        InterviewPrepService service = new InterviewPrepService(prepRepo, jobRepo, profileRepo, settingsRepo, aiAgentService);
        InterviewPrep result = service.generateInterviewPrep(90003L);

        assertNotNull(result);
        assertEquals("Backend Engineer (Java / Microservices)", result.getJobTitle());
        assertEquals("Zepto", result.getCompany());
        assertNotNull(result.getTechnicalQuestionsJson());
        assertNotNull(result.getBehavioralQuestionsJson());
        assertNotNull(result.getSystemDesignJson());
        System.out.println("TEST PASSED! Tech questions generated successfully.");
    }
}
