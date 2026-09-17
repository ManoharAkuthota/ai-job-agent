import React, { useState, useEffect } from 'react';
import { getJobs, generateInterviewPrep, getInterviewPreps } from '../services/api';
import {
  Code, Users, Layers, Zap, ChevronDown, ChevronUp,
  GraduationCap, Sparkles, Lightbulb, RefreshCw, CheckCircle2,
  Building, MapPin, AlertCircle
} from 'lucide-react';

const FALLBACK_JOBS = [
  { id: 70001, title: 'Senior Frontend Engineer (React / TypeScript / Next.js)', company: 'Razorpay' },
  { id: 70002, title: 'Frontend Software Development Engineer (React, Redux, Web Performance)', company: 'Swiggy' },
  { id: 70003, title: 'UI / Frontend Software Engineer (React / Tailwind / Web Vitals)', company: 'Zepto' },
  { id: 70004, title: 'Frontend Developer - Web Platforms (React, Next.js)', company: 'Flipkart' },
  { id: 60001, title: 'Java Full Stack Developer (React & Spring Cloud)', company: 'Cognizant India' },
  { id: 60012, title: 'Software Engineer - Core Banking & Payments (Java / Spring)', company: 'Paytm' },
  { id: 120001, title: 'Backend Software Engineer (Java / Microservices)', company: 'Zomato' },
  { id: 180001, title: 'Full Stack Engineer (Java, Spring Boot, React)', company: 'LTI Mindtree' },
  { id: 90003, title: 'Backend Software Development Engineer (Java / Microservices)', company: 'Zepto' },
  { id: 60015, title: 'Java Web Developer (Microservices & Spring Boot)', company: 'Zoho Corporation' },
  { id: 60016, title: 'Backend Developer (Java, Spring Boot, MySQL, Redis)', company: 'CRED' },
  { id: 60006, title: 'Backend Software Engineer (Java, Kafka, Spring Boot)', company: 'PhonePe' }
];

const generateLocalPrepKit = (jobId, targetJob) => {
  const job = targetJob || FALLBACK_JOBS.find(j => j.id == jobId) || FALLBACK_JOBS[0];
  const role = job.title || 'Frontend Engineer';
  const company = job.company || 'Enterprise Tech';

  const roleLower = role.toLowerCase();
  const isFrontend = roleLower.includes('front') || roleLower.includes('react') || roleLower.includes('ui') || roleLower.includes('web');

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
