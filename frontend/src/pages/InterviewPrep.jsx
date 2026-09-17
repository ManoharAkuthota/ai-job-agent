import React, { useState, useEffect } from 'react';
import { getJobs, generateInterviewPrep, getInterviewPreps } from '../services/api';
import {
  Code, Users, Layers, Zap, ChevronDown, ChevronUp,
  GraduationCap, Sparkles, Lightbulb, RefreshCw, CheckCircle2,
  Building, MapPin, AlertCircle
} from 'lucide-react';

export default function InterviewPrep() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [prepData, setPrepData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('technical'); // 'technical', 'behavioral', 'system'
  const [expandedAnswers, setExpandedAnswers] = useState({ 1: true }); // Q1 open by default
  const [prepError, setPrepError] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [jobsRes, prepsRes] = await Promise.allSettled([
        getJobs(),
        getInterviewPreps()
      ]);

      if (jobsRes.status === 'fulfilled' && jobsRes.value.data && jobsRes.value.data.length > 0) {
        setJobs(jobsRes.value.data);
        setSelectedJobId(jobsRes.value.data[0].id);
      }

      if (prepsRes.status === 'fulfilled' && prepsRes.value.data && prepsRes.value.data.length > 0) {
        setPrepData(prepsRes.value.data[0]);
      } else if (jobsRes.status === 'fulfilled' && jobsRes.value.data && jobsRes.value.data.length > 0) {
        // Generate for the first job if no kits exist yet
        handleGenerate(jobsRes.value.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load interview prep data:', err);
    }
  };

  const handleGenerate = async (jobIdToUse) => {
    const targetId = jobIdToUse || selectedJobId;
    if (!targetId) return;

    setLoading(true);
    setPrepError(null);
    try {
      const res = await generateInterviewPrep(targetId);
      if (res.data) {
        setPrepData(res.data);
        setExpandedAnswers({ 1: true });
      }
    } catch (err) {
      console.error('Failed to generate interview prep kit:', err);
      const isNet = !err.response || err.message?.includes('Network') || err.response?.status >= 500;
      if (isNet) {
        setPrepError("Cloud server is initializing or re-indexing interview prep. Please tap 'Retry Generating Kit' below.");
      } else {
        setPrepError(err.response?.data?.error || err.message || "Failed to generate interview kit.");
      }
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
