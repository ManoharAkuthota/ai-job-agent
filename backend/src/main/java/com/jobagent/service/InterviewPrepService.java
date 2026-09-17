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
        Job job = null;
        if (jobId != null) {
            job = jobRepository.findById(jobId).orElse(null);
        }
        if (job == null) {
            job = jobRepository.findAll().stream().findFirst().orElse(null);
        }
        if (job == null) {
            job = new Job();
            job.setId(jobId != null ? jobId : 1L);
            job.setTitle("Senior Java Full Stack Engineer");
            job.setCompany("Indian Tech Enterprise");
            job.setDescription("Design and build scalable microservices using Java, Spring Boot, Kafka, MySQL, and React.");
        }

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
        ResumeParserService.DomainCategory cat = ResumeParserService.categorizeDomain(jobTitle);
        if (cat == ResumeParserService.DomainCategory.GENERAL) {
            cat = ResumeParserService.categorizeDomain(domain + " " + (description != null ? description : ""));
        }

        List<Map<String, Object>> techList = new ArrayList<>();
        List<Map<String, Object>> starList = new ArrayList<>();
        Map<String, Object> systemDesign;

        if (cat == ResumeParserService.DomainCategory.FRONTEND) {
            // ----------------------------------------------------
            // FRONTEND TECHNICAL QUESTIONS (5 questions)
            // ----------------------------------------------------
            techList.add(Map.of(
                    "id", 1,
                    "topic", "React 18/19 & Concurrent Rendering (Fiber Engine)",
                    "question", "How does React's Fiber reconciler break render work into interruptible units, and how do useTransition and Suspense prevent UI freeze on high-scale web apps at " + company + "?",
                    "modelAnswer", "The Fiber reconciler models each element as a fiber node in a doubly-linked list tree. In Concurrent React, rendering is divided into two distinct phases: the asynchronous, interruptible render phase and the synchronous commit phase (DOM updates). useTransition marks state transitions as non-urgent, allowing the browser main thread to handle urgent user inputs (typing, clicks) while rendering continues in the background. Suspense coordinates asynchronous resource boundaries, preventing layout cascades by displaying declarative fallback skeletons until data resolves.",
                    "keyTakeaway", "Use useTransition to keep typing and micro-interactions responsive (sub-16ms) while deferring expensive list re-renders."
            ));

            techList.add(Map.of(
                    "id", 2,
                    "topic", "State Management & Re-Render Elimination",
                    "question", "When would you choose Zustand or Redux Toolkit over React Context API in complex web applications, and how do selector subscriptions eliminate unnecessary re-renders?",
                    "modelAnswer", "React Context is a dependency injection mechanism where any update to the provider's value triggers re-renders across all consumers, regardless of whether they consume the modified property. In contrast, Zustand and Redux Toolkit implement selector-based store subscriptions using useSyncExternalStore. Components only subscribe to specific slices of state (e.g., state => state.user.name); the store performs shallow equality checks and only notifies components when their selected slice actually changes. Zustand also avoids deep Provider component nesting.",
                    "keyTakeaway", "Never store high-frequency state in React Context; use selector-based stores (Zustand/Redux Toolkit) to isolate renders."
            ));

            techList.add(Map.of(
                    "id", 3,
                    "topic", "Web Performance & Core Web Vitals (LCP, INP, CLS)",
                    "question", "How do you systematically diagnose and optimize Core Web Vitals—specifically Largest Contentful Paint (LCP), Interaction to Next Paint (INP), and Cumulative Layout Shift (CLS)?",
                    "modelAnswer", "For LCP (target < 2.5s): Preload critical hero images via <link rel='preload'>, remove render-blocking scripts using defer/async, optimize fonts with font-display: swap, and serve next-gen AVIF/WebP formats with responsive srcset. For INP (target < 200ms): Break long tasks (>50ms) using requestIdleCallback, scheduler.yield(), or Web Workers, and debounce inputs with useTransition. For CLS (target < 0.1): Explicitly declare width/height or aspect-ratio on all images and embeds, reserve space for dynamic banners, and avoid inserting content above existing DOM elements.",
                    "keyTakeaway", "Audit using Chrome DevTools Performance panel; reserve layout dimensions and offload heavy JS tasks off the main thread."
            ));

            techList.add(Map.of(
                    "id", 4,
                    "topic", "JavaScript Event Loop, Closures & Memory Leaks",
                    "question", "Explain the execution order of the JavaScript Event Loop across Microtasks and Macrotasks, and how improper event listeners or closures cause SPA memory leaks.",
                    "modelAnswer", "The JS runtime executes synchronous code on the Call Stack. When the stack is empty, it completely drains the Microtask Queue (Promises, queueMicrotask, MutationObserver) before dequeuing a single Macrotask (setTimeout, setInterval, I/O, UI render). Memory leaks occur in SPAs when event listeners (window.addEventListener('resize')) or setInterval timers retain closures that reference unmounted component state or DOM elements, preventing garbage collection. Fix by always returning cleanup functions in useEffect, utilizing AbortController for fetch cancellations, and removing event listeners.",
                    "keyTakeaway", "Microtasks always execute before macrotasks; always clean up subscriptions, timers, and event listeners in useEffect cleanups."
            ));

            techList.add(Map.of(
                    "id", 5,
                    "topic", "Modern CSS Architecture & Responsive Engineering",
                    "question", "Compare CSS Grid vs Flexbox for complex layouts, and explain how Tailwind CSS or CSS Modules prevent specificity wars and bloated production bundles.",
                    "modelAnswer", "Flexbox is one-dimensional (row or column), best suited for distributing space and aligning elements along a single axis (navbars, cards, button groups). CSS Grid is two-dimensional (simultaneous rows and columns), perfect for page scaffolding, responsive card grids with repeat(auto-fit, minmax(280px, 1fr)), and overlapping layouts. Tailwind CSS purges unused styles during build via PostCSS, generating an ultra-lean fixed stylesheet (~15-25KB gzipped) regardless of project scale and eliminating CSS specificity conflicts (!important) and dead CSS rules. CSS Modules provide modular scope by hashing class names.",
                    "keyTakeaway", "Combine CSS Grid for page structure with Flexbox for component alignment, leveraging Tailwind for zero-runtime utility-first CSS."
            ));

            // FRONTEND BEHAVIORAL STAR QUESTIONS (3 questions)
            starList.add(Map.of(
                    "id", 1,
                    "competency", "Resolving UI Performance & Frozen Rendering Under High Load",
                    "question", "Tell me about a time when a web application UI suffered severe lag, frozen rendering, or memory leaks. How did you resolve it?",
                    "starAnswer", Map.of(
                            "situation", "During peak traffic at " + company + ", our product catalog web app experienced severe frame drops (down to 12 FPS) and frozen scrolling on mobile web browsers when users scrolled through extensive product feeds.",
                            "task", "As the Frontend Engineer, I was responsible for diagnosing the rendering freeze, eliminating frame stutter, and restoring smooth 60 FPS interactions across iOS and Android devices.",
                            "action", "I used Chrome DevTools Performance profiler to analyze flame charts, discovering excessive DOM node explosion (>15,000 nodes) and frequent recalculate-style thrashing. I implemented virtualized list rendering using react-window to render only the visible viewport items (~12 DOM nodes) and wrapped heavy computed filters in useMemo and useTransition.",
                            "result", "Memory consumption dropped by 74%, scroll frame rates stabilized at a consistent 60 FPS, and page load time dropped by 2.1 seconds, directly boosting user retention."
                    )
            ));

            starList.add(Map.of(
                    "id", 2,
                    "competency", "Bridging Design & Engineering / Technical Trade-offs",
                    "question", "Describe a situation where you had to negotiate design requirements or technical trade-offs with Product Designers or UX teams.",
                    "starAnswer", Map.of(
                            "situation", "Our UI design team proposed complex, nested glassmorphism blur filters and multiple simultaneous canvas micro-animations across an analytics table dashboard.",
                            "task", "I needed to preserve the premium aesthetic envisioned by design while preventing GPU memory throttling and lag on mid-range consumer laptops.",
                            "action", "I conducted a performance benchmark measuring GPU draw call overhead and presented an interactive prototype comparing CSS hardware-accelerated transforms (transform: translate3d) against heavy canvas blurs. I collaborated with the lead designer to create a design token system prioritizing motion on key focus elements while simplifying static table backgrounds.",
                            "result", "Delivered an interface that received 98% positive stakeholder feedback while maintaining sub-100ms interaction latency and zero dropped frames."
                    )
            ));

            starList.add(Map.of(
                    "id", 3,
                    "competency", "Refactoring Legacy Frontend & Modernizing Architecture",
                    "question", "Give an example of modernizing a legacy frontend codebase or adopting modern web standards without breaking existing user workflows.",
                    "starAnswer", Map.of(
                            "situation", "Our team inherited a legacy JavaScript codebase containing deeply nested class components and jQuery DOM manipulations that caused inconsistent state synchronization.",
                            "task", "Migrate the codebase incrementally to modern React functional components and TypeScript without pausing new product feature releases.",
                            "action", "I formulated a phased strangler migration plan: established strict TypeScript configs, created reusable atomic UI component primitives (Button, Modal, Card, Table), and progressively converted components from the bottom-up with unit tests using React Testing Library and Playwright E2E coverage.",
                            "result", "Successfully migrated 100% of core customer journeys over two sprints with zero production regression bugs, while reducing developer onboarding time from 3 weeks to 4 days."
                    )
            ));

            // FRONTEND SYSTEM DESIGN
            systemDesign = Map.of(
                    "title", "High-Performance Collaborative Real-Time Analytics Dashboard & Virtualized Feed for " + company,
                    "requirements", "Functional: Display thousands of real-time metrics, streaming updates via WebSockets, interactive filtering, responsive charts, offline viewing. Non-Functional: 60 FPS smooth scrolling, sub-100ms INP, sub-50KB initial JS chunk for above-the-fold, resilient offline recovery.",
                    "architectureOverview", "Modern Single Page App built with React and Next.js. The client uses an atomic state store (Zustand) synced with an in-browser WebSocket connection manager that buffers high-frequency updates using requestAnimationFrame. UI components utilize virtualized windowing (rendering only items visible in viewport). Service Workers cache critical shell assets and query responses via IndexedDB for instant offline recovery.",
                    "keyComponents", List.of(
                            "Component Architecture (Design System with accessible primitives & Tailwind CSS)",
                            "Virtualized Viewport Engine (Windowed rendering using react-window / TanStack Virtual)",
                            "State & Cache Layer (Zustand store with TanStack Query for server state and IndexedDB persistence)",
                            "Real-Time Event Streamer (WebSocket client with exponential backoff heartbeat and RAF batching)",
                            "Build & Delivery Pipeline (Vite / Next.js with route-based code-splitting, tree-shaking, and CDN edge caching)"
                    ),
                    "scalingBottlenecksAndMitigations", "1. High-frequency WebSocket message flooding: Mitigated by throttling incoming state updates to 60 FPS using requestAnimationFrame batches.\n2. DOM node bloat during infinite scrolling: Mitigated by virtualized DOM windowing keeping total DOM nodes under 50.\n3. Bundle size bloat: Mitigated by lazy loading heavy charting libraries with dynamic import() only when users open analytics views."
            );

        } else if (cat == ResumeParserService.DomainCategory.AI_ML) {
            // ----------------------------------------------------
            // AI / ML TECHNICAL QUESTIONS (5 questions)
            // ----------------------------------------------------
            techList.add(Map.of(
                    "id", 1,
                    "topic", "PyTorch Distributed Training & Backpropagation Mechanics",
                    "question", "How does PyTorch's autograd engine construct dynamic computation graphs, and how do you implement gradient accumulation and DistributedDataParallel (DDP) for large neural models at " + company + "?",
                    "modelAnswer", "PyTorch builds a Directed Acyclic Graph (DAG) on the fly during the forward pass where tensors with requires_grad=True track operations via grad_fn. During loss.backward(), the DAG is traversed in reverse to calculate gradients via the chain rule. DistributedDataParallel (DDP) spawns a separate process per GPU, avoiding Python GIL contention; each worker computes forward passes independently, and gradients are averaged across all GPUs using Ring-AllReduce collectives (NCCL). When GPU VRAM is constrained, gradient accumulation sums gradients across multiple mini-batches before executing optimizer.step() and optimizer.zero_grad(), simulating larger batch sizes without OOM errors.",
                    "keyTakeaway", "Prefer DDP over DataParallel for multi-GPU scaling; use gradient accumulation to decouple effective batch size from hardware VRAM limits."
            ));

            techList.add(Map.of(
                    "id", 2,
                    "topic", "Retrieval-Augmented Generation (RAG) & Hybrid Search",
                    "question", "Explain the architecture of an enterprise RAG system, and how do you mitigate retrieval hallucination using hybrid search and cross-encoder re-ranking?",
                    "modelAnswer", "Enterprise RAG converts unstructured text into chunks, computes dense vector embeddings (e.g., text-embedding-3-large), and stores them in an Approximate Nearest Neighbor (HNSW/IVFFlat) vector database. Dense semantic search often struggles with specific keywords, SKU numbers, or exact acronyms. Hybrid search combines dense vector similarity (Cosine/Dot Product) with sparse lexical search (BM25) using Reciprocal Rank Fusion (RRF). A secondary Cross-Encoder re-ranker (e.g., BGE-Reranker) scores candidate passages against the query to filter out irrelevant context before prompting the LLM. Guardrails (like NeMo Guardrails or hallucination classification heads) verify that generated tokens are grounded in the retrieved citations.",
                    "keyTakeaway", "Combine dense vector search with BM25 via Reciprocal Rank Fusion (RRF), followed by Cross-Encoder re-ranking to maximize grounding."
            ));

            techList.add(Map.of(
                    "id", 3,
                    "topic", "Python AsyncIO, GIL & High-Throughput Model Serving",
                    "question", "How does Python's Global Interpreter Lock (GIL) impact multi-threaded inference, and how do you architect FastAPI with Triton/TorchServe or ONNX Runtime for low-latency serving?",
                    "modelAnswer", "CPython's GIL permits only one thread to execute Python bytecode at a time, making CPU-bound Python multi-threading ineffective for parallel compute. In contrast, deep learning runtimes (PyTorch, ONNX Runtime, TensorRT) release the GIL during native C++ tensor operations. For high-concurrency microservices, use FastAPI running on Uvicorn with Gunicorn process workers to handle async I/O (network requests, request deserialization, token authentication). Offload model execution to dedicated inference engines like Triton Inference Server or ONNX Runtime with dynamic batching, which merges concurrent single requests into a single tensor batch to maximize GPU tensor core utilization.",
                    "keyTakeaway", "Use AsyncIO for non-blocking I/O and process workers or dedicated inference runtimes (Triton/ONNX) to bypass Python GIL bottlenecks."
            ));

            techList.add(Map.of(
                    "id", 4,
                    "topic", "Transformers, Attention Mechanisms & LoRA Parameter-Efficient Fine-Tuning",
                    "question", "Detail the computational complexity of Multi-Head Self-Attention, and explain how Low-Rank Adaptation (LoRA) reduces trainable parameter counts during fine-tuning.",
                    "modelAnswer", "Standard scaled dot-product attention computes softmax(QK^T / sqrt(d_k))V, which scales quadratically O(N^2) with sequence length N due to the N x N attention matrix. FlashAttention optimizes this by fusing kernel operations and tiling computations in GPU SRAM to eliminate slow HBM memory roundtrips. When fine-tuning massive LLMs (7B+ parameters), full parameter fine-tuning is computationally prohibitive. LoRA freezes pre-trained weight matrices W0 (d x k) and injects trainable rank-decomposition matrices A (d x r) and B (r x k), where rank r << min(d, k). The forward pass computes h = W0*x + (B*A)*x * (alpha/r), reducing trainable parameters by over 99% while maintaining model accuracy.",
                    "keyTakeaway", "LoRA decomposes weight updates into low-rank matrices (A and B), slashing GPU memory overhead during fine-tuning by up to 85%."
            ));

            techList.add(Map.of(
                    "id", 5,
                    "topic", "Model Observability, Concept Drift & Production Monitoring",
                    "question", "How do you detect covariate shift, concept drift, and data quality degradation in production machine learning pipelines?",
                    "modelAnswer", "Covariate shift occurs when input feature distributions P(X) shift over time while conditional probability P(Y|X) remains constant. Concept drift occurs when the underlying relationship between features and target labels P(Y|X) changes (e.g., consumer behavior shifts during economic fluctuations). Detect covariate shift by computing statistical distance metrics (Population Stability Index - PSI, Kolmogorov-Smirnov test, Wasserstein distance) on incoming inference feature streams compared to training baseline data. Monitor output prediction distributions and track latency percentiles (P95/P99). When PSI exceeds 0.25, automated triggers alert engineers or initiate automated re-training pipelines on newly labeled data windows.",
                    "keyTakeaway", "Calculate Population Stability Index (PSI) and Wasserstein distance on streaming features to trigger automated drift alerts."
            ));

            // AI BEHAVIORAL STAR QUESTIONS (3 questions)
            starList.add(Map.of(
                    "id", 1,
                    "competency", "Mitigating High Latency in Production LLM / AI Pipelines",
                    "question", "Tell me about a time an AI or Machine Learning model exhibited unacceptable latency or crashed under production traffic. How did you resolve it?",
                    "starAnswer", Map.of(
                            "situation", "Our Generative AI search service at " + company + " experienced P99 latency spikes exceeding 6.8 seconds during peak search volume, exhausting API worker threads.",
                            "task", "As the ML Engineer, I had to bring P99 latency below 800ms and eliminate out-of-memory worker crashes without compromising retrieval accuracy.",
                            "action", "I profiled the inference graph using PyTorch Profiler and discovered three bottlenecks: unbatched token embeddings, redundant cross-encoder calculations, and excessive prompt token length. I quantized the embedding model to INT8 using ONNX Runtime, enabled server-side dynamic batching on Triton Inference Server, and introduced a Redis semantic cache for frequent query embeddings.",
                            "result", "P99 inference latency dropped from 6,800ms to 410ms (a 94% reduction), GPU server utilization decreased by 40%, and throughput increased 5x with zero dropped queries."
                    )
            ));

            starList.add(Map.of(
                    "id", 2,
                    "competency", "Handling Severe Class Imbalance & Real-World Noisy Data",
                    "question", "Describe a situation where standard machine learning techniques failed due to severe class imbalance or noisy data.",
                    "starAnswer", Map.of(
                            "situation", "In our fraud detection pipeline, positive fraud cases represented less than 0.08% of total transactions, causing standard classifiers to achieve 99.9% dummy accuracy while failing to detect actual fraudulent attacks.",
                            "task", "I needed to construct a robust classification pipeline that maximized recall for fraud cases while maintaining acceptable precision.",
                            "action", "I replaced standard Cross-Entropy loss with Focal Loss to penalize hard misclassified examples, implemented SMOTE and adaptive under-sampling of majority classes, and engineered domain-specific velocity and behavioral delta features. I evaluated performance using Precision-Recall AUC (PR-AUC) rather than ROC-AUC.",
                            "result", "Fraud detection recall improved by 41% with a precision rate of 89%, directly saving the organization over ₹1.4 Crore in prevented unauthorized transactions."
                    )
            ));

            starList.add(Map.of(
                    "id", 3,
                    "competency", "Productionizing & Scaling Generative AI Systems",
                    "question", "Give an example of deploying a Generative AI application from experimental prototype to hardened production architecture.",
                    "starAnswer", Map.of(
                            "situation", "Our team developed a prototype RAG agent that answered customer support inquiries, but early internal testing revealed occasional hallucinations and slow responses.",
                            "task", "I was tasked with hardening the prototype into an enterprise-ready system with strict citation grounding, latency SLAs, and cost controls.",
                            "action", "I designed a multi-stage pipeline: chunking documents with semantic boundary awareness, indexing into a Milvus vector cluster, adding a cross-encoder re-ranking stage, and streaming LLM token responses via Server-Sent Events (SSE). I integrated LangSmith for end-to-end token tracing and cost attribution.",
                            "result", "Successfully launched the production agent handling 45,000 daily queries with a 98.4% grounded accuracy score and sub-1.2s time-to-first-token."
                    )
            ));

            // AI SYSTEM DESIGN
            systemDesign = Map.of(
                    "title", "High-Throughput Enterprise Generative AI & Semantic RAG Search Platform for " + company,
                    "requirements", "Functional: Process 10,000 queries/sec, index 50M enterprise documents with real-time updates, provide sub-second semantic search & grounded LLM answers with source citations. Non-Functional: 99.9% uptime, P95 latency < 600ms, token cost optimization, strict tenant data isolation.",
                    "architectureOverview", "Microservices architecture utilizing FastAPI and gRPC. Ingestion pipelines extract text, chunk with recursive boundary parsing, compute dense embeddings via GPU worker clusters, and index into a distributed Milvus vector database with HNSW indexes alongside an Elasticsearch BM25 cluster. Query requests pass through an API Gateway with semantic caching (Redis) to immediately return cached embeddings for identical queries. Uncached queries execute hybrid search (Dense + BM25) fused with Reciprocal Rank Fusion, followed by a BGE Cross-Encoder re-ranker, before streaming grounded token responses from an auto-scaling Triton LLM cluster.",
                    "keyComponents", List.of(
                            "Semantic Ingestion & Chunking Engine (Apache Kafka + PyTorch GPU embedding workers)",
                            "Distributed Hybrid Store (Milvus HNSW Vector Cluster + Elasticsearch BM25 cluster)",
                            "Semantic Cache & Deduplication Layer (Redis with vector similarity thresholding)",
                            "Hybrid Fusion & Cross-Encoder Re-ranker (BGE-Reranker model deployed on ONNX Runtime)",
                            "Inference Serving Layer (Triton Inference Server with TensorRT-LLM and vLLM PagedAttention)"
                    ),
                    "scalingBottlenecksAndMitigations", "1. GPU VRAM exhaustion during concurrent LLM inference: Mitigated using vLLM PagedAttention and continuous batching.\n2. Vector index rebuild latency: Mitigated by utilizing Milvus partition segments and background compaction.\n3. Embedding recomputation cost: Mitigated by Redis semantic cache saving up to 45% of redundant LLM embedding calls."
            );

        } else if (cat == ResumeParserService.DomainCategory.DEVOPS) {
            // ----------------------------------------------------
            // DEVOPS & CLOUD TECHNICAL QUESTIONS (5 questions)
            // ----------------------------------------------------
            techList.add(Map.of(
                    "id", 1,
                    "topic", "Kubernetes Architecture, Scheduling & CrashLoopBackOff Triage",
                    "question", "Describe how kube-scheduler assigns pods to worker nodes, and how do you systematically diagnose and resolve CrashLoopBackOff and OOMKilled errors in production at " + company + "?",
                    "modelAnswer", "The kube-scheduler filters nodes based on resource requests, taints, tolerations, and nodeAffinity (Filtering phase), then scores remaining nodes based on resource availability and spread constraints (Scoring phase) before binding the pod. CrashLoopBackOff indicates a container initiates, fails, and restarts with exponential backoff. Diagnose by running kubectl describe pod to inspect exit codes and events, and kubectl logs --previous to view pre-crash stdout/stderr. Exit Code 137 indicates OOMKilled (exceeded memory limit); resolve by profiling application heap/memory leaks or adjusting pod resource limits. Exit Code 1 indicates application runtime failure (missing environment variables, DB connection timeout).",
                    "keyTakeaway", "Always check exit codes (137 = OOM, 1 = app error) and use kubectl logs --previous to inspect pre-crash traces."
            ));

            techList.add(Map.of(
                    "id", 2,
                    "topic", "Terraform State Management, Locking & Drift Remediation",
                    "question", "How does Terraform track infrastructure state, why is remote state locking mandatory, and how do you detect and remediate state drift in automated CI/CD pipelines?",
                    "modelAnswer", "Terraform maps declarative HCL configuration to real-world cloud resources via terraform.tfstate. Remote backends (such as AWS S3 with DynamoDB state locking) are mandatory in team environments to prevent concurrent terraform apply executions from corrupting the state file. State drift occurs when engineers manually alter cloud resources via the console or CLI outside of Terraform. Detect drift by running terraform plan -refresh-only in scheduled CI pipelines. Remediate drift either by importing modified attributes back into HCL configuration or executing terraform apply to overwrite unauthorized manual changes and enforce the declared baseline.",
                    "keyTakeaway", "Always configure S3 + DynamoDB state locking and execute terraform plan in CI/CD to detect unauthorized drift."
            ));

            techList.add(Map.of(
                    "id", 3,
                    "topic", "Zero-Downtime Deployments: Blue/Green vs Canary Rollouts",
                    "question", "Compare Blue/Green vs Canary deployments in cloud-native Kubernetes environments, and explain how automated rollbacks are triggered via Prometheus metric thresholds.",
                    "modelAnswer", "Blue/Green deployment provisions an entirely separate identical environment (Green), validates health checks, and switches router/ingress traffic instantaneously from Blue to Green. Canary deployment routes a tiny fraction of production traffic (e.g., 5% via Istio Service Mesh or Argo Rollouts) to the new version, progressively increasing traffic as error budgets are verified. Automated rollbacks are configured via Prometheus metric analysis (e.g., HTTP 5xx rate > 0.5% or P99 latency > 300ms over a 5-minute evaluation window); if breached, the rollout controller immediately reroutes 100% of traffic back to the stable baseline without human intervention.",
                    "keyTakeaway", "Use Canary rollouts with Argo Rollouts and Prometheus metrics to auto-abort deployments if error budgets are violated."
            ));

            techList.add(Map.of(
                    "id", 4,
                    "topic", "Cloud-Native Security, Least-Privilege IAM & Secret Management",
                    "question", "How do you enforce least-privilege access in cloud Kubernetes clusters using AWS IAM Roles for Service Accounts (IRSA) and HashiCorp Vault?",
                    "modelAnswer", "Avoid hardcoding AWS access keys or mounting long-lived credentials inside containers. With AWS IRSA, Kubernetes service accounts associate with OpenID Connect (OIDC) identity provider metadata. When a pod initializes, the AWS STS service issues temporary, short-lived security tokens scoped exclusively to the IAM role attached to that specific pod service account. For application secrets (database passwords, API keys), utilize HashiCorp Vault or AWS Secrets Manager synced via External Secrets Operator, injecting secrets directly into in-memory Kubernetes secrets with automatic rotation, ensuring zero plaintext exposure in Git or container images.",
                    "keyTakeaway", "Adopt IRSA with OIDC for ephemeral IAM tokens, and use External Secrets Operator to avoid hardcoded credentials."
            ));

            techList.add(Map.of(
                    "id", 5,
                    "topic", "Distributed Observability: Prometheus, Grafana & High-Cardinality Alerting",
                    "question", "Explain the difference between metrics, logs, and traces. How do you design an alert strategy that prevents alert fatigue while maintaining high MTTR?",
                    "modelAnswer", "Metrics provide numeric aggregations over time (CPU, latency percentiles, error counts), logs offer granular textual event records with contextual stacks, and distributed tracing (OpenTelemetry/Jaeger) correlates individual requests across microservice hops using trace IDs. High-cardinality metrics (like appending user ID or IP address to Prometheus labels) cause memory explosion in TSDBs; keep Prometheus labels low-cardinality and query high-cardinality data via logs (Loki/Elasticsearch). Follow the Google SRE Four Golden Signals (Latency, Traffic, Errors, Saturation) for alerts, establishing Symptom-Based Alerting on SLO breaches rather than noisy cause-based alerts (e.g., alert on customer 5xx rate, not momentary CPU spikes).",
                    "keyTakeaway", "Base production alerts on user-facing SLO breaches (Golden Signals) rather than raw infrastructure utilization."
            ));

            // DEVOPS BEHAVIORAL STAR QUESTIONS (3 questions)
            starList.add(Map.of(
                    "id", 1,
                    "competency", "Managing High-Severity Cloud Outages & Production Recovery",
                    "question", "Tell me about a time a mission-critical cloud production environment suffered an outage. How did you restore services and conduct the post-mortem?",
                    "starAnswer", Map.of(
                            "situation", "A sudden traffic surge overwhelmed our ingress load balancers at " + company + ", triggering cascading connection timeouts across 40+ Kubernetes worker nodes.",
                            "task", "As the DevOps lead, I had to arrest the cascading failures, restore user traffic within 15 minutes, and eliminate the root failure vector.",
                            "action", "I declared a Sev-1 incident, scaled the node group capacity via Karpenter, enacted circuit breaker shed-limits on non-critical ingress endpoints, and purged blocked Redis connection pools. Once traffic stabilized, I led the blameless post-mortem, which revealed misconfigured Horizontal Pod Autoscaler (HPA) CPU thresholds and inadequate warm pool reserves.",
                            "result", "Full service restored in 11 minutes with zero data loss. Upgraded HPA to scale on custom request-rate metrics and provisioned predictive warm capacity, resulting in 99.99% availability during subsequent traffic surges."
                    )
            ));

            starList.add(Map.of(
                    "id", 2,
                    "competency", "Modernizing Infrastructure & Slashing Cloud Infrastructure Costs",
                    "question", "Describe an initiative where you migrated infrastructure or optimized cloud architecture to substantially reduce operational costs.",
                    "starAnswer", Map.of(
                            "situation", "Our monthly AWS cloud expenditure grew exponentially due to over-provisioned On-Demand EC2 instances and unutilized EBS storage volumes.",
                            "task", "I was tasked with reducing monthly cloud costs by at least 30% without impacting production performance or resilience.",
                            "action", "I audited resource utilization using AWS Cost Explorer and Datadog, introduced Karpenter for right-sizing node capacity, migrated 70% of stateless batch and dev workloads to AWS Spot instances with automated drain handling, and converted gp2 storage volumes to gp3 with automated lifecycle policies.",
                            "result", "Achieved a 43% reduction in monthly AWS infrastructure expenses (saving ₹22 Lakhs annually) while improving deployment velocity by 2x."
                    )
            ));

            starList.add(Map.of(
                    "id", 3,
                    "competency", "Automating CI/CD Pipelines & DevSecOps Shift-Left Integration",
                    "question", "Give an example of transforming a slow, fragile deployment pipeline into a secure, automated CI/CD engine.",
                    "starAnswer", Map.of(
                            "situation", "Our deployment process required manual SSH approvals and ran monolithic shell scripts that took over 75 minutes per release, causing frequent release failures.",
                            "task", "Design and build a fully automated, GitOps-driven deployment workflow with automated vulnerability scanning.",
                            "action", "I architected a GitHub Actions and ArgoCD GitOps pipeline with multi-stage Docker builds, integrated SonarQube and Trivy container security scanning to block critical CVEs before merge, and implemented automated semantic versioning and Helm chart releases.",
                            "result", "Deployment time plummeted from 75 minutes to under 8 minutes, deployment frequency increased from bi-weekly to 15+ automated releases daily, and zero vulnerable images reached production."
                    )
            ));

            // DEVOPS SYSTEM DESIGN
            systemDesign = Map.of(
                    "title", "Multi-Region, Highly Available Kubernetes Infrastructure & CI/CD Platform for " + company,
                    "requirements", "Functional: Host 150+ microservices handling 50,000 requests/sec, support multi-region active-active failover, automated blue/green releases, and unified observability. Non-Functional: 99.99% uptime, RTO < 5 minutes, RPO = 0, SOC-2 and ISO 27001 compliance.",
                    "architectureOverview", "Fully automated cloud infrastructure provisioned via Terraform and Terragrunt across multiple AWS regions. Workloads run on managed Kubernetes (EKS) with Karpenter just-in-time node provisioning. Traffic enters via Route 53 latency-based DNS routing with AWS CloudFront CDN and WAF, directing requests to regional Application Load Balancers. Services communicate across clusters via Cilium Service Mesh with eBPF network acceleration and mTLS encryption. Continuous delivery is orchestrated via ArgoCD GitOps, reading state from Git repositories and verifying deployments against Prometheus SLO metrics.",
                    "keyComponents", List.of(
                            "Infrastructure as Code (Terraform modular blueprints with S3 remote state and DynamoDB locking)",
                            "Orchestration & Autoscaling (Amazon EKS clusters with Karpenter and Horizontal Pod Autoscalers)",
                            "Traffic Ingress & Service Mesh (Route 53 latency routing, ALB Ingress Controller, Cilium eBPF mTLS mesh)",
                            "GitOps Continuous Delivery Engine (ArgoCD with Argo Rollouts for automated canary deployments)",
                            "Enterprise Observability Stack (Prometheus Agent fleet, Grafana Mimir for metrics, Loki for logs, Tempo for traces)"
                    ),
                    "scalingBottlenecksAndMitigations", "1. Node provisioning latency during sudden traffic spikes: Mitigated by Karpenter pre-warmed buffer pools and fast Bottlerocket OS boot times (<45s).\n2. Cross-region data sync latency: Mitigated by Amazon Aurora Global Database with sub-second replication.\n3. Prometheus TSDB memory exhaustion: Mitigated by utilizing Grafana Mimir distributed storage with compaction and retention tiers."
            );

        } else if (cat == ResumeParserService.DomainCategory.DATA) {
            // ----------------------------------------------------
            // DATA ENGINEERING TECHNICAL QUESTIONS (5 questions)
            // ----------------------------------------------------
            techList.add(Map.of(
                    "id", 1,
                    "topic", "Apache Spark Internals: Catalyst Optimizer & Shuffle Partition Tuning",
                    "question", "How does Apache Spark's Catalyst Optimizer transform logical plans into physical execution graphs, and how do you resolve shuffle data skew in massive joins at " + company + "?",
                    "modelAnswer", "Catalyst processes queries through four phases: Analysis (resolves relations/attributes against Catalog), Logical Optimization (applies rule-based optimizations like predicate pushdown, projection pruning), Physical Planning (generates multiple physical plans and selects lowest cost based on cost model), and Code Generation (compiles Java bytecode via Tungsten engine). Shuffle data skew occurs when uneven key distribution causes one or two executors to process 90% of data while others sit idle. Mitigate by enabling Adaptive Query Execution (AQE: spark.sql.adaptive.skewJoin.enabled=true), which dynamically splits skewed partitions at runtime, or manually apply salting by prefixing a random integer to the join key.",
                    "keyTakeaway", "Enable Adaptive Query Execution (AQE) and apply key salting to eliminate shuffle partition skew in large joins."
            ));

            techList.add(Map.of(
                    "id", 2,
                    "topic", "Delta Lake / Iceberg & ACID Lakehouse Architecture",
                    "question", "How do modern storage formats like Delta Lake or Apache Iceberg achieve ACID transactions and time travel on top of cloud object storage (S3/GCS)?",
                    "modelAnswer", "Traditional object stores like AWS S3 do not support atomic multi-file updates. Delta Lake introduces a transaction log (_delta_log JSON commits compacted into Parquet checkpoints) that acts as the single source of truth using Optimistic Concurrency Control (OCC). Writes are committed atomically by creating new Parquet data files and recording the commit in the log. If a conflict occurs, Delta Lake retries the transaction. Time travel is achieved by reading the log at a specific historical commit version, referencing immutable Parquet files preserved before OPTIMIZE VACUUM operations clean expired files.",
                    "keyTakeaway", "Delta Lake uses commit transaction logs and optimistic concurrency to guarantee ACID operations and time travel over S3 Parquet files."
            ));

            techList.add(Map.of(
                    "id", 3,
                    "topic", "Apache Airflow: DAG Idempotency, Backfills & Worker Scaling",
                    "question", "What makes an Apache Airflow DAG truly idempotent, and how do you configure Celery/KubernetesExecutors for reliable backfilling without overloading databases?",
                    "modelAnswer", "A DAG is idempotent if running it multiple times with the same execution_date produces the exact same outcome without duplicate records or side effects. Implement idempotency by utilizing atomic write-audit-publish patterns: write output to a temporary partition, verify record counts and schema constraints, then atomically swap or OVERWRITE the target table partition (INSERT OVERWRITE instead of plain INSERT). For worker execution, KubernetesExecutor spins up a dedicated pod per task instance, isolating task dependencies and memory footprints. Control concurrency during backfills by configuring max_active_runs and max_active_tasks_per_dag to prevent overwhelming source databases.",
                    "keyTakeaway", "Always use INSERT OVERWRITE with partition boundaries to make Airflow task runs completely idempotent."
            ));

            techList.add(Map.of(
                    "id", 4,
                    "topic", "Kafka Streaming & Exactly-Once Semantics in Distributed Ingestion",
                    "question", "How do you achieve end-to-end exactly-once processing (EOS) when moving data from Kafka into data lakehouses or downstream warehouses?",
                    "modelAnswer", "End-to-end EOS requires three coordinated components: 1) Idempotent & Transactional Kafka Producers (enable.idempotence=true, transactional.id configured) which prevent duplicate writes during network retries. 2) Kafka Streams / Flink with two-phase commit checkpointing (processing.guarantee=exactly_once_v2). 3) Idempotent destination sink: When writing to Delta Lake or Snowflake, utilize MERGE INTO statements based on business primary keys or maintain an offset commit tracking table in the destination, committing Kafka offsets and data writes in a single atomic transaction.",
                    "keyTakeaway", "Combine transactional Kafka producers with idempotent MERGE INTO statements at the destination sink."
            ));

            techList.add(Map.of(
                    "id", 5,
                    "topic", "Data Warehousing: Star Schema, Snowflake Clustering & Query Optimization",
                    "question", "How do you design data models for analytical queries in Snowflake, and how do clustering keys and materialized views eliminate micro-partition pruning bottlenecks?",
                    "modelAnswer", "Analytical warehouses prefer Dimensional Modeling (Star Schema with denormalized Fact and Conformed Dimension tables) to minimize complex multi-table joins. In Snowflake, data is automatically stored in compressed, columnar micro-partitions (50-500MB each). Snowflake uses metadata min/max values for partition pruning. For multi-terabyte tables queried on specific time ranges or tenant IDs, declare explicit Clustering Keys to physically align data on disk, drastically reducing the number of micro-partitions scanned. Materialized Views pre-compute expensive aggregations, updating automatically in the background via Snowflake serverless maintenance services.",
                    "keyTakeaway", "Define clustering keys on high-frequency query filter columns to maximize Snowflake micro-partition pruning."
            ));

            // DATA BEHAVIORAL STAR QUESTIONS (3 questions)
            starList.add(Map.of(
                    "id", 1,
                    "competency", "Handling Data Pipeline Breakage & Preventing Silent Corruption",
                    "question", "Tell me about a time a data pipeline broke or produced corrupted data. How did you identify the issue, backfill the data, and prevent recurrence?",
                    "starAnswer", Map.of(
                            "situation", "During an upstream microservice release at " + company + ", an undocumented schema change altered date formats, causing our overnight financial aggregation ETL to silently ingest null values.",
                            "task", "I had to detect the extent of corrupted historical records, restore accurate executive reporting, and build defensive data quality gates.",
                            "action", "I wrote an audit script isolating the affected partitions, reverted the downstream warehouse tables to the pre-release Delta Lake commit using time travel, and executed an idempotent Airflow backfill for the past 7 days. I then introduced Great Expectations automated schema validation as a mandatory blocking quality gate in our ingestion DAG.",
                            "result", "Cleaned and restored 100% of analytical reporting within 4 hours. Automated validation caught 14 subsequent schema mutations before reaching production tables."
                    )
            ));

            starList.add(Map.of(
                    "id", 2,
                    "competency", "Scaling Big Data Compute & Optimizing Infrastructure Costs",
                    "question", "Describe an experience optimizing an expensive or slow big data workload.",
                    "starAnswer", Map.of(
                            "situation", "A daily customer analytics Spark job took 4.5 hours to run and frequently crashed with OutOfMemory (OOM) errors during month-end traffic spikes.",
                            "task", "Optimize the Spark pipeline to complete in under 1 hour while reducing cloud compute cluster costs.",
                            "action", "I analyzed the Spark UI stages, finding a massive shuffle stage caused by a skewed groupBy on merchant ID. I implemented key salting, replaced expensive full shuffles with broadcast hash joins for static dimension tables, and switched storage to Parquet columnar format with snappy compression.",
                            "result", "Execution time dropped from 4.5 hours to 32 minutes (an 88% speedup), cluster size requirements dropped by 50%, saving ₹18 Lakhs annually."
                    )
            ));

            starList.add(Map.of(
                    "id", 3,
                    "competency", "Building Real-Time Streaming Capabilities",
                    "question", "Give an example of transitioning a batch-based processing system to real-time streaming.",
                    "starAnswer", Map.of(
                            "situation", "Business users had to wait 24 hours for daily batch reports to see inventory and order status, delaying operational fulfillment decisions.",
                            "task", "Design and launch a real-time event streaming pipeline delivering updates within 10 seconds of user activity.",
                            "action", "I architected an event pipeline using Kafka topics partitioned by region, consumed by a Spark Structured Streaming application that aggregated metrics across tumbling windows and wrote results continuously into Delta Lake tables.",
                            "result", "Reduced data availability latency from 24 hours to 8 seconds, enabling real-time inventory monitoring for operations teams."
                    )
            ));

            // DATA SYSTEM DESIGN
            systemDesign = Map.of(
                    "title", "Petabyte-Scale Real-Time Streaming & Delta Lakehouse Architecture for " + company,
                    "requirements", "Functional: Ingest 100M events/day from mobile apps, web, and microservices; provide real-time streaming analytics with <15s latency; provide ACID analytical warehouse querying with time travel. Non-Functional: Exactly-once delivery semantics, 99.99% data pipeline availability, automated schema evolution.",
                    "architectureOverview", "End-to-end modern Lakehouse architecture. Event producers publish to partitioned Apache Kafka clusters. Spark Structured Streaming ingests raw events, validates schemas, and writes Bronze raw tables in Delta Lake on AWS S3. A secondary processing tier cleanses, deduplicates, and enriches data into Silver tables with ACID guarantees. Scheduled dbt and Apache Airflow jobs aggregate business metrics into Gold marts in Snowflake and Delta Lake for BI dashboards and Machine Learning feature stores.",
                    "keyComponents", List.of(
                            "Distributed Ingestion Backbone (Apache Kafka clusters partitioned by customer and event type)",
                            "Streaming Compute Layer (Apache Spark Structured Streaming running on Kubernetes with checkpointing)",
                            "Lakehouse Storage Layer (Delta Lake / Apache Iceberg on Amazon S3 with Z-Order clustering)",
                            "Pipeline Orchestrator & Quality Gate (Apache Airflow with Great Expectations data contracts)",
                            "Analytical Serving & BI Mart (Snowflake data warehouse with clustering keys and Looker/PowerBI connections)"
                    ),
                    "scalingBottlenecksAndMitigations", "1. Small file problem in streaming writes: Mitigated by scheduled OPTIMIZE and Auto-Compaction jobs merging small files into 512MB chunks.\n2. Ingestion spike backpressure: Mitigated by Kafka partition scaling and dynamic executor allocation in Spark.\n3. Late-arriving event handling: Mitigated by watermarking windows allowing up to 1-hour late event reconciliation."
            );

        } else if (cat == ResumeParserService.DomainCategory.QA) {
            // ----------------------------------------------------
            // QA AUTOMATION & SDET TECHNICAL QUESTIONS (5 questions)
            // ----------------------------------------------------
            techList.add(Map.of(
                    "id", 1,
                    "topic", "Playwright vs Selenium Architecture & Flaky Test Elimination",
                    "question", "Compare the internal architecture of Playwright (CDP/BiDi protocol) vs Selenium WebDriver (HTTP JSON Wire), and how does auto-waiting eliminate flaky test executions at " + company + "?",
                    "modelAnswer", "Selenium WebDriver communicates over HTTP, sending individual REST calls to browser drivers (chromedriver), which poll the DOM and frequently fail with NoSuchElementException or StaleElementReferenceException when animations or network calls are active, requiring brittle Thread.sleep() or explicit waits. Playwright communicates over a single persistent WebSocket connection directly with browser binaries using the Chrome DevTools Protocol (CDP) and WebDriver BiDi. Playwright automatically performs actionability checks (element attached to DOM, visible, stable, receiving events, enabled) before executing clicks or fills. This native auto-waiting eliminates race conditions and flakiness without arbitrary sleeps.",
                    "keyTakeaway", "Playwright uses persistent WebSockets and built-in actionability checks to eliminate stale element exceptions and flaky sleeps."
            ));

            techList.add(Map.of(
                    "id", 2,
                    "topic", "Page Object Model (POM) & Component-Driven Test Framework Design",
                    "question", "How do you design a scalable, maintainable Page Object Model (POM) and Component Object Model in Java/TypeScript for high-velocity engineering teams?",
                    "modelAnswer", "A scalable POM encapsulates page locators and operational methods away from the test specification. Avoid bloated monolithic page classes by decomposing views into reusable Component Objects (e.g., NavbarComponent, TableComponent, ModalComponent, PaginationComponent). Tests interact with domain-level verbs (e.g., checkoutPage.submitPayment(cardDetails)) rather than raw locators. Use custom test fixtures or base classes that manage browser context isolation (fresh browser context per test) to prevent cross-test state contamination, and implement strong typing using TypeScript or Java PageFactory patterns.",
                    "keyTakeaway", "Break monolithic page objects into modular component primitives and enforce clean separation between locators and test assertions."
            ));

            techList.add(Map.of(
                    "id", 3,
                    "topic", "CI/CD Test Sharding & Parallel Grid Execution",
                    "question", "How do you configure test sharding and parallel containerized execution across multiple GitHub Actions or Jenkins workers to keep regression suites under 10 minutes?",
                    "modelAnswer", "Running tests sequentially creates massive build pipeline bottlenecks. In Playwright, sharding is natively supported via --shard=1/4 flags. In GitHub Actions, define a matrix strategy spanning multiple runners (e.g., 8 parallel workers). The test runner partitions tests deterministically based on test duration history or file paths. To maximize throughput, run tests headlessly in official Docker containers with pre-installed browser binaries, and upload merged HTML test reports and trace artifacts using test-results merge actions.",
                    "keyTakeaway", "Use matrix test sharding (--shard=N/M) across parallel CI/CD runners to cut regression test times by over 80%."
            ));

            techList.add(Map.of(
                    "id", 4,
                    "topic", "REST API Contract Testing & Microservice Mocking",
                    "question", "How do you implement API contract testing using RestAssured or Pact, and how do you isolate microservices during integration tests using WireMock?",
                    "modelAnswer", "Contract testing verifies that API providers and consumers adhere to agreed-upon request/response schemas (status codes, JSON payloads, data types) without deploying the entire ecosystem. With RestAssured, write fluent assertions against JSON Schema validators (matchesJsonSchemaInClasspath). With consumer-driven contract testing (Pact), consumers generate pact files that the provider verifies in CI. When testing microservices in isolation, utilize WireMock to stub external third-party dependencies (payment gateways, SMS providers) with deterministic HTTP response codes and network latency simulation.",
                    "keyTakeaway", "Validate API contracts using JSON Schema validators and isolate third-party dependencies with WireMock stubs."
            ));

            techList.add(Map.of(
                    "id", 5,
                    "topic", "Performance & Stress Testing: k6 / JMeter Concurrency Modeling",
                    "question", "How do you model realistic user traffic, virtual users (VUs), and ramp-up stages in load testing tools like k6 to uncover thread pool exhaustion and memory leaks?",
                    "modelAnswer", "In k6, scripts are written in modern JavaScript and executed by a Go runtime with minimal CPU overhead. Define stages (ramp-up from 0 to 1,000 VUs over 5 mins, soak at peak load for 30 mins, ramp-down over 5 mins). Model realistic user behavior by introducing randomized sleep pauses (think time: 1-3 seconds) between actions. Configure threshold assertions (e.g., http_req_duration: ['p(95)<300'], http_req_failed: ['rate<0.01']) which automatically fail CI builds if latency or error budgets are breached. Monitor server-side GC pauses, thread pool saturation, and DB connection limits during soak tests.",
                    "keyTakeaway", "Incorporate realistic think times and establish strict p(95) latency thresholds in k6 load testing stages."
            ));

            // QA BEHAVIORAL STAR QUESTIONS (3 questions)
            starList.add(Map.of(
                    "id", 1,
                    "competency", "Catching Critical Production Defect Before Release",
                    "question", "Tell me about a time your automated test suite or exploratory testing caught a severe bug right before a major production deployment.",
                    "starAnswer", Map.of(
                            "situation", "During final pre-release validation for an e-commerce flash sale at " + company + ", our automated checkout regression test suite failed intermittently on payment step 3.",
                            "task", "As SDET Lead, I had to investigate whether the failure was a test flakiness issue or a critical underlying software defect before sign-off.",
                            "action", "I pulled Playwright trace files and network HAR logs, discovering a race condition in asynchronous cart state updates where clicking 'Place Order' during currency re-calculation submitted an authorization request with an unvalidated zero-amount payload.",
                            "result", "Halted deployment, provided developers with exact reproduction steps and network traces. The bug was patched and re-verified, preventing massive financial vulnerability during the live sale."
                    )
            ));

            starList.add(Map.of(
                    "id", 2,
                    "competency", "Accelerating Release Cycles & Reducing Regression Test Duration",
                    "question", "Describe how you transformed a slow, manual QA cycle into a fast, automated testing pipeline.",
                    "starAnswer", Map.of(
                            "situation", "Our sprint releases were blocked by a 14-hour manual regression testing cycle across desktop and mobile browsers, delaying releases by up to 3 days per sprint.",
                            "task", "Build a scalable test automation framework that reduced release testing turnaround to under 20 minutes.",
                            "action", "I architected an automated Playwright framework in TypeScript, automated the top 120 critical user journeys, set up 8-way parallel CI sharding on GitHub Actions, and implemented automated Slack notifications with visual test failure screenshots.",
                            "result", "Reduced regression testing time from 14 hours to 16 minutes, enabled automated daily deployments, and improved team deployment confidence."
                    )
            ));

            starList.add(Map.of(
                    "id", 3,
                    "competency", "Fostering Quality Culture & Shift-Left Collaboration",
                    "question", "How do you collaborate with software engineers who view testing as solely the QA team's responsibility?",
                    "starAnswer", Map.of(
                            "situation", "Software engineers frequently pushed code changes with broken unit tests, expecting QA to catch all regressions during staging passes.",
                            "task", "Establish a shift-left testing culture where developers write resilient unit and integration tests prior to code review.",
                            "action", "I hosted engineering workshops on test-driven patterns, created shared testing component utilities and mocks, and configured pre-commit and PR validation checks that required passing unit and integration tests with >80% coverage before code could be merged.",
                            "result", "Defect leakage to staging dropped by 65%, pull request turnaround improved by 35%, and engineers embraced automated testing as part of their standard workflow."
                    )
            ));

            // QA SYSTEM DESIGN
            systemDesign = Map.of(
                    "title", "Distributed Multi-Platform Automated Quality Gate & Load Testing Grid for " + company,
                    "requirements", "Functional: Run 5,000+ automated E2E and API tests across multiple browsers (Chromium, Firefox, WebKit) in <10 minutes, provide automated trace reporting, support 10,000 VU load tests. Non-Functional: 99.9% test framework reliability, zero flaky false-positives, auto-retry mechanisms, deep CI/CD webhook integrations.",
                    "architectureOverview", "Cloud-native distributed test execution platform. Developers submit pull requests which trigger GitHub Actions orchestration workflows. Tests are partitioned across a dynamically scalable Dockerized Selenoid/Playwright worker cluster hosted on Kubernetes. Results and video traces stream to an Allure reporting portal and S3 artifact store. API integration tests validate schemas against mock WireMock servers, and automated k6 containers evaluate performance SLAs before promotion to production.",
                    "keyComponents", List.of(
                            "Test Orchestration Engine (GitHub Actions matrix runners with Playwright sharding)",
                            "Containerized Browser Execution Grid (Kubernetes EKS cluster auto-scaling headless browser containers)",
                            "API & Contract Testing Suite (RestAssured and WireMock mock microservices)",
                            "Performance & Concurrency Cluster (Distributed k6 runners executing load profiles)",
                            "Centralized Test Analytics Dashboard (Allure TestOps portal with automated flaky test classification)"
                    ),
                    "scalingBottlenecksAndMitigations", "1. Headless browser memory exhaustion: Mitigated by recycling browser contexts per test and capping worker concurrency per pod.\n2. Flaky network assertions: Mitigated by Playwright locator assertions with automated exponential retry loops.\n3. Large video trace storage: Mitigated by retaining video and trace artifacts only for failed test runs with 7-day S3 retention rules."
            );

        } else if (cat == ResumeParserService.DomainCategory.MOBILE) {
            // ----------------------------------------------------
            // MOBILE TECHNICAL QUESTIONS (5 questions)
            // ----------------------------------------------------
            techList.add(Map.of(
                    "id", 1,
                    "topic", "Modern Mobile Architecture: Jetpack Compose & Recomposition Optimization",
                    "question", "How does Jetpack Compose determine which composables to skip during recomposition, and how do you eliminate unnecessary UI recomposition in complex lists at " + company + "?",
                    "modelAnswer", "Jetpack Compose compares composable inputs using stability inferencing. A type is Stable if it is immutable or notifies Compose when its public properties change. If all inputs to a composable are unchanged and stable, Compose skips recomposition. Unnecessary recomposition happens when passing unstable types (like standard Kotlin List/Set or lambda functions that capture local variables). Fix by: 1) Using Kotlinx Immutable Collections (ImmutableList). 2) Marking model classes with @Immutable or @Stable. 3) Wrapping lambdas in remember or referencing method references. In LazyColumn, always specify a unique, stable key in items(items, key = { it.id }) so Compose moves rather than re-draws items during list re-ordering.",
                    "keyTakeaway", "Annotate models with @Immutable, use immutable collections, and always supply stable keys in LazyColumn."
            ));

            techList.add(Map.of(
                    "id", 2,
                    "topic", "Kotlin Coroutines, StateFlow & Structured Concurrency",
                    "question", "Explain Structured Concurrency in Kotlin Coroutines, and why StateFlow is preferred over LiveData in modern Android applications.",
                    "modelAnswer", "Structured concurrency guarantees that coroutines launched within a CoroutineScope are bound to the lifecycle of that scope (e.g., viewModelScope). If a scope is cancelled (when a user navigates away from a ViewModel), all child jobs are automatically cancelled, preventing memory leaks and background orphan operations. StateFlow is a Kotlin-native, state-holder observable Flow that is pure Kotlin (usable in Multiplatform KMP) and always holds an initial state. Unlike LiveData, which requires Android framework dependencies, StateFlow integrates cleanly with Flow operators (debounce, flatMapLatest, combine). When collecting StateFlow in Compose, use collectAsStateWithLifecycle to stop collection when the app is in the background.",
                    "keyTakeaway", "Use StateFlow with collectAsStateWithLifecycle to conserve battery and avoid updating UI when in the background."
            ));

            techList.add(Map.of(
                    "id", 3,
                    "topic", "Offline-First Synchronization & Room Database Architecture",
                    "question", "How do you architect an offline-first mobile application using Room DB, WorkManager, and conflict-resolution strategies?",
                    "modelAnswer", "In an offline-first architecture, the local database (Room) serves as the Single Source of Truth (SSOT). The UI observes Flow<List<Entity>> from Room. When users create data offline, writes occur locally with a pending_sync flag. WorkManager schedules background network synchronization with network constraints (Connected/Unmetered). To resolve conflicts between local edits and server updates, implement a Last-Write-Wins (LWW) strategy using server timestamps or a custom conflict resolution algorithm (e.g., merging non-conflicting fields). Upon successful sync, the local database is updated in a Room transaction, automatically triggering UI updates.",
                    "keyTakeaway", "Treat the local Room DB as the single source of truth and delegate background sync to WorkManager."
            ));

            techList.add(Map.of(
                    "id", 4,
                    "topic", "Mobile Memory Management, Bitmap Caching & ANR Prevention",
                    "question", "What causes Application Not Responding (ANR) errors on mobile devices, and how do you safely manage large bitmap memory allocations using Coil/Glide?",
                    "modelAnswer", "An ANR dialog triggers when the Android main thread (UI thread) is blocked for longer than 5 seconds (or 10 seconds for BroadcastReceivers). Causes include executing disk I/O, heavy JSON parsing, or network calls on Dispatchers.Main. Always switch intensive operations to Dispatchers.IO or Dispatchers.Default. For images, decoding full-resolution camera photos (e.g., 4000x3000) directly into memory causes OutOfMemory (OOM) crashes because each pixel consumes 4 bytes in ARGB_8888. Modern image libraries (Coil) downsample bitmaps to match the target ImageView dimensions using inSampleSize and maintain dual-layer LRU memory and disk caches.",
                    "keyTakeaway", "Never perform disk or network operations on Dispatchers.Main, and downsample bitmaps using Coil/Glide to avoid OOM crashes."
            ));

            techList.add(Map.of(
                    "id", 5,
                    "topic", "Mobile App Startup Time (Cold Start) Optimization",
                    "question", "How do you profile and optimize Cold Start latency in mobile applications using Android App Startup and Baseline Profiles?",
                    "modelAnswer", "A Cold Start occurs when the OS launches an app process from scratch (e.g., device reboot or process kill). Optimize by: 1) Minimizing initialization logic in Application.onCreate(); avoid blocking SDK setups by utilizing the Android App Startup library or initializing non-critical SDKs lazily in background threads. 2) Adopting Baseline Profiles, which pre-compile critical code paths (app startup, first screen render) into Ahead-Of-Time (AOT) machine code during app installation, bypassing slow Just-In-Time (JIT) runtime compilation. 3) Keeping splash screen layouts lightweight without heavy theme overdraws.",
                    "keyTakeaway", "Integrate Baseline Profiles to pre-compile startup paths into AOT machine code, cutting cold start latency by up to 35%."
            ));

            // MOBILE BEHAVIORAL STAR QUESTIONS (3 questions)
            starList.add(Map.of(
                    "id", 1,
                    "competency", "Fixing High Crash Rates & ANRs on Low-End Mobile Devices",
                    "question", "Tell me about a time a mobile app update caused severe crashes or ANRs on customer devices. How did you diagnose and resolve it?",
                    "starAnswer", Map.of(
                            "situation", "Following a new feature launch at " + company + ", our crash-free user rate plummeted from 99.8% to 94.1% on budget Android devices with under 3GB RAM.",
                            "task", "Diagnose the root cause, publish an emergency hotfix, and restore crash-free metrics above 99.5%.",
                            "action", "I investigated Firebase Crashlytics reports, which revealed OutOfMemory errors in our camera capture flow. Full-resolution images were being stored uncompressed in memory before upload. I refactored the image pipeline to downsample bitmaps using Coil to the viewport resolution and offloaded compression to Dispatchers.Default using coroutines.",
                            "result", "Released a hotfix within 24 hours; crash-free sessions recovered to 99.85%, and average app memory footprint dropped by 62%."
                    )
            ));

            starList.add(Map.of(
                    "id", 2,
                    "competency", "Delivering Smooth 60 FPS Mobile Interactions",
                    "question", "Describe an experience optimizing mobile UI render performance and eliminating frame drops.",
                    "starAnswer", Map.of(
                            "situation", "Users complained of sluggish scrolling and stuttering animations when navigating through our dynamic feed screen.",
                            "task", "Eliminate jank and ensure consistent 60 FPS scrolling across both high-refresh-rate and mid-range devices.",
                            "action", "I used Android Studio Profiler and Perfetto to inspect frame rendering times. I identified heavy recomposition loops in Compose caused by unstable list parameters. I applied @Immutable annotations to all feed UI models, memoized expensive date formatting, and configured stable keys in LazyColumn.",
                            "result", "Render times dropped below the 16ms frame budget, eliminating 99% of dropped frames and boosting app store ratings from 4.1 to 4.6."
                    )
            ));

            starList.add(Map.of(
                    "id", 3,
                    "competency", "Architecting Offline Resiliency Under Poor Connectivity",
                    "question", "Give an example of engineering mobile features that function seamlessly in areas with unreliable internet connectivity.",
                    "starAnswer", Map.of(
                            "situation", "Field delivery agents frequently lost internet connectivity in basements and rural zones, preventing them from recording order deliveries.",
                            "task", "Build a zero-downtime offline-first architecture that enabled agents to record updates offline and sync seamlessly when network recovered.",
                            "action", "I redesigned the data layer with Room database as the single source of truth, implemented an optimistic UI update model, and queued outbound sync actions in WorkManager with exponential backoff and battery-aware network constraints.",
                            "result", "100% of offline deliveries were recorded and synced successfully upon reconnection, eliminating manual delivery reconciliation overhead."
                    )
            ));

            // MOBILE SYSTEM DESIGN
            systemDesign = Map.of(
                    "title", "High-Performance Offline-First Mobile Application Architecture for " + company,
                    "requirements", "Functional: Support 5M daily active mobile users, provide instantaneous UI interactions, seamless offline-first caching, real-time push notifications, and biometric authentication. Non-Functional: Sub-1.2s cold start, 60 FPS rendering, <50MB APK size, 99.9% crash-free sessions.",
                    "architectureOverview", "Modern Clean Architecture with MVI (Model-View-Intent) pattern. The presentation layer is built with declarative UI (Jetpack Compose / Flutter). The domain layer encapsulates business use-cases, and the data layer implements the Repository pattern with Room/SQLite as the Single Source of Truth. Network requests flow through Retrofit/OkHttp with HTTP caching. Background sync is managed by WorkManager. Cryptographic authentication utilizes Android Keystore and biometric prompt APIs.",
                    "keyComponents", List.of(
                            "Declarative UI Layer (Jetpack Compose / Flutter with design tokens and smooth animations)",
                            "State Management (StateFlow & ViewModel with lifecycle-aware observation)",
                            "Local Persistence & Cache (Room SQLite DB with reactive Flow streams and SQLCipher encryption)",
                            "Background Synchronization (Android WorkManager with network and battery constraints)",
                            "Security & Networking Layer (Retrofit/OkHttp with certificate pinning and Android Keystore biometric auth)"
                    ),
                    "scalingBottlenecksAndMitigations", "1. Database lock contention during background sync: Mitigated by utilizing Room Write-Ahead Logging (WAL) mode.\n2. Cold start delays: Mitigated by Baseline Profiles and deferred SDK initializations.\n3. Excessive battery consumption from polling: Mitigated by migrating to Firebase Cloud Messaging (FCM) push triggers."
            );

        } else {
            // ----------------------------------------------------
            // BACKEND & JAVA FULL STACK QUESTIONS (5 questions)
            // ----------------------------------------------------
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

            // BACKEND BEHAVIORAL STAR QUESTIONS (3 questions)
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

            // BACKEND SYSTEM DESIGN
            systemDesign = Map.of(
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
        }

        InterviewPrep prep = new InterviewPrep();
        prep.setTechnicalQuestionsJson(objectMapper.writeValueAsString(techList));
        prep.setBehavioralQuestionsJson(objectMapper.writeValueAsString(starList));
        prep.setSystemDesignJson(objectMapper.writeValueAsString(systemDesign));
        return prep;
    }
}
