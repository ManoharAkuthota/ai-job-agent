import React, { useState, useEffect } from 'react';
import { getJobs, generateInterviewPrep, getInterviewPreps } from '../services/api';
import {
  Code, Users, Layers, Zap, ChevronDown, ChevronUp,
  GraduationCap, Sparkles, Lightbulb, RefreshCw, CheckCircle2,
  Building, MapPin, AlertCircle
} from 'lucide-react';

const FALLBACK_JOBS = [
  // Frontend Roles
  { id: 70001, title: 'Senior Frontend Engineer (React / TypeScript / Next.js)', company: 'Razorpay' },
  { id: 70002, title: 'Frontend Software Development Engineer (React, Redux, Web Performance)', company: 'Swiggy' },
  { id: 70003, title: 'UI / Frontend Software Engineer (React / Tailwind / Web Vitals)', company: 'Zepto' },
  { id: 70004, title: 'Frontend Developer - Web Platforms (React, Next.js)', company: 'Flipkart' },
  // AI / Machine Learning Roles
  { id: 80001, title: 'Machine Learning Engineer (NLP / LLMs / PyTorch)', company: 'Fractal Analytics' },
  { id: 80002, title: 'AI / GenAI Applied Engineer (Python / LangChain / VectorDB)', company: 'Swiggy' },
  { id: 80003, title: 'Machine Learning Engineer (Deep Learning & Recommendation Systems)', company: 'Jio Platforms' },
  { id: 80004, title: 'AI Systems & LLM Engineer (Python / FastAPI / Docker)', company: 'Yellow.ai' },
  // DevOps & Cloud Roles
  { id: 80011, title: 'DevOps & Cloud Platform Engineer (Kubernetes / Terraform / AWS)', company: 'Razorpay' },
  { id: 80012, title: 'Site Reliability Engineer / SRE (Kubernetes / Prometheus / Linux)', company: 'Groww' },
  { id: 80013, title: 'Cloud Infrastructure & DevOps Engineer (AWS / Docker / Terraform)', company: 'Paytm' },
  { id: 80014, title: 'DevOps & Infrastructure Automation Engineer', company: 'Zepto' },
  // Data Engineering Roles
  { id: 80021, title: 'Data Engineer (Apache Spark / Airflow / Delta Lakehouse)', company: 'Flipkart' },
  { id: 80022, title: 'Big Data & Streaming Pipeline Engineer (Kafka / Spark / Snowflake)', company: 'PhonePe' },
  { id: 80023, title: 'Data Engineer (Python / SQL / Snowflake / AWS)', company: 'Zomato' },
  // QA Automation & SDET Roles
  { id: 80031, title: 'SDET / Senior QA Automation Engineer (Playwright / Java / CI/CD)', company: 'Swiggy' },
  { id: 80032, title: 'QA Automation Engineer (Selenium / TestNG / API Automation)', company: 'CRED' },
  { id: 80033, title: 'Software Development Engineer in Test (SDET - Mobile & Web)', company: 'Meesho' },
  // Mobile Roles
  { id: 80041, title: 'Android Engineer (Kotlin / Coroutines / Jetpack Compose)', company: 'Zomato' },
  { id: 80042, title: 'Mobile Application Developer (Flutter / React Native / Mobile)', company: 'Zepto' },
  // Java Backend & Full Stack Roles
  { id: 90003, title: 'Backend Software Development Engineer (Java / Microservices)', company: 'Zepto' },
  { id: 60015, title: 'Java Web Developer (Microservices & Spring Boot)', company: 'Zoho Corporation' },
  { id: 60016, title: 'Backend Developer (Java, Spring Boot, MySQL, Redis)', company: 'CRED' },
  { id: 60006, title: 'Backend Software Engineer (Java, Kafka, Spring Boot)', company: 'PhonePe' },
  { id: 60001, title: 'Java Full Stack Developer (React & Spring Cloud)', company: 'Cognizant India' },
  { id: 60012, title: 'Software Engineer - Core Banking & Payments (Java / Spring)', company: 'Paytm' },
  { id: 180001, title: 'Full Stack Engineer (Java, Spring Boot, React)', company: 'LTI Mindtree' }
];

const generateLocalPrepKit = (jobId, targetJob) => {
  const job = targetJob || FALLBACK_JOBS.find(j => j.id == jobId) || FALLBACK_JOBS[0];
  const role = job.title || 'Software Engineer';
  const company = job.company || 'Enterprise Tech';

  const roleLower = role.toLowerCase();
  const isAi = roleLower.includes('ai') || roleLower.includes('machine learning') || roleLower.includes('ml ') || roleLower.includes('deep learning') || roleLower.includes('llm') || roleLower.includes('nlp');
  const isDevops = roleLower.includes('devops') || roleLower.includes('cloud') || roleLower.includes('sre') || roleLower.includes('infrastructure') || roleLower.includes('kubernetes');
  const isData = roleLower.includes('data') || roleLower.includes('spark') || roleLower.includes('snowflake') || roleLower.includes('airflow') || roleLower.includes('etl');
  const isQa = roleLower.includes('qa') || roleLower.includes('sdet') || roleLower.includes('test');
  const isMobile = roleLower.includes('mobile') || roleLower.includes('android') || roleLower.includes('ios') || roleLower.includes('flutter');
  const isFrontend = (roleLower.includes('front') || roleLower.includes('react') || roleLower.includes('ui') || roleLower.includes('web developer')) && !isMobile && !isDevops && !isQa;

  let technical = [];
  let behavioral = [];
  let systemDesign = null;

  if (isFrontend) {
    technical = [
      {
        id: 1,
        question: `How does React's Fiber reconciler break render work into interruptible units, and how do useTransition and Suspense prevent UI freeze on high-scale web apps at ${company}?`,
        expectedAnswer: "The Fiber reconciler models each element as a fiber node in a doubly-linked tree. In Concurrent React, rendering is divided into two phases: an asynchronous interruptible render phase and a synchronous commit phase (DOM mutations). useTransition marks state transitions as non-urgent, allowing the browser main thread to process urgent typing/click events while rendering continues in the background. Suspense coordinates asynchronous resource boundaries to prevent layout cascades.",
        difficulty: "HARD",
        focusArea: "React 18/19 & Concurrent Engine",
        proTip: "Use useTransition to keep typing sub-16ms responsive while deferring large filtered list recalculations."
      },
      {
        id: 2,
        question: `When would you choose Zustand or Redux Toolkit over React Context API in complex web applications at ${company}, and how do selector subscriptions eliminate unnecessary re-renders?`,
        expectedAnswer: "React Context is a dependency injection mechanism where any provider update triggers re-renders across all consumers. Zustand and Redux Toolkit implement selector-based store subscriptions (useSyncExternalStore). Components subscribe only to specific state slices (e.g., state => state.user.avatar), and shallow equality checks ensure re-renders occur strictly when the selected reference changes.",
        difficulty: "MEDIUM",
        focusArea: "State Architecture & Performance",
        proTip: "Never store high-frequency state in React Context; use selector-based stores to isolate render trees."
      },
      {
        id: 3,
        question: "How do you systematically diagnose and optimize Core Web Vitals—specifically Largest Contentful Paint (LCP), Interaction to Next Paint (INP), and Cumulative Layout Shift (CLS)?",
        expectedAnswer: "For LCP (target < 2.5s): Preload hero images with <link rel='preload'>, eliminate render-blocking scripts with defer/async, and serve responsive AVIF/WebP. For INP (target < 200ms): Break long tasks (>50ms) using requestIdleCallback, scheduler.yield(), or Web Workers, and debounce inputs with useTransition. For CLS (target < 0.1): Declare width/height on all media and reserve layout space for dynamic elements.",
        difficulty: "HARD",
        focusArea: "Web Performance & Core Web Vitals",
        proTip: "Audit using Chrome DevTools Performance panel and Lighthouse; always reserve container dimensions."
      },
      {
        id: 4,
        question: "Explain the execution order of the JavaScript Event Loop across Microtasks and Macrotasks, and how improper event listeners or closures cause SPA memory leaks.",
        expectedAnswer: "The Call Stack executes synchronous code. When empty, it completely drains the Microtask Queue (Promises, queueMicrotask) before picking one Macrotask (setTimeout, setInterval, UI render). Memory leaks happen in SPAs when window event listeners or timers retain closures to unmounted component state or DOM nodes. Fix by always returning cleanup functions in useEffect and using AbortController.",
        difficulty: "HARD",
        focusArea: "JavaScript Runtime & Memory",
        proTip: "Microtasks always execute before macrotasks; always clean up DOM listeners and subscriptions in useEffect returns."
      },
      {
        id: 5,
        question: "Compare CSS Grid vs Flexbox for complex responsive layouts, and explain how Tailwind CSS or CSS Modules prevent specificity wars and bloated production bundles.",
        expectedAnswer: "Flexbox is one-dimensional (row/column) for aligning elements along a single axis. CSS Grid is two-dimensional for overall page scaffolding and responsive auto-fit card grids. Tailwind purges unused CSS at build time via PostCSS, producing a compact stylesheet (~15-20KB gzipped) and eliminating CSS specificity conflicts (!important). CSS Modules solve scoping via local class hashing.",
        difficulty: "MEDIUM",
        focusArea: "Modern CSS & Tailwind Architecture",
        proTip: "Combine CSS Grid for page structure with Flexbox for internal component alignment."
      }
    ];

    behavioral = [
      {
        id: 1,
        situation: `During peak traffic at ${company}, our product catalog web app experienced severe frame drops (down to 12 FPS) and frozen scrolling on mobile browsers during long list rendering.`,
        task: "I was tasked with identifying the rendering bottleneck and restoring smooth 60 FPS interactions across mobile devices.",
        action: "I profiled the application using Chrome DevTools, replaced unbounded DOM rendering with virtualized windowing (react-window) to keep DOM nodes under 15, and deferred heavy search filtering using useTransition.",
        result: "Reduced memory usage by 74%, restored 60 FPS scrolling, and reduced page load by 2.1 seconds.",
        competency: "Performance Engineering & Problem Solving"
      },
      {
        id: 2,
        situation: "Our design team requested complex, nested glassmorphism blurs and multiple simultaneous micro-animations across an analytics table.",
        task: "Preserve the high-craft aesthetic without causing GPU thermal throttling or UI latency on consumer devices.",
        action: "Built an interactive prototype measuring draw call overhead, presented hardware-accelerated CSS alternatives (transform: translate3d), and collaborated on a shared design token system.",
        result: "Delivered an interface with 98% stakeholder approval and zero dropped frames.",
        competency: "Design & Engineering Collaboration"
      },
      {
        id: 3,
        situation: "Inherited a legacy frontend containing mixed class components and manual jQuery DOM mutations with frequent state synchronization bugs.",
        task: "Modernize to React 19 functional components and TypeScript without blocking ongoing feature development.",
        action: "Designed an incremental strangler migration plan, established reusable atomic UI primitives, and migrated bottom-up with automated Jest and Playwright tests.",
        result: "Migrated 100% of core customer journeys over two sprints with zero production regression defects.",
        competency: "Architecture Modernization & Code Quality"
      }
    ];

    systemDesign = {
      title: `High-Performance Collaborative Real-Time Analytics Dashboard for ${company}`,
      requirements: [
        "Display thousands of real-time metrics with sub-100ms INP and 60 FPS scroll performance",
        "WebSocket streaming connection with reconnection backoff and RAF throttling",
        "Virtualized viewport rendering (react-window) keeping active DOM nodes under 50",
        "Offline viewing capability with Service Worker and IndexedDB query caching"
      ],
      architecture: [
        "Component Design System with accessible Radix primitives and Tailwind CSS",
        "Zustand atomic state store combined with TanStack Query for cache invalidation",
        "In-browser WebSocket connection manager batching incoming updates via requestAnimationFrame",
        "Vite / Next.js build pipeline with route-based code-splitting and sub-50KB initial bundles"
      ],
      keyTradeoffs: "Chose atomic Zustand selectors over React Context to isolate high-frequency WebSocket updates from triggering full dashboard tree re-renders."
    };
  } else if (isAi) {
    technical = [
      {
        id: 1,
        question: `How does PyTorch's autograd engine construct dynamic computation graphs, and how do you implement gradient accumulation and DistributedDataParallel (DDP) for large models at ${company}?`,
        expectedAnswer: "PyTorch constructs a dynamic Directed Acyclic Graph (DAG) during the forward pass. DDP runs separate processes per GPU, communicating via Ring-AllReduce collectives (NCCL) to bypass the Python GIL. Gradient accumulation computes gradients across multiple mini-batches before calling optimizer.step(), allowing large effective batch sizes without exceeding GPU VRAM.",
        difficulty: "HARD",
        focusArea: "PyTorch & Distributed Training",
        proTip: "Always prefer DistributedDataParallel over DataParallel to bypass the Python GIL."
      },
      {
        id: 2,
        question: `Explain the architecture of an enterprise RAG system, and how do you mitigate retrieval hallucinations using hybrid search and cross-encoder re-ranking at ${company}?`,
        expectedAnswer: "Enterprise RAG converts documents into chunks and stores dense embeddings in vector databases (Milvus/Pinecone). Hybrid search fuses dense semantic search with sparse lexical search (BM25) using Reciprocal Rank Fusion (RRF). A secondary Cross-Encoder re-ranks candidate passages to filter irrelevant context before passing citations to the LLM.",
        difficulty: "HARD",
        focusArea: "Generative AI & RAG Architecture",
        proTip: "Cite Reciprocal Rank Fusion and Cross-Encoder re-ranking to demonstrate production RAG expertise."
      },
      {
        id: 3,
        question: "How does Python's GIL impact multi-threaded inference, and how do you architect FastAPI with Triton/TorchServe or ONNX Runtime for low-latency serving?",
        expectedAnswer: "CPython's GIL restricts execution to one thread at a time, making CPU Python multithreading ineffective for parallel compute. PyTorch and ONNX Runtime release the GIL during native tensor operations. High-throughput architectures use FastAPI for async I/O and offload model execution to Triton Inference Server with dynamic batching.",
        difficulty: "HARD",
        focusArea: "AsyncIO & High-Throughput Serving",
        proTip: "Use dynamic batching in Triton to maximize GPU tensor core saturation."
      },
      {
        id: 4,
        question: "Detail the computational complexity of Multi-Head Self-Attention, and explain how LoRA fine-tunes large foundation models efficiently.",
        expectedAnswer: "Standard scaled dot-product attention scales quadratically O(N^2) with sequence length N due to the N x N attention matrix. FlashAttention optimizes this using GPU SRAM tiling. LoRA freezes original weights W0 and introduces low-rank decomposition matrices A (d x r) and B (r x k) where r << d, slashing trainable parameters by >99%.",
        difficulty: "HARD",
        focusArea: "Transformers & LoRA Fine-Tuning",
        proTip: "Mention that FlashAttention eliminates high-bandwidth memory (HBM) IO bottlenecks."
      },
      {
        id: 5,
        question: "How do you detect covariate shift, concept drift, and data quality degradation in production machine learning pipelines?",
        expectedAnswer: "Covariate shift is a change in input distribution P(X), while concept drift is a change in target relationship P(Y|X). Compute statistical metrics like Population Stability Index (PSI) and Wasserstein distance on incoming inference features against training baselines to trigger automated re-training alerts.",
        difficulty: "MEDIUM",
        focusArea: "MLOps & Model Monitoring",
        proTip: "A PSI > 0.25 typically triggers automated alerting and model re-training."
      }
    ];

    behavioral = [
      {
        id: 1,
        situation: `Our Generative AI search service at ${company} experienced P99 latency spikes exceeding 6.8 seconds during peak search volume.`,
        task: "Bring P99 latency below 800ms and eliminate worker memory crashes without compromising retrieval accuracy.",
        action: "Quantized the embedding model to INT8 with ONNX Runtime, enabled server-side dynamic batching on Triton Inference Server, and introduced a Redis semantic cache for query embeddings.",
        result: "P99 latency dropped from 6.8s to 410ms (a 94% reduction), and throughput increased 5x.",
        competency: "AI Performance & Optimization"
      },
      {
        id: 2,
        situation: "In our fraud detection model, positive fraud cases represented under 0.08% of total transactions, causing standard classifiers to fail.",
        task: "Construct a robust classification pipeline maximizing recall for fraudulent attacks while maintaining high precision.",
        action: "Replaced standard cross-entropy loss with Focal Loss, applied SMOTE with adaptive sampling, and evaluated performance via PR-AUC rather than ROC-AUC.",
        result: "Fraud recall improved by 41% with 89% precision, directly preventing over ₹1.4 Crore in unauthorized transactions.",
        competency: "Handling Real-World Data Constraints"
      },
      {
        id: 3,
        situation: "Our team developed a prototype customer service RAG agent that suffered from occasional hallucinations and slow token streaming.",
        task: "Hardening the prototype into an enterprise-ready system with strict citation grounding and latency SLAs.",
        action: "Implemented semantic chunking, indexed into Milvus, added a cross-encoder re-ranker, and streamed tokens via Server-Sent Events (SSE) with LangSmith tracing.",
        result: "Launched the production agent handling 45,000 daily queries with 98.4% grounded accuracy and sub-1.2s time-to-first-token.",
        competency: "Productionizing Generative AI"
      }
    ];

    systemDesign = {
      title: `High-Throughput Enterprise Generative AI & Semantic RAG Search Platform for ${company}`,
      requirements: [
        "Process 10,000 queries/second with sub-600ms P95 latency",
        "Index 50M enterprise documents with real-time updates and strict tenant isolation",
        "Hybrid search (Dense HNSW + BM25) fused with Reciprocal Rank Fusion",
        "Grounded token streaming with source citations and hallucination guardrails"
      ],
      architecture: [
        "Kafka ingestion pipeline with GPU workers parsing and chunking documents",
        "Distributed Milvus vector cluster paired with Elasticsearch BM25 cluster",
        "Redis semantic cache for query embedding deduplication",
        "Triton Inference Server running TensorRT-LLM and vLLM PagedAttention for token streaming"
      ],
      keyTradeoffs: "Chose vLLM PagedAttention and dynamic batching over dedicated static model replicas to cut GPU cloud hosting costs by 45%."
    };
  } else if (isDevops) {
    technical = [
      {
        id: 1,
        question: `Describe how kube-scheduler assigns pods to worker nodes, and how do you systematically diagnose and resolve CrashLoopBackOff and OOMKilled errors at ${company}?`,
        expectedAnswer: "kube-scheduler filters nodes based on resource requests, taints, and affinity, then scores them to select the optimal node. CrashLoopBackOff means a container failed and restarts with exponential backoff. Diagnose via kubectl describe pod and kubectl logs --previous. Exit Code 137 indicates OOMKilled (exceeded memory limit); Exit Code 1 indicates application startup or configuration failure.",
        difficulty: "HARD",
        focusArea: "Kubernetes Internals & Triage",
        proTip: "Check exit code: 137 = OOMKilled, 1 = application exception; use kubectl logs --previous to view pre-crash logs."
      },
      {
        id: 2,
        question: `How does Terraform track infrastructure state, why is remote state locking mandatory, and how do you detect and remediate state drift in automated CI/CD pipelines at ${company}?`,
        expectedAnswer: "Terraform maps declarative HCL configuration to real cloud resources via terraform.tfstate. Remote state backends (like AWS S3 with DynamoDB locking) prevent concurrent terraform apply executions from corrupting state. Detect drift by running terraform plan -refresh-only in CI/CD, and remediate by applying HCL to enforce declared baseline.",
        difficulty: "MEDIUM",
        focusArea: "Terraform & State Management",
        proTip: "Never apply changes manually in the cloud console; enforce all changes via S3 + DynamoDB locked pipelines."
      },
      {
        id: 3,
        question: "Compare Blue/Green vs Canary deployments in cloud-native Kubernetes environments, and explain how automated rollbacks are triggered via Prometheus metric thresholds.",
        expectedAnswer: "Blue/Green provisions an identical environment and flips 100% traffic at the router level. Canary routes a tiny percentage (e.g., 5%) via Istio/Argo Rollouts, progressively increasing traffic while checking error budgets. Automated rollbacks trigger if Prometheus metric queries (e.g., 5xx rate > 0.5% or P99 latency > 300ms) breach thresholds.",
        difficulty: "HARD",
        focusArea: "Zero-Downtime Releases & GitOps",
        proTip: "Use Argo Rollouts with AnalysisTemplates linked directly to Prometheus metrics."
      },
      {
        id: 4,
        question: "How do you enforce least-privilege access in cloud Kubernetes clusters using AWS IAM Roles for Service Accounts (IRSA) and HashiCorp Vault?",
        expectedAnswer: "With AWS IRSA, Kubernetes service accounts associate with OpenID Connect (OIDC) metadata. AWS STS issues short-lived security tokens scoped exclusively to that specific pod's service account. Application secrets are injected from HashiCorp Vault or AWS Secrets Manager via External Secrets Operator, avoiding hardcoded credentials.",
        difficulty: "MEDIUM",
        focusArea: "Cloud Security & Secrets Management",
        proTip: "Never store AWS keys in container images or environment variables; use IRSA and OIDC."
      },
      {
        id: 5,
        question: "Explain the difference between metrics, logs, and traces. How do you design an alert strategy that prevents alert fatigue while maintaining high MTTR?",
        expectedAnswer: "Metrics provide numerical aggregations over time, logs provide detailed contextual events, and traces follow requests across microservice hops. High-cardinality labels cause TSDB memory exhaustion in Prometheus. Follow Google SRE Golden Signals (Latency, Traffic, Errors, Saturation) for symptom-based alerts on SLO breaches rather than noisy cause-based alerts.",
        difficulty: "HARD",
        focusArea: "Observability & SRE",
        proTip: "Alert on user-facing symptoms (high error rate, high P99) rather than high CPU spikes."
      }
    ];

    behavioral = [
      {
        id: 1,
        situation: `A sudden traffic spike overwhelmed ingress load balancers at ${company}, triggering cascading failures across 40+ Kubernetes worker nodes.`,
        task: "Arrest the cascading outages, restore traffic within 15 minutes, and eliminate the root failure cause.",
        action: "Scaled node groups via Karpenter, enacted circuit breaker rate limits on non-essential ingress routes, purged blocked connection pools, and upgraded HPA to scale on custom request-rate metrics.",
        result: "Restored full service in 11 minutes with zero data loss, achieving 99.99% availability during subsequent flash events.",
        competency: "Incident Management & Cloud SRE"
      },
      {
        id: 2,
        situation: "Monthly AWS cloud expenditures grew by 55% due to over-provisioned On-Demand instances and idle storage volumes.",
        task: "Reduce monthly infrastructure expenses by at least 30% without impacting application performance.",
        action: "Audited utilization with AWS Cost Explorer, introduced Karpenter for right-sizing, migrated 70% of stateless workloads to Spot instances with automated drain handling, and upgraded storage to gp3.",
        result: "Achieved a 43% reduction in monthly AWS bills (saving ₹22 Lakhs annually) while doubling deployment velocity.",
        competency: "Cloud Cost Optimization"
      },
      {
        id: 3,
        situation: "The deployment process required manual SSH steps and ran shell scripts that took 75 minutes per release with frequent failures.",
        task: "Build a fully automated GitOps deployment workflow with security scanning.",
        action: "Architected GitHub Actions and ArgoCD GitOps pipelines with multi-stage Docker builds, integrated SonarQube and Trivy security scanners, and automated Helm chart rollouts.",
        result: "Deployment time dropped from 75 minutes to under 8 minutes, enabling 15+ automated releases daily.",
        competency: "CI/CD & DevSecOps Automation"
      }
    ];

    systemDesign = {
      title: `Multi-Region, Highly Available Kubernetes Cloud Platform for ${company}`,
      requirements: [
        "Host 150+ microservices handling 50,000 requests/second with active-active failover",
        "Automated GitOps continuous delivery with canary verification and sub-5s rollback",
        "Zero-trust network architecture with Cilium eBPF mTLS encryption",
        "Centralized Prometheus/Grafana observability with 99.99% uptime SLA"
      ],
      architecture: [
        "Terraform modular blueprints with S3 remote state and DynamoDB locking",
        "Amazon EKS clusters with Karpenter just-in-time autoscaling and Bottlerocket OS",
        "Route 53 latency routing with CloudFront CDN, AWS WAF, and ALB Ingress Controllers",
        "ArgoCD GitOps pipeline with Prometheus metric verification gates"
      ],
      keyTradeoffs: "Chose Cilium eBPF over standard iptables kube-proxy to eliminate network latency bottlenecks at 50,000 req/sec."
    };
  } else if (isData) {
    technical = [
      {
        id: 1,
        question: `How does Apache Spark's Catalyst Optimizer transform logical plans into physical execution graphs, and how do you resolve shuffle data skew in massive joins at ${company}?`,
        expectedAnswer: "Catalyst passes queries through Analysis, Logical Optimization (predicate pushdown), Physical Planning, and Code Generation (Tungsten). Shuffle data skew happens when uneven key distribution causes one executor to take 90% of data. Mitigate by enabling Adaptive Query Execution (AQE: spark.sql.adaptive.skewJoin.enabled=true) or applying key salting.",
        difficulty: "HARD",
        focusArea: "Spark Internals & Optimization",
        proTip: "Enable AQE in Spark 3+ and use Broadcast Hash Joins for dimension tables."
      },
      {
        id: 2,
        question: `How do modern storage formats like Delta Lake or Apache Iceberg achieve ACID transactions and time travel on top of cloud object storage at ${company}?`,
        expectedAnswer: "Delta Lake uses a transaction log (_delta_log JSON commits compacted into Parquet checkpoints) with Optimistic Concurrency Control (OCC). Writes are committed atomically by adding Parquet files and recording the commit. Time travel reads historical transaction log versions.",
        difficulty: "HARD",
        focusArea: "Lakehouse Storage & Delta Lake",
        proTip: "Explain how ACID logs allow simultaneous batch reads and streaming writes on S3."
      },
      {
        id: 3,
        question: "What makes an Apache Airflow DAG truly idempotent, and how do you configure worker executors for reliable backfilling?",
        expectedAnswer: "A DAG is idempotent if executing it multiple times with the same execution_date produces the exact same outcome. Use INSERT OVERWRITE or atomic partition swapping. KubernetesExecutor spins up an isolated pod per task instance to avoid dependency conflicts.",
        difficulty: "MEDIUM",
        focusArea: "Airflow Orchestration & Idempotency",
        proTip: "Never use plain INSERT into warehouse tables in scheduled Airflow DAGs; use partition overwrites."
      },
      {
        id: 4,
        question: "How do you achieve end-to-end exactly-once processing (EOS) when streaming data from Kafka into data lakehouses or downstream warehouses?",
        expectedAnswer: "Enable idempotent/transactional Kafka producers (enable.idempotence=true), configure checkpointing in Spark Structured Streaming / Flink, and write to destination tables using idempotent MERGE INTO statements based on business primary keys.",
        difficulty: "HARD",
        focusArea: "Real-Time Streaming & Exactly-Once",
        proTip: "Idempotent MERGE INTO at the sink provides the strongest defense against duplicate delivery."
      },
      {
        id: 5,
        question: "How do you design data models for analytical queries in Snowflake, and how do clustering keys eliminate micro-partition pruning bottlenecks?",
        expectedAnswer: "Dimensional Modeling (Star Schema) minimizes multi-table joins. Snowflake stores data in columnar micro-partitions (50-500MB). Explicit clustering keys physically co-locate rows on disk for high-frequency filter columns, drastically reducing the number of micro-partitions scanned.",
        difficulty: "MEDIUM",
        focusArea: "Snowflake & Analytical Warehousing",
        proTip: "Define clustering keys on high-cardinality query filter columns to accelerate analytical scans."
      }
    ];

    behavioral = [
      {
        id: 1,
        situation: `An undocumented upstream schema change caused our financial aggregation ETL at ${company} to silently ingest null values.`,
        task: "Detect corrupted historical records, restore accurate executive reporting, and establish defensive quality gates.",
        action: "Isolated affected partitions, reverted warehouse tables using Delta Lake time travel, executed an idempotent Airflow backfill, and added Great Expectations schema validation as a mandatory blocking gate.",
        result: "Restored 100% of executive reporting within 4 hours; automated validation caught 14 subsequent schema mutations before production.",
        competency: "Data Integrity & Root Cause Analysis"
      },
      {
        id: 2,
        situation: "A daily customer analytics Spark job took 4.5 hours and frequently failed with OutOfMemory errors during month-end traffic peaks.",
        task: "Optimize the Spark pipeline to finish in under 1 hour while reducing compute cluster costs.",
        action: "Identified a severe shuffle skew on merchant ID, implemented key salting, replaced full shuffles with broadcast hash joins for dimension tables, and switched to Parquet format with snappy compression.",
        result: "Runtime dropped from 4.5 hours to 32 minutes (88% speedup), saving ₹18 Lakhs annually.",
        competency: "Big Data Compute Optimization"
      },
      {
        id: 3,
        situation: "Business users had to wait 24 hours for batch reports to see inventory and order status, delaying critical decisions.",
        task: "Design and launch a real-time event streaming pipeline delivering updates within 10 seconds of user activity.",
        action: "Architected an event pipeline with partitioned Kafka topics consumed by Spark Structured Streaming, aggregating metrics across tumbling windows into Delta Lake tables.",
        result: "Cut data latency from 24 hours to 8 seconds, enabling real-time inventory visibility for fulfillment teams.",
        competency: "Real-Time Streaming Architecture"
      }
    ];

    systemDesign = {
      title: `Petabyte-Scale Real-Time Streaming & Delta Lakehouse Platform for ${company}`,
      requirements: [
        "Ingest 100M events/day with <15s latency and exactly-once processing semantics",
        "ACID lakehouse storage with time travel and automated schema evolution",
        "Interactive BI queries with sub-3s response on multi-billion row tables",
        "Automated data quality validation and SLA alerting via Airflow"
      ],
      architecture: [
        "Partitioned Apache Kafka streaming cluster for raw event ingestion",
        "Spark Structured Streaming writing Bronze raw tables to Amazon S3 Delta Lake",
        "Cleansed and enriched Silver tables with ACID transactions and Z-Order indexing",
        "Snowflake analytical warehouse and Looker dashboards for business reporting"
      ],
      keyTradeoffs: "Chose Delta Lake on S3 over raw Parquet to enable ACID transactions, time travel, and concurrent write safety."
    };
  } else if (isQa) {
    technical = [
      {
        id: 1,
        question: `Compare the internal architecture of Playwright (CDP/BiDi protocol) vs Selenium WebDriver (HTTP JSON Wire), and how does auto-waiting eliminate flaky test executions at ${company}?`,
        expectedAnswer: "Selenium communicates over HTTP REST calls to browser drivers, requiring brittle Thread.sleep() or polling. Playwright connects over a single persistent WebSocket using Chrome DevTools Protocol (CDP) and WebDriver BiDi. Playwright automatically verifies actionability (visible, stable, receiving events) before clicking, eliminating flaky race conditions.",
        difficulty: "HARD",
        focusArea: "Playwright vs Selenium Architecture",
        proTip: "Playwright auto-waits for actionability checks, eliminating the need for arbitrary sleep statements."
      },
      {
        id: 2,
        question: `How do you design a scalable Page Object Model (POM) and Component Object Model in Java/TypeScript for high-velocity teams at ${company}?`,
        expectedAnswer: "Decompose monolithic page objects into modular Component Objects (NavbarComponent, TableComponent, ModalComponent). Tests interact with high-level user actions rather than raw locators. Use isolated browser contexts per test to prevent cross-test state leaks.",
        difficulty: "MEDIUM",
        focusArea: "Test Framework Design & POM",
        proTip: "Separate page locators from business assertions and create reusable component primitives."
      },
      {
        id: 3,
        question: "How do you configure test sharding and parallel containerized execution across multiple CI/CD workers to keep regression suites under 10 minutes?",
        expectedAnswer: "Use Playwright native sharding (--shard=1/4) combined with GitHub Actions matrix runners. Run tests headlessly in official Docker containers with pre-installed browser binaries, and merge HTML reports and traces at the end of the pipeline.",
        difficulty: "MEDIUM",
        focusArea: "CI/CD Test Sharding & Parallel Grids",
        proTip: "Matrix sharding across 8-16 runners cuts test execution times from hours to minutes."
      },
      {
        id: 4,
        question: "How do you implement API contract testing using RestAssured or Pact, and how do you isolate microservices during integration tests using WireMock?",
        expectedAnswer: "Contract testing verifies API request/response schemas with JSON Schema validators. Consumer-driven contracts (Pact) ensure providers don't break consumers. WireMock stubs third-party external dependencies with deterministic HTTP status codes and latency simulations.",
        difficulty: "HARD",
        focusArea: "API Automation & Contract Testing",
        proTip: "Use WireMock to stub payment gateways and SMS APIs to test error handling and edge cases."
      },
      {
        id: 5,
        question: "How do you model realistic user traffic, virtual users (VUs), and ramp-up stages in load testing tools like k6 to uncover bottlenecks?",
        expectedAnswer: "In k6, define stages (ramp-up to 1,000 VUs over 5 mins, soak for 30 mins, ramp-down). Include randomized sleep think-times (1-3s). Configure threshold assertions (http_req_duration: ['p(95)<300']) that automatically fail CI builds if latency SLAs are breached.",
        difficulty: "MEDIUM",
        focusArea: "Performance & Load Testing (k6)",
        proTip: "Always include randomized think-times to model realistic human browsing behavior."
      }
    ];

    behavioral = [
      {
        id: 1,
        situation: `During final pre-release testing for a flash sale at ${company}, our automated regression suite caught a race condition on payment checkout.`,
        task: "Determine whether the failure was test flakiness or a genuine software defect before production sign-off.",
        action: "Inspected Playwright trace files and network HAR logs, uncovering an asynchronous state bug where clicking 'Place Order' during currency re-calculation submitted an authorization request with an unvalidated zero amount.",
        result: "Halted the deployment, provided developers with exact traces; defect was patched, preventing severe financial vulnerability during the live sale.",
        competency: "Critical Defect Discovery & Quality Gate"
      },
      {
        id: 2,
        situation: "Sprint releases were held up by a 14-hour manual regression cycle across browsers, delaying releases by up to 3 days per sprint.",
        task: "Build an automated testing framework reducing release turnaround to under 20 minutes.",
        action: "Architected a Playwright TypeScript framework, automated top 120 critical journeys, configured 8-way parallel CI sharding on GitHub Actions, and automated Slack notifications with failure screenshots.",
        result: "Reduced regression testing from 14 hours to 16 minutes, enabling automated daily production deployments.",
        competency: "Automation ROI & Cycle Time Reduction"
      },
      {
        id: 3,
        situation: "Engineers frequently pushed code with broken unit tests, expecting QA to catch all bugs in staging passes.",
        task: "Establish a shift-left quality culture where developers write resilient unit and integration tests before review.",
        action: "Conducted testing workshops, created shared testing component utilities and mocks, and enforced PR validation gates requiring passing tests with >80% coverage.",
        result: "Defect leakage to staging dropped by 65%, and pull request turnaround improved by 35%.",
        competency: "Shift-Left Quality Leadership"
      }
    ];

    systemDesign = {
      title: `Distributed Multi-Platform Automated Quality Gate & Load Testing Grid for ${company}`,
      requirements: [
        "Execute 5,000+ automated E2E and API tests across Chromium, Firefox, WebKit in <10 minutes",
        "Zero flaky test false-positives with automatic retry and trace recording",
        "Automated API contract testing with WireMock dependency isolation",
        "Scalable 10,000 VU load testing cluster integrated into CI/CD"
      ],
      architecture: [
        "GitHub Actions matrix runners with Playwright parallel sharding",
        "Dockerized browser execution grid auto-scaling headless containers on Kubernetes",
        "RestAssured and WireMock API contract testing suite",
        "Distributed k6 load testing cluster and Allure TestOps reporting portal"
      ],
      keyTradeoffs: "Chose Playwright over Selenium for native auto-waiting and WebSocket performance, eliminating flaky false-positive build failures."
    };
  } else if (isMobile) {
    technical = [
      {
        id: 1,
        question: `How does Jetpack Compose determine which composables to skip during recomposition, and how do you eliminate unnecessary UI recomposition in complex lists at ${company}?`,
        expectedAnswer: "Compose skips recomposition when all inputs are Stable and unchanged. Unstable parameters (standard List or lambdas capturing local variables) force recomposition. Fix by using Kotlinx ImmutableList, @Immutable annotations, remembering lambdas, and specifying unique keys in LazyColumn items(items, key = { it.id }).",
        difficulty: "HARD",
        focusArea: "Jetpack Compose & Recomposition",
        proTip: "Always use stable keys in LazyColumn and annotate UI models with @Immutable."
      },
      {
        id: 2,
        question: `Explain Structured Concurrency in Kotlin Coroutines, and why StateFlow is preferred over LiveData in modern Android apps at ${company}?`,
        expectedAnswer: "Structured concurrency guarantees coroutines launched in a CoroutineScope are cancelled when that scope is cancelled, preventing memory leaks and orphan tasks. StateFlow is pure Kotlin (works in KMP), holds an initial value, and integrates cleanly with Flow operators. Collect via collectAsStateWithLifecycle to stop collection when the app is in the background.",
        difficulty: "MEDIUM",
        focusArea: "Kotlin Coroutines & StateFlow",
        proTip: "Use collectAsStateWithLifecycle in Compose to avoid wasting battery when app is paused."
      },
      {
        id: 3,
        question: "How do you architect an offline-first mobile application using Room DB, WorkManager, and conflict-resolution strategies?",
        expectedAnswer: "The local Room DB acts as the Single Source of Truth (SSOT), observed by the UI via Flow. Offline edits are saved locally with a pending_sync flag. WorkManager schedules background sync when network connectivity is restored. Conflicts are resolved via Last-Write-Wins (LWW) or server timestamp comparisons.",
        difficulty: "HARD",
        focusArea: "Offline-First & Local Persistence",
        proTip: "Treat local Room DB as the single source of truth and delegate background sync to WorkManager."
      },
      {
        id: 4,
        question: "What causes Application Not Responding (ANR) errors on mobile devices, and how do you safely manage large bitmap memory allocations using Coil?",
        expectedAnswer: "ANRs trigger when the main thread is blocked for >5 seconds. Never execute disk I/O, heavy JSON parsing, or network calls on Dispatchers.Main. For images, decoding full-res images into memory causes OutOfMemory (OOM) errors. Coil downsamples bitmaps to target ImageView dimensions and caches them in LRU memory.",
        difficulty: "MEDIUM",
        focusArea: "Android Memory & ANR Prevention",
        proTip: "Offload intensive work to Dispatchers.IO and downsample bitmaps to match viewport dimensions."
      },
      {
        id: 5,
        question: "How do you profile and optimize Cold Start latency in mobile applications using Android App Startup and Baseline Profiles?",
        expectedAnswer: "A Cold Start occurs when the OS starts an app process from scratch. Minimize Application.onCreate() logic by deferring non-essential SDKs to background threads. Implement Baseline Profiles to pre-compile critical code paths into Ahead-Of-Time (AOT) machine code during installation, bypassing JIT compilation delays.",
        difficulty: "HARD",
        focusArea: "Cold Start & Mobile Performance",
        proTip: "Baseline Profiles pre-compile startup paths, slashing cold start latency by up to 35%."
      }
    ];

    behavioral = [
      {
        id: 1,
        situation: `Following a major feature update at ${company}, our crash-free rate dropped from 99.8% to 94.1% on budget Android devices.`,
        task: "Diagnose the root cause, publish an emergency hotfix, and restore crash-free sessions above 99.5%.",
        action: "Analyzed Firebase Crashlytics, finding OutOfMemory crashes in the camera flow due to uncompressed bitmap storage. Refactored image pipeline using Coil downsampling and offloaded processing to Dispatchers.Default.",
        result: "Hotfix deployed in 24 hours; crash-free sessions rebounded to 99.85%, and app memory footprint dropped by 62%.",
        competency: "Mobile Crash Triage & Memory Optimization"
      },
      {
        id: 2,
        situation: "Users complained of sluggish scrolling and frame stuttering when navigating our dynamic feed screen.",
        task: "Eliminate jank and achieve consistent 60 FPS scrolling across both budget and flagship devices.",
        action: "Profiled frame render times with Android Studio Profiler, fixed heavy recomposition loops in Compose by adding @Immutable annotations, and memoized list item viewmodels.",
        result: "Render times stabilized under 16ms, eliminating 99% of dropped frames and boosting app rating to 4.6.",
        competency: "Mobile UI Performance & 60 FPS"
      },
      {
        id: 3,
        situation: "Delivery agents frequently lost connectivity in basements, preventing them from recording package drop-offs.",
        task: "Build an offline-first architecture enabling agents to record updates offline and sync seamlessly upon reconnection.",
        action: "Implemented Room database as the single source of truth, used optimistic UI updates, and queued outbound sync actions in WorkManager with network constraints.",
        result: "100% of offline deliveries were recorded and synced without data loss, eliminating manual reconciliation.",
        competency: "Offline-First Resiliency"
      }
    ];

    systemDesign = {
      title: `High-Performance Offline-First Mobile Application Architecture for ${company}`,
      requirements: [
        "Support 5M daily active users with sub-1.2s cold start and 60 FPS scrolling",
        "Seamless offline-first caching with Room DB and automatic background sync",
        "Real-time push notifications and biometric authentication",
        "APK size < 50MB and 99.9% crash-free session rate"
      ],
      architecture: [
        "Jetpack Compose / Flutter presentation layer with design tokens",
        "StateFlow and ViewModel with lifecycle-aware observation",
        "Room SQLite DB with reactive Flow and SQLCipher encryption",
        "Android WorkManager for background sync and Retrofit for HTTP networking"
      ],
      keyTradeoffs: "Chose Room Write-Ahead Logging (WAL) and optimistic UI updates to prevent database locks and ensure instant UI responses."
    };
  } else {
    technical = [
      {
        id: 1,
        question: `How does Spring Boot ensure thread safety when multiple concurrent HTTP requests execute singleton bean service methods for ${company}?`,
        expectedAnswer: "Spring singleton beans maintain only one instance per ApplicationContext. Thread safety is achieved by making beans stateless—no shared mutable instance fields. All request-specific state is confined to method stack frames or ThreadLocal variables.",
        difficulty: "HARD",
        focusArea: "Spring Concurrency & JVM",
        proTip: "Highlight that creating instance variables in a @Service bean causes race conditions under high concurrent traffic."
      },
      {
        id: 2,
        question: "How do you detect, diagnose, and resolve the JPA/Hibernate N+1 select problem in high-throughput microservices?",
        expectedAnswer: "The N+1 problem occurs when fetching an entity with lazy relationships executes 1 initial query plus N additional queries for each related record. Fix it using JOIN FETCH in JPQL, @EntityGraph with attributePaths, or Hibernate batch fetching (default_batch_fetch_size).",
        difficulty: "MEDIUM",
        focusArea: "JPA / Hibernate Optimization",
        proTip: "Mention enabling 'spring.jpa.properties.hibernate.generate_statistics=true' during load testing."
      },
      {
        id: 3,
        question: `In Apache Kafka event streaming, what happens during consumer group rebalancing and how do you achieve exactly-once processing for ${company}?`,
        expectedAnswer: "Rebalancing occurs when consumers join, leave, or fail heartbeats. Consumer partitions are reassigned, briefly halting message consumption. Exactly-once processing is guaranteed using idempotent producers (enable.idempotence=true) and transactional producer APIs across consumer offsets.",
        difficulty: "HARD",
        focusArea: "Distributed Messaging / Kafka",
        proTip: "Cite production experience with CooperativeStickyAssignor to minimize rebalance pauses."
      },
      {
        id: 4,
        question: "Explain the architectural difference between clustered and non-clustered composite indexes in MySQL InnoDB.",
        expectedAnswer: "InnoDB's clustered index defines the physical table ordering based on the primary key, storing full row data in leaf nodes. Secondary (non-clustered) indexes store indexed columns plus the primary key pointer. Covering indexes resolve queries directly from index leaf nodes without secondary B-tree lookups.",
        difficulty: "HARD",
        focusArea: "Database Engineering & Indexing",
        proTip: "Use EXPLAIN ANALYZE to show index scans vs full table scans."
      },
      {
        id: 5,
        question: "How do stateless JWT tokens handle immediate user revocation or role downgrades securely without querying the database on every request?",
        expectedAnswer: "Stateless JWTs cannot be revoked natively until expiry. Best practice uses short-lived access tokens (5-15 mins) paired with revocable refresh tokens. Immediate revocation uses an in-memory Redis blacklist or user-token version epoch check.",
        difficulty: "MEDIUM",
        focusArea: "Spring Security & Auth",
        proTip: "Explain how Redis TTL matches access token expiration to prevent unbounded memory growth."
      }
    ];

    behavioral = [
      {
        id: 1,
        situation: "At Keyanna Technologies, our CPaaS backend experienced latency spikes during peak automated SMS delivery broadcasts.",
        task: "I was tasked with identifying the bottleneck and preventing message drop-offs without increasing cloud infrastructure spend.",
        action: "I refactored the synchronous REST dispatch into an asynchronous Apache Kafka event-driven pipeline and optimized database connection pooling with HikariCP.",
        result: "Reduced average message delivery latency by 68% and achieved zero dropped broadcasts under peak load of 2500+ messages/min.",
        competency: "Performance & Scalability"
      },
      {
        id: 2,
        situation: "During an urgent sprint release, a production patch broke JWT validation for incoming third-party webhook requests.",
        task: "I needed to remediate the authentication failure immediately while maintaining zero downtime for live clients.",
        action: "I analyzed gateway logs, identified the missing bearer prefix parser, quickly wrote an integration test, and deployed a zero-downtime hotfix.",
        result: "Restored 100% service uptime within 18 minutes and implemented automated pre-commit integration checks.",
        competency: "Crisis Management & Accountability"
      },
      {
        id: 3,
        situation: "Collaborating with frontend engineers on an Angular/React CPaaS analytics dashboard, we faced frequent API contract mismatches.",
        task: "Ensure cross-functional alignment so backend and frontend could develop in parallel without blocking blockers.",
        action: "Introduced OpenAPI/Swagger specifications before writing code, establishing a shared contract mock for frontend developers.",
        result: "Sprint delivery completed 2 days ahead of schedule with zero integration regression defects.",
        competency: "Cross-Functional Collaboration"
      }
    ];

    systemDesign = {
      title: `Distributed High-Throughput Notification Engine for ${company}`,
      requirements: [
        "Process 10,000 notifications per second with sub-50ms latency",
        "Strict idempotency to guarantee no duplicate SMS/email/webhook deliveries",
        "Automatic retry with exponential backoff and Dead Letter Queue (DLQ)",
        "Multi-tenant rate limiting per client tier"
      ],
      architecture: [
        "API Gateway (Spring Cloud Gateway) for rate limiting with Redis token bucket",
        "Kafka ingestion topic partitioned by tenant ID for ordered parallel consumption",
        "Worker microservices executing deduplication via Redis SETNX locks before dispatch",
        "Dead Letter Queue (DLQ) for failed messages with automated alerting"
      ],
      keyTradeoffs: "Chose Kafka partitioning over simple message queues to preserve strict order per client account while enabling horizontal partition scaling."
    };
  }

  return {
    id: jobId || 1,
    jobId: jobId || 1,
    jobTitle: role,
    company: company,
    technicalQuestionsJson: JSON.stringify(technical),
    behavioralQuestionsJson: JSON.stringify(behavioral),
    systemDesignJson: JSON.stringify(systemDesign),
    isLocal: true
  };
};

export default function InterviewPrep({ initialJobId, onNavigate }) {
  const [jobs, setJobs] = useState(FALLBACK_JOBS);
  const [selectedJobId, setSelectedJobId] = useState(initialJobId || FALLBACK_JOBS[0].id);
  const [prepData, setPrepData] = useState(() => generateLocalPrepKit(initialJobId || FALLBACK_JOBS[0].id));
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('technical'); // 'technical', 'behavioral', 'system'
  const [expandedAnswers, setExpandedAnswers] = useState({ 1: true }); // Q1 open by default
  const [prepError, setPrepError] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (initialJobId && initialJobId !== selectedJobId) {
      setSelectedJobId(initialJobId);
      handleGenerate(initialJobId);
    }
  }, [initialJobId]);

  const loadInitialData = async () => {
    try {
      const [jobsRes, prepsRes] = await Promise.allSettled([
        getJobs(),
        getInterviewPreps()
      ]);

      let availableJobs = FALLBACK_JOBS;
      if (jobsRes.status === 'fulfilled' && Array.isArray(jobsRes.value?.data) && jobsRes.value.data.length > 0) {
        availableJobs = jobsRes.value.data;
      }
      setJobs(availableJobs);
      setSelectedJobId(availableJobs[0].id);

      if (prepsRes.status === 'fulfilled' && Array.isArray(prepsRes.value?.data) && prepsRes.value.data.length > 0) {
        setPrepData(prepsRes.value.data[0]);
      } else {
        setPrepData(generateLocalPrepKit(availableJobs[0].id, availableJobs[0]));
      }
    } catch (err) {
      console.warn('Initial prep load fallback applied:', err);
      setJobs(FALLBACK_JOBS);
      setSelectedJobId(FALLBACK_JOBS[0].id);
      setPrepData(generateLocalPrepKit(FALLBACK_JOBS[0].id, FALLBACK_JOBS[0]));
    }
  };

  const handleGenerate = async (jobIdToUse) => {
    const targetId = jobIdToUse || selectedJobId;
    if (!targetId) return;

    const currentJob = jobs.find(j => j.id == targetId) || FALLBACK_JOBS.find(j => j.id == targetId) || FALLBACK_JOBS[0];

    setLoading(true);
    setPrepError(null);
    try {
      // Race backend generation with a 3.5s timeout for zero-latency user experience
      const fetchPromise = generateInterviewPrep(targetId);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 3500));

      const res = await Promise.race([fetchPromise, timeoutPromise]);
      if (res?.data) {
        setPrepData(res.data);
        setExpandedAnswers({ 1: true });
      } else {
        setPrepData(generateLocalPrepKit(targetId, currentJob));
        setExpandedAnswers({ 1: true });
      }
    } catch (err) {
      console.warn('Backend interview generation delayed/failed, using instant client synthesis:', err);
      setPrepData(generateLocalPrepKit(targetId, currentJob));
      setExpandedAnswers({ 1: true });
    } finally {
      setLoading(false);
    }
  };

  const toggleAnswer = (id) => {
    setExpandedAnswers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Safely parse JSON properties from backend
  const technicalQuestions = prepData?.technicalQuestionsJson
    ? (typeof prepData.technicalQuestionsJson === 'string'
        ? JSON.parse(prepData.technicalQuestionsJson)
        : prepData.technicalQuestionsJson)
    : [];

  const behavioralQuestions = prepData?.behavioralQuestionsJson
    ? (typeof prepData.behavioralQuestionsJson === 'string'
        ? JSON.parse(prepData.behavioralQuestionsJson)
        : prepData.behavioralQuestionsJson)
    : [];

  const systemDesign = prepData?.systemDesignJson
    ? (typeof prepData.systemDesignJson === 'string'
        ? JSON.parse(prepData.systemDesignJson)
        : prepData.systemDesignJson)
    : null;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner Card */}
      <div style={{
        background: '#0b0f19',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '24px 20px',
        boxShadow: 'var(--shadow-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <GraduationCap size={13} />
                AI Interview Coach
              </span>
              <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Sparkles size={12} />
                Llama 3 & Gemini Powered
              </span>
            </div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px' }}>
              Interview Preparation Kit
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '600px' }}>
              Targeted technical deep-dives, behavioral STAR responses, and domain system design scenarios tailored to your candidate stack.
            </p>
          </div>

          {/* Job Target Selector & Generate Button */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', width: '100%', maxWidth: '460px' }}>
            <select
              value={selectedJobId}
              onChange={(e) => {
                setSelectedJobId(e.target.value);
                handleGenerate(e.target.value);
              }}
              style={{
                flex: '1 1 200px',
                background: '#070b14',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '8px',
                padding: '10px 12px',
                fontSize: '13px',
                outline: 'none'
              }}
            >
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.title} @ {j.company}
                </option>
              ))}
            </select>

            <button
              onClick={() => handleGenerate()}
              disabled={loading || !selectedJobId}
              className="btn-primary"
              style={{
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0
              }}
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Zap size={14} />
                  <span>Generate Kit</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Current Active Target Card */}
        {prepData && (
          <div style={{
            background: '#070b14',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Targeting:</span>
              <strong style={{ color: '#ffffff', fontSize: '14px' }}>{prepData.jobTitle}</strong>
              <span style={{ color: '#818cf8', fontSize: '13px', fontWeight: '600' }}>@{prepData.company}</span>
            </div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>
              Domain: <strong style={{ color: '#e2e8f0' }}>{prepData.targetDomain}</strong>
            </div>
          </div>
        )}
      </div>

      {prepError && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: '#fca5a5',
          borderRadius: '10px',
          padding: '14px 18px',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={18} color="#f87171" style={{ flexShrink: 0 }} />
            <span>{prepError}</span>
          </div>
          <button
            type="button"
            onClick={() => handleGenerate(selectedJobId)}
            className="btn-primary"
            style={{
              padding: '6px 14px',
              fontSize: '12px',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            ⚡ Retry Generating Kit
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid var(--border)',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        <button
          onClick={() => setActiveTab('technical')}
          style={{
            background: activeTab === 'technical' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: activeTab === 'technical' ? '#818cf8' : '#94a3b8',
            border: 'none',
            borderBottom: activeTab === 'technical' ? '2px solid #818cf8' : '2px solid transparent',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '8px 8px 0 0',
            whiteSpace: 'nowrap'
          }}
        >
          <Code size={16} color={activeTab === 'technical' ? '#818cf8' : '#94a3b8'} />
          Technical Deep-Dive ({technicalQuestions.length})
        </button>

        <button
          onClick={() => setActiveTab('behavioral')}
          style={{
            background: activeTab === 'behavioral' ? 'rgba(192, 132, 252, 0.15)' : 'transparent',
            color: activeTab === 'behavioral' ? '#c084fc' : '#94a3b8',
            border: 'none',
            borderBottom: activeTab === 'behavioral' ? '2px solid #c084fc' : '2px solid transparent',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '8px 8px 0 0',
            whiteSpace: 'nowrap'
          }}
        >
          <Users size={16} color={activeTab === 'behavioral' ? '#c084fc' : '#94a3b8'} />
          Behavioral STAR ({behavioralQuestions.length})
        </button>

        <button
          onClick={() => setActiveTab('system')}
          style={{
            background: activeTab === 'system' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
            color: activeTab === 'system' ? '#38bdf8' : '#94a3b8',
            border: 'none',
            borderBottom: activeTab === 'system' ? '2px solid #38bdf8' : '2px solid transparent',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            borderRadius: '8px 8px 0 0',
            whiteSpace: 'nowrap'
          }}
        >
          <Layers size={16} color={activeTab === 'system' ? '#38bdf8' : '#94a3b8'} />
          System Design Challenge
        </button>
      </div>

      {/* TAB 1: TECHNICAL DEEP-DIVE */}
      {activeTab === 'technical' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {technicalQuestions.length === 0 && !loading && (
            <div style={{ background: '#0b0f19', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
              Select a job above and click "Generate Kit" to produce technical questions.
            </div>
          )}

          {technicalQuestions.map((q) => {
            const isOpen = !!expandedAnswers[q.id];
            return (
              <div
                key={q.id}
                style={{
                  background: '#0b0f19',
                  border: isOpen ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '18px 20px',
                  boxShadow: 'var(--shadow-sm)',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: '#818cf8',
                        fontSize: '11px',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(99, 102, 241, 0.4)'
                      }}>
                        Q{q.id}
                      </span>
                      <span className="badge badge-purple" style={{ fontSize: '11px' }}>
                        {q.topic}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', lineHeight: '1.4' }}>
                      {q.question}
                    </h3>
                  </div>

                  <button
                    onClick={() => toggleAnswer(q.id)}
                    className="btn-secondary"
                    style={{
                      padding: '7px 12px',
                      fontSize: '12px',
                      fontWeight: '600',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      flexShrink: 0
                    }}
                  >
                    <span>{isOpen ? 'Hide Answer' : 'Show Answer'}</span>
                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {isOpen && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{
                      background: '#030712',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '8px',
                      padding: '14px 16px',
                      fontSize: '13px',
                      color: '#cbd5e1',
                      lineHeight: '1.6'
                    }}>
                      <div style={{ fontSize: '11px', fontWeight: '700', color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                        Senior Staff Model Answer
                      </div>
                      <p style={{ margin: 0 }}>{q.modelAnswer}</p>
                    </div>

                    {q.keyTakeaway && (
                      <div style={{
                        background: 'rgba(99, 102, 241, 0.08)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        borderRadius: '8px',
                        padding: '10px 14px',
                        fontSize: '12px',
                        color: '#c7d2fe',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px'
                      }}>
                        <Lightbulb size={16} color="#818cf8" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <div>
                          <strong style={{ color: '#818cf8' }}>Key Architectural Takeaway: </strong>
                          {q.keyTakeaway}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: BEHAVIORAL STAR QUESTIONS */}
      {activeTab === 'behavioral' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {behavioralQuestions.map((b) => (
            <div
              key={b.id}
              style={{
                background: '#0b0f19',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '20px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: 'rgba(192, 132, 252, 0.2)',
                  color: '#c084fc',
                  fontSize: '11px',
                  fontWeight: '800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(192, 132, 252, 0.4)'
                }}>
                  B{b.id}
                </span>
                <span className="badge badge-purple" style={{ fontSize: '11px' }}>
                  {b.competency}
                </span>
              </div>

              <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', fontStyle: 'italic', lineHeight: '1.4' }}>
                "{b.question}"
              </h3>

              {/* 4 STAR Blocks Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '12px',
                marginTop: '4px'
              }}>
                <div style={{ background: '#070b14', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#38bdf8', textTransform: 'uppercase', marginBottom: '4px' }}>
                    [S] Situation
                  </div>
                  <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
                    {b.starAnswer?.situation}
                  </p>
                </div>

                <div style={{ background: '#070b14', border: '1px solid rgba(192, 132, 252, 0.2)', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#c084fc', textTransform: 'uppercase', marginBottom: '4px' }}>
                    [T] Task
                  </div>
                  <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
                    {b.starAnswer?.task}
                  </p>
                </div>

                <div style={{ background: '#070b14', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#818cf8', textTransform: 'uppercase', marginBottom: '4px' }}>
                    [A] Action
                  </div>
                  <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: '1.5', margin: 0 }}>
                    {b.starAnswer?.action}
                  </p>
                </div>

                <div style={{ background: '#070b14', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '12px 14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '800', color: '#34d399', textTransform: 'uppercase', marginBottom: '4px' }}>
                    [R] Result
                  </div>
                  <p style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: '500', lineHeight: '1.5', margin: 0 }}>
                    {b.starAnswer?.result}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: SYSTEM DESIGN CHALLENGE */}
      {activeTab === 'system' && systemDesign && (
        <div style={{
          background: '#0b0f19',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '24px 20px',
          boxShadow: 'var(--shadow-md)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px'
        }}>
          <div>
            <span className="badge badge-blue" style={{ fontSize: '11px', marginBottom: '8px' }}>
              Architecture Challenge
            </span>
            <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', marginTop: '6px' }}>
              {systemDesign.title}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              1. System Requirements (Functional & Non-Functional)
            </h4>
            <div style={{ background: '#070b14', border: '1px solid var(--border)', borderRadius: '8px', padding: '14px 16px', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
              {systemDesign.requirements}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              2. End-to-End Architectural Overview
            </h4>
            <div style={{ background: '#070b14', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '8px', padding: '14px 16px', fontSize: '13px', color: '#e2e8f0', lineHeight: '1.6' }}>
              {systemDesign.architectureOverview}
            </div>
          </div>

          {Array.isArray(systemDesign.keyComponents) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                3. Core System Components
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px' }}>
                {systemDesign.keyComponents.map((comp, idx) => (
                  <div key={idx} style={{ background: '#070b14', border: '1px solid var(--border)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: '#cbd5e1' }}>
                    <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8', fontSize: '11px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {idx + 1}
                    </span>
                    <span>{comp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              4. Scaling Bottlenecks & Mitigations
            </h4>
            <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '8px', padding: '14px 16px', fontSize: '13px', color: '#fde68a', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
              {systemDesign.scalingBottlenecksAndMitigations}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
