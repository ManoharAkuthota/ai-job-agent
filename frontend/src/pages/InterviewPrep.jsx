import React, { useState, useEffect } from 'react';
import { getJobs, generateInterviewPrep, getInterviewPreps } from '../services/api';

export default function InterviewPrep() {
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [prepData, setPrepData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('technical'); // 'technical', 'behavioral', 'system'
  const [expandedAnswers, setExpandedAnswers] = useState({});

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [jobsRes, prepsRes] = await Promise.allSettled([
        getJobs(),
        getInterviewPreps()
      ]);

      if (jobsRes.status === 'fulfilled' && jobsRes.value.data) {
        setJobs(jobsRes.value.data);
        if (jobsRes.value.data.length > 0) {
          setSelectedJobId(jobsRes.value.data[0].id);
        }
      }

      if (prepsRes.status === 'fulfilled' && prepsRes.value.data && prepsRes.value.data.length > 0) {
        setHistory(prepsRes.value.data);
        setPrepData(prepsRes.value.data[0]);
      }
    } catch (err) {
      console.error('Failed to load interview prep initial data:', err);
    }
  };

  const handleGenerate = async (jobIdToUse) => {
    const targetId = jobIdToUse || selectedJobId;
    if (!targetId) return;

    setLoading(true);
    try {
      const res = await generateInterviewPrep(targetId);
      setPrepData(res.data);
      setHistory(prev => [res.data, ...prev.filter(p => p.id !== res.data.id)]);
      setExpandedAnswers({});
    } catch (err) {
      console.error('Failed to generate interview prep kit:', err);
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-[#0b0f19] border border-gray-800/80 rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20">
                AI Interview Coach
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Llama 3 & Gemini Powered
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Interview Preparation Kit
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl">
              Targeted technical deep-dives, behavioral STAR responses, and domain system design scenarios aligned with your verified experience.
            </p>
          </div>

          {/* Job Target Selector */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="bg-[#030712] border border-gray-700/80 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-gray-200 focus:outline-none focus:border-indigo-500 w-full sm:w-64 truncate"
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
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 transition-all cursor-pointer whitespace-nowrap"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Generate Kit</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Target Role Status Card */}
      {prepData && (
        <div className="bg-[#0e1424] border border-indigo-900/50 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-gray-400">Current Target:</span>
            <span className="font-bold text-white text-sm">{prepData.jobTitle}</span>
            <span className="text-indigo-400 font-medium">@{prepData.company}</span>
          </div>
          <div className="text-gray-400 text-[11px]">
            Domain: <span className="text-gray-300 font-semibold">{prepData.targetDomain}</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-800 gap-2 sm:gap-4 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('technical')}
          className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'technical'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
          Technical Deep-Dive ({technicalQuestions.length})
        </button>

        <button
          onClick={() => setActiveTab('behavioral')}
          className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'behavioral'
              ? 'border-purple-500 text-purple-400 bg-purple-500/10'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          Behavioral STAR ({behavioralQuestions.length})
        </button>

        <button
          onClick={() => setActiveTab('system')}
          className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'system'
              ? 'border-cyan-500 text-cyan-400 bg-cyan-500/10'
              : 'border-transparent text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          System Design Challenge
        </button>
      </div>

      {/* Tab Content */}
      {!prepData && !loading ? (
        <div className="bg-[#0b0f19] border border-gray-800 rounded-2xl p-12 text-center text-gray-400">
          <p className="text-base font-semibold text-white">No interview kit generated yet</p>
          <p className="text-xs text-gray-500 mt-1">Select a job above and click "Generate Kit" to start practicing.</p>
        </div>
      ) : null}

      {/* 1. TECHNICAL Q&A TAB */}
      {activeTab === 'technical' && technicalQuestions.length > 0 && (
        <div className="space-y-4">
          {technicalQuestions.map((q) => {
            const isOpen = !!expandedAnswers[q.id];
            return (
              <div
                key={q.id}
                className="bg-[#0b0f19] border border-gray-800/90 rounded-xl p-4 sm:p-5 shadow-lg hover:border-gray-700 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center border border-indigo-500/30">
                        Q{q.id}
                      </span>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-gray-800 text-indigo-300 border border-gray-700">
                        {q.topic}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                      {q.question}
                    </h3>
                  </div>

                  <button
                    onClick={() => toggleAnswer(q.id)}
                    className="self-start sm:self-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-indigo-300 border border-indigo-500/20 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                  >
                    <span>{isOpen ? 'Hide Answer' : 'Show Answer'}</span>
                    <svg
                      className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-gray-800 space-y-3 animate-fadeIn">
                    <div className="bg-[#030712] border border-gray-800 rounded-lg p-3.5 sm:p-4 text-xs sm:text-sm text-gray-300 leading-relaxed">
                      <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1.5">
                        Model Answer (Senior Staff Standard)
                      </div>
                      <p className="whitespace-pre-line">{q.modelAnswer}</p>
                    </div>

                    {q.keyTakeaway && (
                      <div className="bg-indigo-950/20 border border-indigo-800/40 rounded-lg p-3 flex items-start gap-2.5 text-xs text-indigo-200">
                        <svg className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <strong className="font-semibold text-indigo-300">Key Takeaway: </strong>
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

      {/* 2. BEHAVIORAL STAR TAB */}
      {activeTab === 'behavioral' && behavioralQuestions.length > 0 && (
        <div className="space-y-5">
          {behavioralQuestions.map((b) => (
            <div
              key={b.id}
              className="bg-[#0b0f19] border border-gray-800/90 rounded-2xl p-4 sm:p-6 shadow-lg space-y-4"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-purple-500/20 text-purple-400 text-xs font-bold flex items-center justify-center border border-purple-500/30">
                  B{b.id}
                </span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  {b.competency}
                </span>
              </div>

              <h3 className="text-sm sm:text-base font-bold text-white">
                "{b.question}"
              </h3>

              {/* STAR Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <div className="bg-[#030712] border border-gray-800/80 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-400 text-[11px] font-bold uppercase tracking-wider">
                    <span className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-[10px]">S</span>
                    Situation
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{b.starAnswer?.situation}</p>
                </div>

                <div className="bg-[#030712] border border-gray-800/80 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-purple-400 text-[11px] font-bold uppercase tracking-wider">
                    <span className="w-4 h-4 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px]">T</span>
                    Task
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{b.starAnswer?.task}</p>
                </div>

                <div className="bg-[#030712] border border-gray-800/80 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center gap-1.5 text-cyan-400 text-[11px] font-bold uppercase tracking-wider">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 flex items-center justify-center text-[10px]">A</span>
                    Action
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{b.starAnswer?.action}</p>
                </div>

                <div className="bg-[#030712] border border-gray-800/80 rounded-xl p-3.5 space-y-1 border-emerald-900/30">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold uppercase tracking-wider">
                    <span className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-[10px]">R</span>
                    Result
                  </div>
                  <p className="text-xs text-gray-200 leading-relaxed font-medium">{b.starAnswer?.result}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. SYSTEM DESIGN TAB */}
      {activeTab === 'system' && systemDesign && (
        <div className="bg-[#0b0f19] border border-gray-800/90 rounded-2xl p-5 sm:p-7 shadow-xl space-y-6">
          <div className="border-b border-gray-800 pb-4">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Architecture Challenge
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white mt-2">
              {systemDesign.title}
            </h2>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">System Requirements</h4>
            <div className="bg-[#030712] border border-gray-800/80 rounded-xl p-4 text-xs sm:text-sm text-gray-300 leading-relaxed">
              {systemDesign.requirements}
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">Architecture Overview</h4>
            <div className="bg-[#030712] border border-cyan-900/30 rounded-xl p-4 text-xs sm:text-sm text-gray-200 leading-relaxed">
              {systemDesign.architectureOverview}
            </div>
          </div>

          {Array.isArray(systemDesign.keyComponents) && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Core Distributed Components</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {systemDesign.keyComponents.map((comp, idx) => (
                  <div key={idx} className="bg-[#030712] border border-gray-800 rounded-xl p-3 flex items-start gap-2.5 text-xs text-gray-300">
                    <span className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold shrink-0 text-[10px]">
                      {idx + 1}
                    </span>
                    <span>{comp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Scaling Bottlenecks & Mitigations</h4>
            <div className="bg-[#030712] border border-amber-900/30 rounded-xl p-4 text-xs sm:text-sm text-amber-200/90 whitespace-pre-line leading-relaxed">
              {systemDesign.scalingBottlenecksAndMitigations}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
