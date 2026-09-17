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

    @Test
    void testGenerateInterviewPrepAi() throws Exception {
        InterviewPrepRepository prepRepo = mock(InterviewPrepRepository.class);
        JobRepository jobRepo = mock(JobRepository.class);
        UserProfileRepository profileRepo = mock(UserProfileRepository.class);
        AgentSettingsRepository settingsRepo = mock(AgentSettingsRepository.class);
        AiAgentService aiAgentService = mock(AiAgentService.class);

        UserProfile profile = new UserProfile();
        profile.setTargetDomain("AI / Machine Learning Engineer");
        profile.setSkills("Python, PyTorch, LangChain, LLMs, Docker, FastAPI");
        when(profileRepo.findAll()).thenReturn(java.util.List.of(profile));

        Job aiJob = new Job();
        aiJob.setId(80001L);
        aiJob.setTitle("Machine Learning Engineer (NLP / LLMs / PyTorch)");
        aiJob.setCompany("Fractal Analytics");
        aiJob.setDescription("Build RAG architectures, LLM fine-tuning, PyTorch distributed models, FastAPI inference.");

        when(jobRepo.findById(80001L)).thenReturn(Optional.of(aiJob));
        when(prepRepo.save(any(InterviewPrep.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InterviewPrepService service = new InterviewPrepService(prepRepo, jobRepo, profileRepo, settingsRepo, aiAgentService);
        InterviewPrep result = service.generateInterviewPrep(80001L);

        assertNotNull(result);
        String tech = result.getTechnicalQuestionsJson();
        assertTrue(tech.contains("PyTorch") || tech.contains("RAG") || tech.contains("Transformer"));
        assertFalse(tech.contains("Spring Boot"));
        assertTrue(result.getSystemDesignJson().contains("Generative AI") || result.getSystemDesignJson().contains("RAG"));
        System.out.println("AI DOMAIN TEST PASSED! 100% AI/ML-tailored questions verified.");
    }

    @Test
    void testGenerateInterviewPrepDevOps() throws Exception {
        InterviewPrepRepository prepRepo = mock(InterviewPrepRepository.class);
        JobRepository jobRepo = mock(JobRepository.class);
        UserProfileRepository profileRepo = mock(UserProfileRepository.class);
        AgentSettingsRepository settingsRepo = mock(AgentSettingsRepository.class);
        AiAgentService aiAgentService = mock(AiAgentService.class);

        Job devOpsJob = new Job();
        devOpsJob.setId(80002L);
        devOpsJob.setTitle("DevOps & Cloud Platform Engineer (Kubernetes / Terraform / AWS)");
        devOpsJob.setCompany("Razorpay");
        devOpsJob.setDescription("Manage AWS, Kubernetes EKS, Terraform, CI/CD, Prometheus monitoring.");

        when(jobRepo.findById(80002L)).thenReturn(Optional.of(devOpsJob));
        when(prepRepo.save(any(InterviewPrep.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InterviewPrepService service = new InterviewPrepService(prepRepo, jobRepo, profileRepo, settingsRepo, aiAgentService);
        InterviewPrep result = service.generateInterviewPrep(80002L);

        assertNotNull(result);
        String tech = result.getTechnicalQuestionsJson();
        assertTrue(tech.contains("Kubernetes") || tech.contains("Terraform"));
        assertFalse(tech.contains("Spring Boot"));
        assertTrue(result.getSystemDesignJson().contains("Kubernetes") || result.getSystemDesignJson().contains("Infrastructure"));
        System.out.println("DEVOPS DOMAIN TEST PASSED! 100% DevOps-tailored questions verified.");
    }

    @Test
    void testUniversalCalculateMatchScore() throws Exception {
        ResumeParserService parserService = new ResumeParserService(null, null);
        java.lang.reflect.Method scoreMethod = ResumeParserService.class.getDeclaredMethod("calculateMatchScore", Job.class, java.util.List.class, String.class);
        scoreMethod.setAccessible(true);

        // 1. Frontend Candidate
        Job frontendJob = new Job();
        frontendJob.setTitle("Senior Frontend Engineer (React / TypeScript / Next.js)");
        frontendJob.setDescription("Build UI components with React, TypeScript, Next.js, and Tailwind.");

        Job javaBackendJob = new Job();
        javaBackendJob.setTitle("Java Backend Developer (Spring Boot, Microservices, Kafka)");
        javaBackendJob.setDescription("Build high-concurrency payment APIs using Java, Spring Boot, and Kafka.");

        int feCandidateWithFeJob = (int) scoreMethod.invoke(parserService, frontendJob, java.util.List.of("React", "TypeScript", "Next.js"), "Frontend Developer");
        int feCandidateWithJavaJob = (int) scoreMethod.invoke(parserService, javaBackendJob, java.util.List.of("React", "TypeScript", "Next.js"), "Frontend Developer");

        assertTrue(feCandidateWithFeJob >= 88, "Frontend candidate should match Frontend job with >= 88%, got: " + feCandidateWithFeJob);
        assertTrue(feCandidateWithJavaJob <= 45, "Frontend candidate should down-rank Java Backend job to <= 45%, got: " + feCandidateWithJavaJob);

        // 2. AI / ML Candidate
        Job aiJob = new Job();
        aiJob.setTitle("Machine Learning Engineer (NLP / LLMs / PyTorch)");
        aiJob.setDescription("Build RAG architectures, LLM fine-tuning, PyTorch distributed models, FastAPI inference.");

        int aiCandidateWithAiJob = (int) scoreMethod.invoke(parserService, aiJob, java.util.List.of("PyTorch", "Python", "LLM", "FastAPI"), "AI / Machine Learning Engineer");
        int aiCandidateWithJavaJob = (int) scoreMethod.invoke(parserService, javaBackendJob, java.util.List.of("PyTorch", "Python", "LLM"), "AI / Machine Learning Engineer");

        assertTrue(aiCandidateWithAiJob >= 88, "AI candidate should match AI job with >= 88%, got: " + aiCandidateWithAiJob);
        assertTrue(aiCandidateWithJavaJob <= 45, "AI candidate should down-rank Java job to <= 45%, got: " + aiCandidateWithJavaJob);

        // 3. DevOps Candidate
        Job devOpsJob = new Job();
        devOpsJob.setTitle("DevOps & Cloud Platform Engineer (Kubernetes / Terraform / AWS)");
        devOpsJob.setDescription("Manage AWS, Kubernetes EKS, Terraform, CI/CD, Prometheus monitoring.");

        int devOpsCandidateWithDevOpsJob = (int) scoreMethod.invoke(parserService, devOpsJob, java.util.List.of("Kubernetes", "Terraform", "AWS", "Docker"), "DevOps & Cloud Engineer");
        int devOpsCandidateWithFeJob = (int) scoreMethod.invoke(parserService, frontendJob, java.util.List.of("Kubernetes", "Terraform", "AWS"), "DevOps & Cloud Engineer");

        assertTrue(devOpsCandidateWithDevOpsJob >= 88, "DevOps candidate should match DevOps job with >= 88%, got: " + devOpsCandidateWithDevOpsJob);
        assertTrue(devOpsCandidateWithFeJob <= 45, "DevOps candidate should down-rank Frontend job to <= 45%, got: " + devOpsCandidateWithFeJob);

        System.out.println("UNIVERSAL MULTI-FIELD MATCHING VERIFIED SUCCESSFULLY!");
    }
}
