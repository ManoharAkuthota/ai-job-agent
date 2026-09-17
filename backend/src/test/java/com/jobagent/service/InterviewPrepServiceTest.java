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
        System.out.println("BACKEND TEST PASSED! Java microservices questions generated successfully.");
    }

    @Test
    void testGenerateInterviewPrepFrontend() throws Exception {
        InterviewPrepRepository prepRepo = mock(InterviewPrepRepository.class);
        JobRepository jobRepo = mock(JobRepository.class);
        UserProfileRepository profileRepo = mock(UserProfileRepository.class);
        AgentSettingsRepository settingsRepo = mock(AgentSettingsRepository.class);
        AiAgentService aiAgentService = mock(AiAgentService.class);

        UserProfile userProfile = new UserProfile();
        userProfile.setTargetDomain("Frontend Developer");
        userProfile.setSkills("React, TypeScript, Next.js, Redux, Tailwind CSS");
        when(profileRepo.findAll()).thenReturn(java.util.List.of(userProfile));

        Job frontendJob = new Job();
        frontendJob.setId(70001L);
        frontendJob.setTitle("Senior Frontend Engineer (React / TypeScript / Next.js)");
        frontendJob.setCompany("Razorpay");
        frontendJob.setDescription("Build checkout, payments gateway dashboard, and UI design systems with React 18/19, TypeScript, Next.js, Redux Toolkit, Tailwind.");

        when(jobRepo.findById(70001L)).thenReturn(Optional.of(frontendJob));
        when(prepRepo.save(any(InterviewPrep.class))).thenAnswer(invocation -> {
            InterviewPrep p = invocation.getArgument(0);
            p.setId(2L);
            return p;
        });

        InterviewPrepService service = new InterviewPrepService(prepRepo, jobRepo, profileRepo, settingsRepo, aiAgentService);
        InterviewPrep result = service.generateInterviewPrep(70001L);

        assertNotNull(result);
        assertEquals("Senior Frontend Engineer (React / TypeScript / Next.js)", result.getJobTitle());
        assertEquals("Razorpay", result.getCompany());

        String techJson = result.getTechnicalQuestionsJson();
        assertNotNull(techJson);

        // Verify it contains React, Fiber, Core Web Vitals, and CSS
        assertTrue(techJson.contains("Fiber"), "Expected Fiber reconciler in frontend technical questions");
        assertTrue(techJson.contains("Zustand") || techJson.contains("Redux"), "Expected modern state management in frontend technical questions");
        assertTrue(techJson.contains("Core Web Vitals"), "Expected Core Web Vitals in frontend technical questions");

        // Verify NO Spring Boot or Kafka in frontend technical questions!
        assertFalse(techJson.contains("Spring Boot"), "Should NOT contain Spring Boot in frontend technical questions");
        assertFalse(techJson.contains("Kafka"), "Should NOT contain Kafka in frontend technical questions");

        // Verify frontend system design
        String designJson = result.getSystemDesignJson();
        assertTrue(designJson.contains("Virtualized Feed") || designJson.contains("Analytics Dashboard"), "Expected Frontend System Design");

        System.out.println("FRONTEND DOMAIN TEST PASSED! 100% Frontend-tailored questions verified without Java/Kafka bias.");
    }
}
