package com.jobagent.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jobagent.model.AgentSettings;
import com.jobagent.model.InterviewPrep;
import com.jobagent.model.Job;
import com.jobagent.model.UserProfile;
import com.jobagent.repository.AgentSettingsRepository;
import com.jobagent.repository.InterviewPrepRepository;
import com.jobagent.repository.JobRepository;
import com.jobagent.repository.UserProfileRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class InterviewPrepService {

    private final InterviewPrepRepository interviewPrepRepository;
    private final JobRepository jobRepository;
    private final UserProfileRepository profileRepository;
    private final AgentSettingsRepository settingsRepository;
    private final AiAgentService aiAgentService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public InterviewPrepService(InterviewPrepRepository interviewPrepRepository,
                                JobRepository jobRepository,
                                UserProfileRepository profileRepository,
                                AgentSettingsRepository settingsRepository,
                                AiAgentService aiAgentService) {
        this.interviewPrepRepository = interviewPrepRepository;
        this.jobRepository = jobRepository;
        this.profileRepository = profileRepository;
        this.settingsRepository = settingsRepository;
        this.aiAgentService = aiAgentService;
    }

    public InterviewPrep generateInterviewPrep(Long jobId) throws Exception {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new IllegalArgumentException("Job not found with ID: " + jobId));

        UserProfile profile = profileRepository.findAll().stream().findFirst().orElse(new UserProfile());
        AgentSettings settings = settingsRepository.findById(1L).orElse(new AgentSettings());

        String jobTitle = (job.getTitle() != null && !job.getTitle().isBlank()) ? job.getTitle() : "Software Engineer";
        String company = (job.getCompany() != null && !job.getCompany().isBlank()) ? job.getCompany() : "Target Company";
        String domain = (profile.getTargetDomain() != null && !profile.getTargetDomain().isBlank())
                ? profile.getTargetDomain() : "Java Full Stack & Microservices";

        // Try AI generation first if AI is available
        InterviewPrep generated = null;
        try {
            generated = tryAiInterviewPrepGeneration(job, profile, settings);
        } catch (Exception e) {
            System.err.println("AI Interview Prep generation failed or skipped: " + e.getMessage());
        }

        if (generated == null) {
            generated = generateRuleBasedInterviewPrep(jobTitle, company, domain, job.getDescription());
        }

        generated.setJobId(job.getId());
        generated.setJobTitle(jobTitle);
        generated.setCompany(company);
        generated.setTargetDomain(domain);

        return interviewPrepRepository.save(generated);
    }

    public List<InterviewPrep> getAllInterviewPreps() {
        return interviewPrepRepository.findAllByOrderByCreatedAtDesc();
    }

    public Optional<InterviewPrep> getInterviewPrepById(Long id) {
        return interviewPrepRepository.findById(id);
    }

    public Optional<InterviewPrep> getLatestByJobId(Long jobId) {
        return interviewPrepRepository.findFirstByJobIdOrderByCreatedAtDesc(jobId);
    }

    private InterviewPrep tryAiInterviewPrepGeneration(Job job, UserProfile profile, AgentSettings settings) {
        String provider = (settings.getAiProvider() != null) ? settings.getAiProvider().toUpperCase() : "AUTO";
        if ("RULE_BASED".equals(provider)) {
            return null;
        }

        String prompt = "You are an elite Senior Staff Tech Interviewer at " + job.getCompany() + ". "
                + "Generate a tailored technical interview kit for role: " + job.getTitle() + ".\n"
                + "Tech requirements: " + job.getDescription() + "\n"
                + "Candidate Skills: " + profile.getSkills() + "\n\n"
                + "Return a valid JSON object ONLY with three keys:\n"
                + "1. 'technical': array of 5 objects: [{\"id\": 1, \"topic\": \"Topic name\", \"question\": \"Detailed technical question\", \"modelAnswer\": \"Comprehensive senior-level answer\", \"keyTakeaway\": \"Key architectural takeaway\"}]\n"
                + "2. 'behavioral': array of 3 objects: [{\"id\": 1, \"competency\": \"Competency\", \"question\": \"Question\", \"starAnswer\": {\"situation\": \"...\", \"task\": \"...\", \"action\": \"...\", \"result\": \"...\"}}]\n"
                + "3. 'systemDesign': object: {\"title\": \"Scenario Title\", \"requirements\": \"Functional & non-functional requirements\", \"architectureOverview\": \"Overview\", \"keyComponents\": [\"Comp 1\", \"Comp 2\"], \"scalingBottlenecksAndMitigations\": \"Bottlenecks and how to mitigate them\"}\n"
                + "No markdown formatting or preamble, just raw JSON.";

        String aiResponse = aiAgentService.generateTextWithFallback(prompt, settings);
        if (aiResponse != null && !aiResponse.isBlank()) {
            try {
                String cleanJson = aiResponse.replaceAll("```json", "").replaceAll("```", "").trim();
                var root = objectMapper.readTree(cleanJson);
                if (root.has("technical") && root.has("behavioral") && root.has("systemDesign")) {
                    InterviewPrep prep = new InterviewPrep();
                    prep.setTechnicalQuestionsJson(objectMapper.writeValueAsString(root.get("technical")));
                    prep.setBehavioralQuestionsJson(objectMapper.writeValueAsString(root.get("behavioral")));
                    prep.setSystemDesignJson(objectMapper.writeValueAsString(root.get("systemDesign")));
                    return prep;
                }
            } catch (Exception e) {
                System.err.println("Failed to parse AI JSON for interview prep: " + e.getMessage());
            }
        }
        return null;
    }

    private InterviewPrep generateRuleBasedInterviewPrep(String jobTitle, String company, String domain, String description) throws Exception {
        // 1. Technical Questions (5 questions)
        List<Map<String, Object>> techList = new ArrayList<>();

        techList.add(Map.of(
                "id", 1,
                "topic", "Spring Boot & Transaction Management",
                "question", "How does Spring manage database transactions with @Transactional, and what causes transactional rollback failures or self-invocation issues?",
                "modelAnswer", "Spring uses AOP proxies around @Transactional methods. When a client calls the proxy, PlatformTransactionManager opens a database transaction. If the method completes normally, it commits; if an unchecked exception (RuntimeException or Error) occurs, it issues a rollback. Self-invocation fails because calling this.otherMethod() bypasses the Spring proxy. To fix it, inject the self-bean, extract to a separate helper service, or use AspectJ weaving.",
                "keyTakeaway", "Understand Spring AOP dynamic proxy mechanisms and specify rollbackFor = Exception.class when handling checked exceptions."
        ));

        techList.add(Map.of(
                "id", 2,
                "topic", "Apache Kafka & Event Streaming",
                "question", "In an event-driven microservices architecture at " + company + ", how do you guarantee at-least-once or exactly-once delivery with Kafka consumers?",
                "modelAnswer", "For at-least-once delivery, set enable.auto.commit=false and commit offsets synchronously or asynchronously after successful business processing. To achieve idempotent processing (effectively exactly-once semantics), combine consumer-side deduplication using an idempotent key stored in Redis or a relational unique index table, or enable Kafka transactional messaging (processing.guarantee=exactly_once_v2) with transactional producers and read_committed isolation on consumers.",
                "keyTakeaway", "Idempotency keys at the application database layer provide the most robust defense against duplicate consumer messages in distributed networks."
        ));

        techList.add(Map.of(
                "id", 3,
                "topic", "Spring Security & JWT Stateless Authentication",
                "question", "Explain the JWT authentication filter lifecycle in Spring Security 6, and how to safely implement token refresh without storing state in memory.",
                "modelAnswer", "In Spring Security 6, a custom OncePerRequestFilter intercepts requests, inspects the Authorization header for 'Bearer <token>', validates cryptographic signatures using HMAC or RSA public key, and loads user authorities into SecurityContextHolder. For token refresh without server session state, issue a short-lived access token (15 mins) and a cryptographically hashed, rotating refresh token stored with expiry in Redis or MySQL. Upon refresh, invalidate the old refresh token family if token reuse is detected.",
                "keyTakeaway", "Stateless authentication requires proper token rotation and blacklisting/invalidation strategies for security compliance."
        ));

        techList.add(Map.of(
                "id", 4,
                "topic", "Relational Database Optimization & Indexing",
                "question", "How do you diagnose and optimize slow MySQL queries experiencing deadlocks or full table scans under high concurrent read/write loads?",
                "modelAnswer", "Run EXPLAIN ANALYZE on slow queries to evaluate execution plans, check index selectivity, and eliminate temporary tables/filesorts. Create composite indexes covering frequently filtered (WHERE) and ordered (ORDER BY) columns following the Leftmost Prefix Rule. To prevent deadlocks, ensure transactions acquire locks in a consistent order across services, keep transaction scopes minimal, and utilize optimistic locking with @Version in JPA.",
                "keyTakeaway", "Always inspect execution plans with EXPLAIN ANALYZE and structure composite indexes to avoid filesorts."
        ));

        techList.add(Map.of(
                "id", 5,
                "topic", "React 19 & State Synchronization",
                "question", "How do you manage cross-component asynchronous state and prevent unnecessary re-renders in a modern React application?",
                "modelAnswer", "Use React Query / TanStack Query or native fetch with dedicated caching layers for server state, avoiding bloated global stores. Utilize useMemo and useCallback selectively for expensive calculations or callback props passed to memoized components (React.memo). For global client state, use lightweight stores like Concurrent React hooks or Context API scoped to specific subtree boundaries to avoid triggering root re-renders.",
                "keyTakeaway", "Decouple server cache (server state) from client UI state and minimize Context provider re-render cascade."
        ));

        // 2. Behavioral STAR Questions (3 questions)
        List<Map<String, Object>> starList = new ArrayList<>();

        starList.add(Map.of(
                "id", 1,
                "competency", "Handling Production Incidents Under High Pressure",
                "question", "Tell me about a time a critical microservice or API failed in production. How did you diagnose and resolve it?",
                "starAnswer", Map.of(
                        "situation", "During peak traffic at Keyanna Technologies, our CPaaS notification gateway began encountering sporadic HTTP 504 gateway timeouts and message delivery backlog.",
                        "task", "As the backend developer on call, I needed to identify the root cause immediately, stabilize the ingestion pipeline, and prevent data loss.",
                        "action", "I inspected centralized application logs and Prometheus metrics, discovering database connection pool starvation caused by unindexed subscriber lookups. I immediately scaled the connection pool, hot-deployed a database covering index, and throttled incoming Kafka consumer concurrency to allow the backlog to drain cleanly.",
                        "result", "Service latency dropped from 4,200ms to under 45ms within 10 minutes. Zero messages were lost, and I authored a post-mortem implementing circuit breakers and query timeout limits."
                )
        ));

        starList.add(Map.of(
                "id", 2,
                "competency", "Resolving Technical Disagreements in Engineering Teams",
                "question", "Describe a situation where you had a strong technical disagreement with a team member on architecture or design. How did you navigate it?",
                "starAnswer", Map.of(
                        "situation", "Our team was debating whether to adopt an asynchronous Kafka event-driven pipeline versus synchronous REST HTTP calls for cross-service communication in our job processing workflow.",
                        "task", "I needed to reach consensus on the architecture without causing friction or delaying our project milestone.",
                        "action", "Instead of arguing theoretical benefits, I built a lightweight benchmark comparing both architectures under a simulated load of 5,000 requests/second. The demo showed that the REST approach cascaded connection timeouts during downstream spikes, whereas Kafka buffered the bursts gracefully with zero dropped events.",
                        "result", "The team unanimously agreed on the event-driven architecture based on empirical data, and the system launched on schedule with 99.98% uptime."
                )
        ));

        starList.add(Map.of(
                "id", 3,
                "competency", "Rapid Learning & Adapting to New Technologies",
                "question", "Give an example of when you had to master an unfamiliar technology or framework within a tight deadline.",
                "starAnswer", Map.of(
                        "situation", "We needed to implement automated browser form submission and real-time dashboard UI within two weeks, requiring deep integration with Playwright and React 19.",
                        "task", "I had to learn Playwright's headless browser automation APIs and integrate them cleanly with our Spring Boot backend.",
                        "action", "I reviewed official Playwright documentation, set up a local sandbox, and implemented resilient CSS/XPath selector fallback logic with visual screenshot verification. I simultaneously structured clean REST endpoints for the React frontend.",
                        "result", "Delivered the end-to-end automation workflow 2 days ahead of schedule, enabling autonomous job tracking and verification."
                )
        ));

        // 3. System Design Challenge
        Map<String, Object> systemDesign = Map.of(
                "title", "High-Throughput CPaaS Notification & Job Alert Gateway",
                "requirements", "Functional: Ingest up to 20,000 notifications/sec, deliver via Email/SMS/Webhook, provide delivery receipt status. Non-Functional: 99.99% availability, max 500ms P99 latency, exactly-once delivery semantics for billing.",
                "architectureOverview", "Clients submit requests via API Gateway protected by JWT and Redis Token Bucket rate limiting. Ingestion microservices publish to partitioned Apache Kafka topics (grouped by priority & tenant). Worker consumers process batches, call third-party delivery providers with exponential backoff and circuit breakers (Resilience4j), and record delivery status in MySQL with Redis caching.",
                "keyComponents", List.of(
                        "Spring Cloud Gateway (Authentication, TLS Termination & Rate Limiting)",
                        "Apache Kafka (Partitioned Message Queues with 3x replication factor)",
                        "Worker Pool (Spring Boot Consumer fleet scaling horizontally with KEDA)",
                        "Redis Cluster (Deduplication cache & token bucket counters)",
                        "MySQL Cluster (Partitioned transactional logs & delivery audit history)"
                ),
                "scalingBottlenecksAndMitigations", "1. Third-party provider throttling: Mitigated via Redis Leaky Bucket rate limiters per downstream carrier.\n2. Database write contention: Mitigated by batching consumer inserts and offloading read queries to read replicas.\n3. Poison-pill messages: Routed to a Dead Letter Queue (DLQ) with automatic alert triggers after 3 failed retries."
        );

        InterviewPrep prep = new InterviewPrep();
        prep.setTechnicalQuestionsJson(objectMapper.writeValueAsString(techList));
        prep.setBehavioralQuestionsJson(objectMapper.writeValueAsString(starList));
        prep.setSystemDesignJson(objectMapper.writeValueAsString(systemDesign));
        return prep;
    }
}
