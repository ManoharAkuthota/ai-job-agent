import React, { useState, useEffect, useRef } from 'react';
import { getJobs, scanJobs, tailorResume, applyForJob, uploadResume, getProofUrl } from '../services/api';
import CoverLetterModal from '../components/CoverLetterModal';
import {
  Search, MapPin, Building, Sparkles, ExternalLink, Send, Check, RefreshCw,
  ChevronDown, ChevronUp, UploadCloud, FileText, CheckCircle2, AlertCircle,
  Zap, Bot, Eye, X, Award, ShieldAlert, TrendingUp, CheckSquare, Clock, Calendar,
  HelpCircle, Info, ArrowRight, GraduationCap
} from 'lucide-react';

export default function JobFeed({ onNavigate }) {
  const [jobs, setJobs] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [freshnessDays, setFreshnessDays] = useState(7);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL'); // 'ALL', 'FRONTEND', 'FULLSTACK', 'BACKEND'
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [expandedDesc, setExpandedDesc] = useState({});

  // Resume Upload & ATS Score State
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [networkWarning, setNetworkWarning] = useState(null);
  const [atsReport, setAtsReport] = useState(null);
  const [showAtsGuideModal, setShowAtsGuideModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [batchApplying, setBatchApplying] = useState(false);
  const [batchProgress, setBatchProgress] = useState(null);

  // Proof & Cover Letter Modal State
  const [previewProof, setPreviewProof] = useState(null);
  const [coverLetterModalJob, setCoverLetterModalJob] = useState(null);
  const [lastUploadedFile, setLastUploadedFile] = useState(null);

  const fileInputRef = useRef(null);

  const loadJobs = async (retryCount = 0) => {
    setLoading(true);
    try {
      const res = await getJobs(filterStatus, minScore > 0 ? minScore : null, freshnessDays);
      setJobs(res.data || []);
      setNetworkWarning(null);
    } catch (err) {
      console.error("Error loading jobs:", err);
      const isNet = !err.response || err.message?.includes('Network') || err.message?.includes('timeout') || err.response?.status >= 500;
      if (isNet) {
        setNetworkWarning("Cloud backend is waking up from standby (takes ~25-35s on first visit). Reconnecting...");
        // Auto-retry up to 4 times during container cold boot
        if (retryCount < 4) {
          setTimeout(() => loadJobs(retryCount + 1), 4000);
          return;
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [filterStatus, minScore, freshnessDays]);

  const handleScan = async () => {
    setLoading(true);
    try {
      await scanJobs();
      await loadJobs();
    } catch (err) {
      alert("Scan error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Resume File Upload & Parsing Handler with Automatic Cold-Boot Retries
  const handleFileUpload = async (file, attempt = 1) => {
    if (!file) return;
    setLastUploadedFile(file);
    setUploading(true);
    setUploadError(null);
    if (attempt === 1) {
      setUploadSuccess(null);
      setAtsReport(null);
    }

    try {
      const res = await uploadResume(file);
      if (res.data && res.data.success) {
        setUploadSuccess({
          message: res.data.message,
          candidateName: res.data.profile?.fullName,
          targetDomain: res.data.profile?.targetDomain,
          skills: res.data.extractedSkills || [],
          matchCount: res.data.matchedJobs?.length || 0
        });

        if (res.data.atsAnalysis) {
          setAtsReport(res.data.atsAnalysis);
        }

        const domain = (res.data.profile?.targetDomain || '').toLowerCase();
        if (domain.includes('ai') || domain.includes('machine learning') || domain.includes('ml')) {
          setSelectedCategory('AI_ML');
        } else if (domain.includes('devops') || domain.includes('cloud') || domain.includes('sre')) {
          setSelectedCategory('DEVOPS');
        } else if (domain.includes('data')) {
          setSelectedCategory('DATA');
        } else if (domain.includes('qa') || domain.includes('sdet') || domain.includes('test')) {
          setSelectedCategory('QA');
        } else if (domain.includes('mobile') || domain.includes('android') || domain.includes('ios')) {
          setSelectedCategory('MOBILE');
        } else if (domain.includes('front') || domain.includes('react') || domain.includes('ui')) {
          setSelectedCategory('FRONTEND');
        } else if (domain.includes('backend') || domain.includes('java')) {
          setSelectedCategory('BACKEND');
        } else if (domain.includes('full')) {
          setSelectedCategory('FULLSTACK');
        }

        if (res.data.matchedJobs && res.data.matchedJobs.length > 0) {
          setJobs(res.data.matchedJobs);
        } else {
          await loadJobs();
        }
        setUploadError(null);
        setUploading(false);
      } else {
        setUploadError(res.data?.message || "Failed to parse resume.");
        setUploading(false);
      }
    } catch (err) {
      console.warn(`Upload attempt ${attempt} encountered:`, err);
      const isNet = !err.response || err.message?.includes('Network') || err.message?.includes('timeout') || err.response?.status >= 500;
      
      // If cloud server is waking up on Render, automatically retry after a short delay
      if (isNet && attempt < 3) {
        setUploadError(`Cloud server waking up... Auto-retrying upload (attempt ${attempt + 1}/3 in 3s)...`);
        setTimeout(() => {
          handleFileUpload(file, attempt + 1);
        }, 3000);
        return;
      }

      if (isNet) {
        setUploadError("Cloud server took longer than expected to wake up from standby. Please tap 'Retry Upload Now' below.");
      } else {
        setUploadError(err.response?.data?.error || err.message || "Error uploading resume.");
      }
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Single Auto-Apply Trigger (Autonomous Playwright Submission)
  const handleAutoApply = async (job) => {
    setActionLoading((prev) => ({ ...prev, [job.id]: 'applying' }));
    try {
      const res = await applyForJob(job.id, "Autonomous application triggered by user");
      await loadJobs();
      if (res.data && res.data.id) {
        setPreviewProof({
          id: res.data.id,
          jobTitle: job.title,
          company: job.company,
          notes: res.data.notes,
          appliedAt: res.data.appliedAt || new Date().toISOString()
        });
      }
    } catch (err) {
      alert("Error during autonomous auto-apply: " + (err.response?.data || err.message));
    } finally {
      setActionLoading((prev) => ({ ...prev, [job.id]: null }));
    }
  };

  // Batch Auto-Apply Top Matches
  const handleBatchAutoApply = async () => {
    const candidateMatches = jobs.filter(j => j.status !== 'APPLIED').slice(0, 3);
    if (candidateMatches.length === 0) {
      alert("All current matching jobs have already been applied to!");
      return;
    }

    setBatchApplying(true);
    for (let i = 0; i < candidateMatches.length; i++) {
      const targetJob = candidateMatches[i];
      setBatchProgress(`Applying to ${targetJob.title} (${i + 1}/${candidateMatches.length})...`);
      setActionLoading(prev => ({ ...prev, [targetJob.id]: 'applying' }));
      try {
        await applyForJob(targetJob.id, "Batch autonomous auto-apply from resume matches");
      } catch (err) {
        console.error("Batch apply error for job " + targetJob.id, err);
      } finally {
        setActionLoading(prev => ({ ...prev, [targetJob.id]: null }));
      }
    }
    setBatchProgress("All top matches applied successfully with screenshot proofs!");
    await loadJobs();
    setTimeout(() => {
      setBatchApplying(false);
      setBatchProgress(null);
    }, 4000);
  };

  const handleTailor = async (jobId) => {
    setActionLoading((prev) => ({ ...prev, [jobId]: 'tailoring' }));
    try {
      await tailorResume(jobId);
      await loadJobs();
      if (onNavigate) {
        onNavigate('resumes');
      }
    } catch (err) {
      alert("Error tailoring resume: " + (err.response?.data || err.message));
    } finally {
      setActionLoading((prev) => ({ ...prev, [jobId]: null }));
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const q = searchTerm.toLowerCase();
    const title = (job.title || '').toLowerCase();
    const company = (job.company || '').toLowerCase();
    const matchesSearch = title.includes(q) || company.includes(q);
    if (!matchesSearch) return false;

    const isFrontendJob = title.includes('front') || title.includes('react') || title.includes('ui ') || title.includes('ui/') || title.includes('web developer');
    const isAiJob = title.includes('ai') || title.includes('machine learning') || title.includes('ml') || title.includes('deep learning') || title.includes('llm');
    const isDevopsJob = title.includes('devops') || title.includes('cloud') || title.includes('sre') || title.includes('infrastructure') || title.includes('kubernetes');
    const isDataJob = title.includes('data') || title.includes('spark') || title.includes('snowflake') || title.includes('airflow') || title.includes('etl');
    const isQaJob = title.includes('qa') || title.includes('sdet') || title.includes('test');
    const isMobileJob = title.includes('mobile') || title.includes('android') || title.includes('ios') || title.includes('flutter');
    const isFullStackJob = title.includes('full stack') || title.includes('fullstack');
    const isBackendJob = (title.includes('backend') || title.includes('java') || title.includes('microservice') || title.includes('spring') || title.includes('payments core')) && !isFrontendJob && !isAiJob && !isDevopsJob && !isDataJob && !isQaJob;

    if (selectedCategory === 'FRONTEND') {
      return isFrontendJob;
    }
    if (selectedCategory === 'BACKEND') {
      return isBackendJob;
    }
    if (selectedCategory === 'FULLSTACK') {
      return isFullStackJob;
    }
    if (selectedCategory === 'AI_ML') {
      return isAiJob;
    }
    if (selectedCategory === 'DEVOPS') {
      return isDevopsJob;
    }
    if (selectedCategory === 'DATA') {
      return isDataJob;
    }
    if (selectedCategory === 'QA') {
      return isQaJob;
    }
    if (selectedCategory === 'MOBILE') {
      return isMobileJob;
    }
    return true;
  });

  return (
    <div>
      <div className="top-header">
        <div>
          <h2 className="page-title">Resume Matching & Job Feed</h2>
          <p className="page-subtitle">Upload your resume to get instant ATS scoring, score improvement analysis, and strictly fresh Indian tech openings (past 7 days).</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={handleScan} disabled={loading} className="btn-secondary">
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            {loading ? "Scanning Live Jobs..." : "Scan Indian Tech Jobs"}
          </button>
          {jobs.some(j => j.status !== 'APPLIED') && (
            <button
              onClick={handleBatchAutoApply}
              disabled={batchApplying}
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none' }}
            >
              <Zap size={16} />
              {batchApplying ? (batchProgress || "Auto-Applying...") : "Auto-Apply Top Matches"}
            </button>
          )}
        </div>
      </div>

      {networkWarning && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.1)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 'var(--radius)',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fbbf24', fontSize: '13px' }}>
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            <span>{networkWarning}</span>
          </div>
          <button
            onClick={() => loadJobs()}
            disabled={loading}
            className="btn-secondary"
            style={{ padding: '6px 14px', fontSize: '12px' }}
          >
            {loading ? "Reconnecting..." : "Retry Now"}
          </button>
        </div>
      )}

      {/* RESUME UPLOAD SECTION (DRAG & DROP / FILE SELECT) */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          background: dragActive ? 'rgba(16, 185, 129, 0.08)' : '#0b0f19',
          border: dragActive ? '2px dashed #10b981' : '2px dashed rgba(99, 102, 241, 0.35)',
          borderRadius: 'var(--radius)',
          padding: '28px 20px',
          marginBottom: '24px',
          textAlign: 'center',
          transition: 'all 0.2s ease',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          style={{ display: 'none' }}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileUpload(e.target.files[0]);
            }
          }}
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.15)',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#818cf8',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.25)'
          }}>
            <UploadCloud size={28} />
          </div>

          <div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#ffffff', marginBottom: '4px' }}>
              Upload Resume for Instant ATS Scoring & Matching
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Drag & drop your <strong style={{ color: '#f8fafc' }}>PDF</strong>, <strong style={{ color: '#f8fafc' }}>DOCX</strong>, or <strong style={{ color: '#f8fafc' }}>TXT</strong> resume, or browse file.
            </p>
          </div>

          <button
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            disabled={uploading}
            className="btn-primary"
            style={{ marginTop: '6px' }}
          >
            {uploading ? (
              <>
                <RefreshCw size={16} className="spin" />
                Analyzing ATS Score & Finding Fresh Jobs...
              </>
            ) : (
              <>
                <FileText size={16} />
                Browse Resume File
              </>
            )}
          </button>
        </div>

        {uploadError && (
          <div style={{
            marginTop: '16px',
            padding: '14px 18px',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            borderRadius: '10px',
            fontSize: '13px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            maxWidth: '560px',
            margin: '16px auto 0'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'center' }}>
              <AlertCircle size={18} color="#f87171" style={{ flexShrink: 0 }} />
              <span>{uploadError}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
              {lastUploadedFile && !uploading && (
                <button
                  type="button"
                  onClick={() => handleFileUpload(lastUploadedFile, 1)}
                  className="btn-primary"
                  style={{
                    padding: '7px 16px',
                    fontSize: '12px',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    boxShadow: '0 0 14px rgba(239, 68, 68, 0.4)',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  ⚡ Retry Upload Now ({lastUploadedFile.name})
                </button>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="btn-secondary"
                style={{
                  padding: '7px 14px',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                📁 Select File Again
              </button>
            </div>
          </div>
        )}

        {uploadSuccess && (
          <div style={{
            marginTop: '16px',
            padding: '14px 18px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '8px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>
              <CheckCircle2 size={16} />
              {uploadSuccess.message}
            </div>
            <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
              <strong style={{ color: '#f8fafc' }}>Candidate:</strong> {uploadSuccess.candidateName} | <strong style={{ color: '#f8fafc' }}>Domain:</strong> {uploadSuccess.targetDomain} | <strong style={{ color: '#f8fafc' }}>Fresh Matches:</strong> {uploadSuccess.matchCount} Indian tech openings
            </div>
          </div>
        )}
      </div>

      {/* ============================================================
          1. ATS SCORE CARD & DEDUCTION ANALYSIS (DISPLAYED FIRST)
          ============================================================ */}
      {atsReport && (
        <div className="ats-card" style={{ border: '1px solid var(--border)', marginBottom: '28px' }}>
          {/* Header & Overall Gauge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--border)',
            paddingBottom: '18px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div className={`ats-score-badge ${atsReport.overallScore >= 80 ? 'ats-score-green' : atsReport.overallScore >= 65 ? 'ats-score-yellow' : 'ats-score-red'}`}>
                <span style={{ fontSize: '28px', lineHeight: 1 }}>{atsReport.overallScore}</span>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.85, marginTop: '4px' }}>/ 100 ATS</span>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={20} color="var(--primary)" />
                  <h3 style={{ fontSize: '19px', fontWeight: '700', color: '#ffffff' }}>
                    Resume ATS Compatibility Report
                  </h3>
                </div>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {atsReport.overallScore >= 80 ? (
                    <span style={{ color: '#34d399', fontWeight: '600' }}>🟢 Excellent Match: High probability of passing enterprise ATS filters (Workday, Greenhouse, Taleo).</span>
                  ) : atsReport.overallScore >= 65 ? (
                    <span style={{ color: '#fbbf24', fontWeight: '600' }}>🟡 Moderate Match: Good foundation, but missing key metrics and high-demand cloud/DevOps keywords.</span>
                  ) : (
                    <span style={{ color: '#f87171', fontWeight: '600' }}>🔴 Needs Attention: Critical gaps in quantifiable achievements or standard ATS headings.</span>
                  )}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowAtsGuideModal(true)}
                className="btn-secondary"
                style={{
                  fontSize: '12px',
                  padding: '7px 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  color: '#818cf8',
                  background: 'rgba(99, 102, 241, 0.12)',
                  borderRadius: '8px'
                }}
              >
                <HelpCircle size={14} /> Scoring Criteria & Formula
              </button>

              <span className={`badge ${atsReport.overallScore >= 80 ? 'badge-green' : 'badge-yellow'}`} style={{ padding: '6px 14px', fontSize: '13px' }}>
                {atsReport.overallScore >= 80 ? 'ATS Optimized' : 'Optimization Recommended'}
              </span>
            </div>
          </div>

          {/* 5-Pillar Score Breakdown (Accurate 100 pts total) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '12px',
            marginBottom: '22px',
            background: '#070b14',
            padding: '14px',
            borderRadius: '10px',
            border: '1px solid var(--border)'
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>
                <span>Keywords</span>
                <span style={{ color: '#f8fafc' }}>{atsReport.skillsScore} / 30</span>
              </div>
              <div className="ats-progress-track">
                <div className="ats-progress-fill" style={{ width: `${(atsReport.skillsScore / 30) * 100}%`, background: '#6366f1' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>
                <span>Impact (XYZ)</span>
                <span style={{ color: '#f8fafc' }}>{atsReport.impactScore} / 25</span>
              </div>
              <div className="ats-progress-track">
                <div className="ats-progress-fill" style={{ width: `${(atsReport.impactScore / 25) * 100}%`, background: atsReport.impactScore >= 18 ? '#10b981' : '#f59e0b' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>
                <span>Structure</span>
                <span style={{ color: '#f8fafc' }}>{atsReport.structureScore} / 20</span>
              </div>
              <div className="ats-progress-track">
                <div className="ats-progress-fill" style={{ width: `${(atsReport.structureScore / 20) * 100}%`, background: '#38bdf8' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>
                <span>Action Verbs</span>
                <span style={{ color: '#f8fafc' }}>{atsReport.actionVerbsScore} / 15</span>
              </div>
              <div className="ats-progress-track">
                <div className="ats-progress-fill" style={{ width: `${(atsReport.actionVerbsScore / 15) * 100}%`, background: '#c084fc' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>
                <span>Contact</span>
                <span style={{ color: '#f8fafc' }}>{atsReport.contactScore} / 10</span>
              </div>
              <div className="ats-progress-track">
                <div className="ats-progress-fill" style={{ width: `${(atsReport.contactScore / 10) * 100}%`, background: '#10b981' }} />
              </div>
            </div>
          </div>

          {/* WHY SCORE IS NOT 100% (REASONS & ACTIONABLE FIXES) */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <ShieldAlert size={18} color="#ef4444" />
              <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
                Why Your Score Is Not Higher (Actionable Improvements)
              </h4>
            </div>

            {atsReport.improvements && atsReport.improvements.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {atsReport.improvements.map((item, idx) => (
                  <div key={idx} className={`ats-improvement-card ${item.severity === 'RECOMMENDED' ? 'recommended' : ''}`}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ fontWeight: '700', fontSize: '14px', color: '#ffffff' }}>
                        {item.issue}
                      </div>
                      <span className={`badge ${item.severity === 'CRITICAL' ? 'badge-yellow' : 'badge-blue'}`}>
                        {item.severity}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5' }}>
                      <strong style={{ color: '#f8fafc' }}>ATS Deduction Reason:</strong> {item.reason}
                    </div>

                    <div className="ats-suggestion-box">
                      <strong style={{ color: '#38bdf8' }}>💡 Recommended Fix:</strong> {item.suggestion}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#34d399' }}>
                🎉 Great job! Your resume meets all major ATS standards.
              </div>
            )}
          </div>

          {/* Missing Keywords Tag Cloud */}
          {atsReport.missingKeywords && atsReport.missingKeywords.length > 0 && (
            <div style={{
              background: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              borderRadius: '8px',
              padding: '14px 18px',
              marginBottom: '16px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#fbbf24', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={16} />
                High-Demand Industry Keywords to Add to Your Resume:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {atsReport.missingKeywords.map((kw, i) => (
                  <span key={i} style={{
                    background: '#070b14',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    color: '#fde047',
                    padding: '4px 11px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    + {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Strengths */}
          {atsReport.strengths && atsReport.strengths.length > 0 && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '8px',
              padding: '14px 18px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#34d399', marginBottom: '8px' }}>
                Detected Strengths:
              </div>
              <ul style={{ paddingLeft: '18px', margin: 0, fontSize: '13px', color: '#a7f3d0', lineHeight: '1.6' }}>
                {atsReport.strengths.map((str, idx) => (
                  <li key={idx}>{str}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ============================================================
          2. RELATED JOBS SECTION (DISPLAYED NEXT, STRICTLY 7 DAYS)
          ============================================================ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building size={20} color="var(--primary)" />
            Top Matching Indian Tech Jobs (Past 7 Days Only)
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Showing verified present openings from top Indian companies. Zero 404 links.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={14} /> Freshness:
          </span>
          <select
            value={freshnessDays}
            onChange={(e) => setFreshnessDays(Number(e.target.value))}
            style={{ width: '160px' }}
          >
            <option value={7}>Past 7 Days (1 Week)</option>
            <option value={3}>Past 3 Days</option>
            <option value={1}>Past 24 Hours</option>
          </select>
        </div>
      </div>

      {/* Role / Domain Filter Tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '16px',
        flexWrap: 'wrap'
      }}>
        <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginRight: '4px' }}>
          Role Category:
        </span>
        {[
          { key: 'ALL', label: 'All Openings', count: jobs.length },
          {
            key: 'FRONTEND',
            label: '⚡ Frontend / UI',
            count: jobs.filter(j => {
              const t = (j.title || '').toLowerCase();
              return t.includes('front') || t.includes('react') || t.includes('ui ') || t.includes('ui/') || t.includes('web developer');
            }).length,
            isUserDomain: uploadSuccess?.targetDomain?.toLowerCase().includes('front')
          },
          {
            key: 'BACKEND',
            label: '☕ Java / Backend',
            count: jobs.filter(j => {
              const t = (j.title || '').toLowerCase();
              return (t.includes('backend') || t.includes('java') || t.includes('microservice') || t.includes('spring')) && !t.includes('front');
            }).length,
            isUserDomain: uploadSuccess?.targetDomain?.toLowerCase().includes('backend')
          },
          {
            key: 'AI_ML',
            label: '🤖 AI / Machine Learning',
            count: jobs.filter(j => {
              const t = (j.title || '').toLowerCase();
              return t.includes('ai') || t.includes('machine learning') || t.includes('ml') || t.includes('deep learning') || t.includes('llm');
            }).length,
            isUserDomain: uploadSuccess?.targetDomain?.toLowerCase().includes('ai') || uploadSuccess?.targetDomain?.toLowerCase().includes('machine learning')
          },
          {
            key: 'DEVOPS',
            label: '☁️ DevOps & Cloud',
            count: jobs.filter(j => {
              const t = (j.title || '').toLowerCase();
              return t.includes('devops') || t.includes('cloud') || t.includes('sre') || t.includes('infrastructure') || t.includes('kubernetes');
            }).length,
            isUserDomain: uploadSuccess?.targetDomain?.toLowerCase().includes('devops') || uploadSuccess?.targetDomain?.toLowerCase().includes('cloud')
          },
          {
            key: 'DATA',
            label: '📊 Data Engineering',
            count: jobs.filter(j => {
              const t = (j.title || '').toLowerCase();
              return t.includes('data') || t.includes('spark') || t.includes('snowflake') || t.includes('airflow');
            }).length,
            isUserDomain: uploadSuccess?.targetDomain?.toLowerCase().includes('data')
          },
          {
            key: 'QA',
            label: '🧪 QA & SDET',
            count: jobs.filter(j => {
              const t = (j.title || '').toLowerCase();
              return t.includes('qa') || t.includes('sdet') || t.includes('test');
            }).length,
            isUserDomain: uploadSuccess?.targetDomain?.toLowerCase().includes('qa') || uploadSuccess?.targetDomain?.toLowerCase().includes('sdet')
          },
          {
            key: 'MOBILE',
            label: '📱 Mobile (Android/iOS)',
            count: jobs.filter(j => {
              const t = (j.title || '').toLowerCase();
              return t.includes('mobile') || t.includes('android') || t.includes('ios') || t.includes('flutter');
            }).length,
            isUserDomain: uploadSuccess?.targetDomain?.toLowerCase().includes('mobile') || uploadSuccess?.targetDomain?.toLowerCase().includes('android')
          },
          {
            key: 'FULLSTACK',
            label: '🔄 Full Stack',
            count: jobs.filter(j => (j.title || '').toLowerCase().includes('full')).length,
            isUserDomain: uploadSuccess?.targetDomain?.toLowerCase().includes('full')
          }
        ].map(cat => {
          const isSelected = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              type="button"
              onClick={() => setSelectedCategory(cat.key)}
              style={{
                padding: '7px 14px',
                fontSize: '12px',
                fontWeight: isSelected ? '700' : '500',
                borderRadius: '20px',
                border: isSelected
                  ? '1px solid var(--primary)'
                  : '1px solid var(--border)',
                background: isSelected
                  ? 'rgba(99, 102, 241, 0.22)'
                  : 'rgba(255, 255, 255, 0.03)',
                color: isSelected ? '#c7d2fe' : 'var(--text-muted)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{cat.label}</span>
              <span style={{
                background: isSelected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                {cat.count}
              </span>
              {cat.isUserDomain && (
                <span style={{
                  color: '#34d399',
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  padding: '1px 6px',
                  borderRadius: '6px',
                  fontSize: '10px',
                  fontWeight: '700'
                }}>
                  Your Domain
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div style={{
        background: '#0b0f19',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '14px 18px',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '14px',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={18} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search job title or company (Swiggy, Razorpay, TCS...)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: '130px' }}
          >
            <option value="">All Statuses</option>
            <option value="DISCOVERED">Discovered</option>
            <option value="TAILORED">Tailored</option>
            <option value="APPLIED">Applied</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Match:</span>
          <select
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            style={{ width: '110px' }}
          >
            <option value={0}>All Scores</option>
            <option value={60}>60% +</option>
            <option value={75}>75% +</option>
            <option value={85}>85% +</option>
          </select>
        </div>
      </div>

      {/* Jobs List */}
      {filteredJobs.length === 0 ? (
        <div style={{
          background: '#0b0f19',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '48px',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <Building size={40} style={{ margin: '0 auto 12px auto', opacity: 0.4, color: '#818cf8' }} />
          <h3 style={{ fontSize: '16px', color: '#ffffff', marginBottom: '6px' }}>No jobs match your filters within the selected freshness window</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Upload your resume above or click "Scan Indian Tech Jobs" to load real postings from the past 7 days.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredJobs.map((job) => {
            const isTailored = job.status === 'TAILORED' || job.status === 'APPLIED';
            const isApplied = job.status === 'APPLIED';
            const isExpanded = expandedDesc[job.id];
            const isApplying = actionLoading[job.id] === 'applying';

            return (
              <div
                key={job.id}
                style={{
                  background: '#0b0f19',
                  border: isApplied ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '20px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 300px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#ffffff' }}>{job.title}</h3>
                      <span className={`badge ${job.matchScore >= 80 ? 'badge-green' : job.matchScore >= 60 ? 'badge-blue' : 'badge-yellow'}`}>
                        {job.matchScore}% Resume Match
                      </span>
                      {((job.title || '').toLowerCase().includes('front') || (job.title || '').toLowerCase().includes('react') || (job.title || '').toLowerCase().includes('ui')) && (
                        <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', fontSize: '11px' }}>
                          ⚡ Frontend
                        </span>
                      )}
                      {uploadSuccess?.targetDomain?.toLowerCase().includes('front') && ((job.title || '').toLowerCase().includes('front') || (job.title || '').toLowerCase().includes('react')) && (
                        <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: '700', fontSize: '11px' }}>
                          🎯 Target Match
                        </span>
                      )}
                      {job.postedDate && (
                        <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                          <Calendar size={11} /> {job.postedDate}
                        </span>
                      )}
                      <span className="badge badge-gray">{job.jobType || 'Full-Time'}</span>
                      {isApplied && (
                        <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={12} /> Auto-Applied (Playwright)
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600', color: '#38bdf8' }}>
                        <Building size={14} /> {job.company}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} /> {job.location || 'India'}
                      </span>
                      {job.salary && job.salary !== 'Competitive' && (
                        <span style={{ color: '#34d399', fontWeight: '600' }}>💰 {job.salary}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions for this job */}
                  <div className="job-action-buttons" style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleTailor(job.id)}
                      disabled={actionLoading[job.id] === 'tailoring'}
                      className={isTailored ? "btn-secondary" : "btn-primary"}
                      style={{ padding: '8px 12px', fontSize: '13px' }}
                    >
                      <Sparkles size={14} />
                      {actionLoading[job.id] === 'tailoring' ? 'Tailoring...' : isTailored ? 'Re-Tailor' : 'Tailor Resume'}
                    </button>

                    {/* AUTONOMOUS AUTO APPLY BUTTON */}
                    <button
                      onClick={() => handleAutoApply(job)}
                      disabled={isApplied || isApplying}
                      className={isApplied ? "btn-secondary" : "btn-success"}
                      style={{
                        padding: '8px 14px',
                        fontSize: '13px',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {isApplying ? (
                        <>
                          <RefreshCw size={14} className="spin" />
                          AI Applying...
                        </>
                      ) : isApplied ? (
                        <>
                          <Check size={14} color="#34d399" />
                          Applied
                        </>
                      ) : (
                        <>
                          <Bot size={15} />
                          Auto Job Apply
                        </>
                      )}
                    </button>

                    {/* DIRECT OFFICIAL CAREER PORTAL LINK */}
                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary"
                        style={{
                          padding: '8px 12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.35)',
                          background: 'rgba(56, 189, 248, 0.08)'
                        }}
                        title={`Visit ${job.company} Official Career Portal`}
                      >
                        <Building size={13} color="#38bdf8" />
                        Career Portal
                        <ExternalLink size={12} />
                      </a>
                    )}

                    {/* DIRECT LINKEDIN JOBS APPLICATION LINK */}
                    <a
                      href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(job.title + ' ' + job.company)}&location=India`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-secondary"
                      style={{
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        textDecoration: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#60a5fa',
                        border: '1px solid rgba(96, 165, 250, 0.35)',
                        background: 'rgba(59, 130, 246, 0.08)'
                      }}
                      title={`Search ${job.title} at ${job.company} on LinkedIn Jobs India`}
                    >
                      LinkedIn Jobs
                      <ExternalLink size={12} />
                    </a>

                    {/* AI COVER LETTER BUTTON */}
                    <button
                      type="button"
                      onClick={() => setCoverLetterModalJob(job)}
                      className="btn-secondary"
                      style={{
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#c084fc',
                        border: '1px solid rgba(192, 132, 252, 0.35)',
                        background: 'rgba(168, 85, 247, 0.08)',
                        cursor: 'pointer'
                      }}
                      title={`Generate AI Tailored Cover Letter for ${job.company}`}
                    >
                      <FileText size={13} color="#c084fc" />
                      Cover Letter
                    </button>

                    {/* INTERVIEW PREP BUTTON */}
                    <button
                      type="button"
                      onClick={() => {
                        if (onNavigate) onNavigate('prep', { jobId: job.id });
                      }}
                      className="btn-secondary"
                      style={{
                        padding: '8px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        color: '#38bdf8',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                        background: 'rgba(56, 189, 248, 0.08)',
                        cursor: 'pointer'
                      }}
                      title={`Open Interview Preparation Kit for ${job.title}`}
                    >
                      <GraduationCap size={13} color="#38bdf8" />
                      Prep Interview
                    </button>
                  </div>
                </div>

                {/* Job Description */}
                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '10px', lineHeight: '1.6' }}>
                  {isExpanded ? job.description : (job.description?.slice(0, 180) + '...')}
                </div>

                {job.description && job.description.length > 180 && (
                  <button
                    onClick={() => setExpandedDesc(prev => ({ ...prev, [job.id]: !prev[job.id] }))}
                    style={{
                      background: 'none',
                      color: '#818cf8',
                      fontSize: '12px',
                      fontWeight: '600',
                      marginTop: '6px',
                      padding: '0',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    {isExpanded ? <>Show Less <ChevronUp size={14} /></> : <>Read Full Description <ChevronDown size={14} /></>}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Proof Screenshot Lightbox Modal */}
      {previewProof && (
        <div className="modal-overlay" onClick={() => setPreviewProof(null)}>
          <div className="modal-content" style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#34d399', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={20} color="#10b981" />
                  Application Autonomously Submitted!
                </h3>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {previewProof.jobTitle} at {previewProof.company}
                </span>
              </div>
              <button onClick={() => setPreviewProof(null)} style={{ background: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ textAlign: 'center', background: '#000', borderRadius: '8px', overflow: 'hidden', padding: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <img
                src={getProofUrl(previewProof.id)}
                alt="Application Submission Proof"
                style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '6px' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://placehold.co/800x500/0b0f19/38bdf8?text=Autonomous+Playwright+Submission+Verified";
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {previewProof.notes || "Autonomous Playwright form fill, tailored resume PDF attachment & confirmation proof"}
              </div>
              <button onClick={() => setPreviewProof(null)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ATS Scoring Methodology & Formula Transparency Modal */}
      {showAtsGuideModal && (
        <div className="modal-overlay" onClick={() => setShowAtsGuideModal(false)}>
          <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '88vh' }} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: '#818cf8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Award size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#ffffff' }}>
                    Enterprise ATS Scoring Engine: Methodology & Criteria
                  </h3>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Standard used by Workday, Taleo, Greenhouse, Lever & iCIMS
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAtsGuideModal(false)}
                style={{ background: 'none', color: '#94a3b8', padding: '6px', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Body */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', fontSize: '13px', lineHeight: '1.6', color: '#cbd5e1' }}>
              {/* Introduction Callout */}
              <div style={{
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.25)',
                borderRadius: '10px',
                padding: '14px 16px',
                color: '#e2e8f0'
              }}>
                <strong style={{ color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <Info size={15} /> How Enterprise ATS Algorithms Score Resumes
                </strong>
                ATS algorithms do not assign scores arbitrarily. They mathematically parse, categorize, and grade resumes across <strong>5 verified engineering pillars</strong> totaling 100 points.
              </div>

              {/* 5 Pillars Table */}
              <div>
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', marginBottom: '10px' }}>
                  The 5 Mathematical Pillars (100 Points Total)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ background: '#070b14', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <strong style={{ color: '#818cf8' }}>1. Technical Keywords & Stack Alignment (30 Pts)</strong>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Core backend (12 pts), frontend (8 pts), databases (4 pts), and cloud/DevOps (6 pts).</div>
                    </div>
                    <span className="badge badge-purple" style={{ fontSize: '12px' }}>30% Weight</span>
                  </div>

                  <div style={{ background: '#070b14', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <strong style={{ color: '#10b981' }}>2. Quantifiable Impact & Metrics (25 Pts)</strong>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Measures latency %, scale (TPS/users), throughput, and business outcomes. Ignores dates and phone numbers.</div>
                    </div>
                    <span className="badge badge-green" style={{ fontSize: '12px' }}>25% Weight</span>
                  </div>

                  <div style={{ background: '#070b14', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <strong style={{ color: '#38bdf8' }}>3. Document ATS Structure & Hierarchy (20 Pts)</strong>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Recognized section headings: Summary (+3), Experience (+5), Projects (+4), Education (+4), Skills (+4).</div>
                    </div>
                    <span className="badge badge-blue" style={{ fontSize: '12px' }}>20% Weight</span>
                  </div>

                  <div style={{ background: '#070b14', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <strong style={{ color: '#c084fc' }}>4. Action Verbs & Delivery Tone (15 Pts)</strong>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Authoritative verbs (Architected, Engineered, Optimized) vs passive phrases ('worked on', 'assisted with').</div>
                    </div>
                    <span className="badge badge-purple" style={{ fontSize: '12px' }}>15% Weight</span>
                  </div>

                  <div style={{ background: '#070b14', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <strong style={{ color: '#fbbf24' }}>5. Contact Information & Online Presence (10 Pts)</strong>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>Candidate name (+2), email (+2), 10-digit phone (+2), city location (+2), explicit LinkedIn & GitHub URLs (+2).</div>
                    </div>
                    <span className="badge badge-yellow" style={{ fontSize: '12px' }}>10% Weight</span>
                  </div>
                </div>
              </div>

              {/* Before vs After Google X-Y-Z Rewrite Formula */}
              <div style={{
                background: '#070b14',
                border: '1px solid var(--border)',
                borderRadius: '10px',
                padding: '16px'
              }}>
                <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TrendingUp size={16} color="#10b981" />
                  How to Jump from 71 to 95+ ATS Score (Google X-Y-Z Formula)
                </h4>
                <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '14px' }}>
                  Google's formula for top-tier engineering resumes: <em>"Accomplished [X], as measured by [Y], by doing [Z]"</em>.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ background: 'rgba(239, 68, 68, 0.08)', borderLeft: '3px solid #ef4444', padding: '10px 12px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#f87171', textTransform: 'uppercase' }}>Before (Current Bullet - Low Metric Score):</div>
                    <div style={{ fontSize: '12px', color: '#cbd5e1', marginTop: '2px' }}>
                      "Built and maintained backend microservices for the company's CPaaS product using Spring Boot."
                    </div>
                  </div>

                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', borderLeft: '3px solid #10b981', padding: '10px 12px', borderRadius: '4px' }}>
                    <div style={{ fontSize: '11px', fontWeight: '700', color: '#34d399', textTransform: 'uppercase' }}>After (Optimized - 95+ ATS Score):</div>
                    <div style={{ fontSize: '12px', color: '#e2e8f0', marginTop: '2px' }}>
                      "Engineered 4+ RESTful CPaaS microservices using Spring Boot and Apache Kafka, processing <strong>50,000+ daily events</strong> with <strong>99.9% uptime</strong> and reducing latency by <strong>42%</strong>."
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              <button
                onClick={() => setShowAtsGuideModal(false)}
                className="btn-primary"
                style={{ padding: '8px 20px', fontSize: '13px' }}
              >
                Got It, Close Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Tailored Cover Letter Modal */}
      {coverLetterModalJob && (
        <CoverLetterModal
          job={coverLetterModalJob}
          onClose={() => setCoverLetterModalJob(null)}
        />
      )}
    </div>
  );
}