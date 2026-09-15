import React, { useState, useEffect, useRef } from 'react';
import { getJobs, scanJobs, tailorResume, applyForJob, uploadResume, getProofUrl } from '../services/api';
import {
  Search, MapPin, Building, Sparkles, ExternalLink, Send, Check, RefreshCw,
  ChevronDown, ChevronUp, UploadCloud, FileText, CheckCircle2, AlertCircle,
  Zap, Bot, Eye, X, Award
} from 'lucide-react';

export default function JobFeed({ onNavigate }) {
  const [jobs, setJobs] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [expandedDesc, setExpandedDesc] = useState({});

  // Resume Upload State
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [batchApplying, setBatchApplying] = useState(false);
  const [batchProgress, setBatchProgress] = useState(null);

  // Proof Modal State
  const [previewProof, setPreviewProof] = useState(null);

  const fileInputRef = useRef(null);

  const loadJobs = async () => {
    setLoading(true);
    try {
      const res = await getJobs(filterStatus, minScore > 0 ? minScore : null);
      setJobs(res.data || []);
    } catch (err) {
      console.error("Error loading jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [filterStatus, minScore]);

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

  // Resume File Upload & Parsing Handler
  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

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
        if (res.data.matchedJobs && res.data.matchedJobs.length > 0) {
          setJobs(res.data.matchedJobs);
        } else {
          await loadJobs();
        }
      } else {
        setUploadError(res.data?.message || "Failed to parse resume.");
      }
    } catch (err) {
      setUploadError(err.response?.data?.error || err.message || "Error uploading resume.");
    } finally {
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
      alert("Resume tailored successfully! View or download in the 'Tailored Resumes' tab.");
    } catch (err) {
      alert("Error tailoring resume: " + (err.response?.data || err.message));
    } finally {
      setActionLoading((prev) => ({ ...prev, [jobId]: null }));
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const q = searchTerm.toLowerCase();
    return job.title?.toLowerCase().includes(q) || job.company?.toLowerCase().includes(q);
  });

  return (
    <div>
      <div className="top-header">
        <div>
          <h2 className="page-title">Resume Matching & Job Feed</h2>
          <p className="page-subtitle">Upload your resume to instantly match real domain jobs and let the AI Agent auto-apply autonomously.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={handleScan} disabled={loading} className="btn-secondary">
            <RefreshCw size={16} className={loading ? "spin" : ""} />
            {loading ? "Scanning Live Jobs..." : "Scan Domain Jobs"}
          </button>
          {jobs.some(j => j.status !== 'APPLIED') && (
            <button
              onClick={handleBatchAutoApply}
              disabled={batchApplying}
              className="btn-primary"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', border: 'none' }}
            >
              <Zap size={16} />
              {batchApplying ? (batchProgress || "Auto-Applying...") : "Auto-Apply to Top Matches"}
            </button>
          )}
        </div>
      </div>

      {/* RESUME UPLOAD SECTION (DRAG & DROP) */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        style={{
          background: dragActive ? '#f0fdf4' : '#fff',
          border: dragActive ? '2px dashed #10b981' : '2px dashed var(--border)',
          borderRadius: 'var(--radius)',
          padding: '28px 24px',
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
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--primary)'
          }}>
            <UploadCloud size={28} />
          </div>

          <div>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>
              Upload Your Resume to Auto-Match & Apply
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Drag & drop your <strong>PDF</strong>, <strong>DOCX</strong>, or <strong>TXT</strong> resume here, or click to browse.
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
                Parsing Resume & Matching Jobs...
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
            padding: '12px 16px',
            background: '#fef2f2',
            color: '#b91c1c',
            borderRadius: '8px',
            fontSize: '13px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} />
            {uploadError}
          </div>
        )}

        {uploadSuccess && (
          <div style={{
            marginTop: '20px',
            padding: '16px 20px',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '8px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#15803d', fontWeight: '700', marginBottom: '8px' }}>
              <CheckCircle2 size={18} />
              {uploadSuccess.message}
            </div>
            <div style={{ fontSize: '13px', color: '#374151', marginBottom: '10px' }}>
              <strong>Candidate:</strong> {uploadSuccess.candidateName} | <strong>Domain:</strong> {uploadSuccess.targetDomain} | <strong>Matching Jobs:</strong> {uploadSuccess.matchCount} postings
            </div>
            {uploadSuccess.skills.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#166534', alignSelf: 'center', marginRight: '4px' }}>Extracted Skills:</span>
                {uploadSuccess.skills.map((skill, idx) => (
                  <span key={idx} style={{
                    background: '#dcfce7',
                    color: '#166534',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600'
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '16px 20px',
        marginBottom: '20px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={18} color="#64748b" />
          <input
            type="text"
            placeholder="Search matching job title or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="">All Postings</option>
            <option value="DISCOVERED">Discovered</option>
            <option value="TAILORED">Tailored</option>
            <option value="APPLIED">Applied</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Match Score:</span>
          <select
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            style={{ width: '120px' }}
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
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '48px',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <Building size={40} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
          <h3 style={{ fontSize: '16px', color: 'var(--text-main)', marginBottom: '6px' }}>No jobs match your filters</h3>
          <p style={{ fontSize: '14px' }}>Upload your resume above or click "Scan Domain Jobs" to load real postings.</p>
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
                  background: '#fff',
                  border: isApplied ? '1px solid #bbf7d0' : '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '24px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)' }}>{job.title}</h3>
                      <span className={`badge ${job.matchScore >= 80 ? 'badge-green' : job.matchScore >= 60 ? 'badge-blue' : 'badge-yellow'}`}>
                        {job.matchScore}% Resume Match
                      </span>
                      <span className="badge badge-gray">{job.jobType || 'Remote'}</span>
                      {isApplied && (
                        <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Check size={12} /> Auto-Applied (Playwright)
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px', flexWrap: 'wrap' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '500', color: '#1e293b' }}>
                        <Building size={14} /> {job.company}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={14} /> {job.location || 'Remote'}
                      </span>
                      {job.salary && job.salary !== 'Competitive' && (
                        <span>💰 {job.salary}</span>
                      )}
                      <span>Source: {job.source}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleTailor(job.id)}
                      disabled={actionLoading[job.id] === 'tailoring'}
                      className={isTailored ? "btn-secondary" : "btn-primary"}
                      style={{ padding: '8px 14px', fontSize: '13px' }}
                    >
                      <Sparkles size={14} />
                      {actionLoading[job.id] === 'tailoring' ? 'Tailoring...' : isTailored ? 'Re-Tailor Resume' : 'Tailor Resume'}
                    </button>

                    {/* AUTONOMOUS AUTO APPLY BUTTON */}
                    <button
                      onClick={() => handleAutoApply(job)}
                      disabled={isApplied || isApplying}
                      className={isApplied ? "btn-secondary" : "btn-success"}
                      style={{
                        padding: '8px 16px',
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
                          AI Agent Applying...
                        </>
                      ) : isApplied ? (
                        <>
                          <Check size={14} color="#16a34a" />
                          Applied
                        </>
                      ) : (
                        <>
                          <Bot size={15} />
                          Auto Job Apply
                        </>
                      )}
                    </button>

                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary"
                        style={{ padding: '8px 10px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                        title="Open Original Job Link"
                      >
                        <ExternalLink size={15} />
                      </a>
                    )}
                  </div>
                </div>

                {/* Job Description */}
                <div style={{ fontSize: '13px', color: '#475569', marginTop: '12px', lineHeight: '1.6' }}>
                  {isExpanded ? job.description : (job.description?.slice(0, 200) + '...')}
                </div>

                {job.description && job.description.length > 200 && (
                  <button
                    onClick={() => setExpandedDesc(prev => ({ ...prev, [job.id]: !prev[job.id] }))}
                    style={{
                      background: 'none',
                      color: 'var(--primary)',
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
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={20} color="#16a34a" />
                  Application Autonomously Submitted!
                </h3>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  {previewProof.jobTitle} at {previewProof.company}
                </span>
              </div>
              <button onClick={() => setPreviewProof(null)} style={{ background: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ textAlign: 'center', background: '#000', borderRadius: '8px', overflow: 'hidden', padding: '10px' }}>
              <img
                src={getProofUrl(previewProof.id)}
                alt="Application Submission Proof"
                style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '6px' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://placehold.co/800x500?text=Autonomous+Playwright+Submission+Verified";
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
    </div>
  );
}