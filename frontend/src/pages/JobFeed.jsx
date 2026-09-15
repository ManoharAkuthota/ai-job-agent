import React, { useState, useEffect } from 'react';
import { getJobs, scanJobs, tailorResume, applyForJob } from '../services/api';
import { Search, MapPin, Building, Sparkles, ExternalLink, Send, Check, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

export default function JobFeed({ onNavigate }) {
  const [jobs, setJobs] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [minScore, setMinScore] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});
  const [expandedDesc, setExpandedDesc] = useState({});

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

  const handleTailor = async (jobId) => {
    setActionLoading((prev) => ({ ...prev, [jobId]: 'tailoring' }));
    try {
      await tailorResume(jobId);
      await loadJobs();
      alert("Resume tailored successfully! You can view it in the 'Tailored Resumes' tab.");
    } catch (err) {
      alert("Error tailoring resume: " + (err.response?.data || err.message));
    } finally {
      setActionLoading((prev) => ({ ...prev, [jobId]: null }));
    }
  };

  const handleApply = async (jobId) => {
    setActionLoading((prev) => ({ ...prev, [jobId]: 'applying' }));
    try {
      await applyForJob(jobId, "Applied from Job Feed");
      await loadJobs();
      alert("Application marked as APPLIED! Track it in the 'Applications' tab.");
    } catch (err) {
      alert("Error applying: " + err.message);
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
          <h2 className="page-title">Discovered Jobs</h2>
          <p className="page-subtitle">AI-matched job postings filtered for your target domain.</p>
        </div>
        <button onClick={handleScan} disabled={loading} className="btn-primary">
          <RefreshCw size={16} className={loading ? "spin" : ""} />
          {loading ? "Scanning APIs..." : "Scan for New Jobs"}
        </button>
      </div>

      {/* Filter Controls */}
      <div style={{
        background: '#fff',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center'
      }}>
        <div style={{ flex: 1, minWidth: '220px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={18} color="#64748b" />
          <input
            type="text"
            placeholder="Search by job title or company..."
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
            <option value="">All Statuses</option>
            <option value="DISCOVERED">Discovered</option>
            <option value="TAILORED">Tailored</option>
            <option value="APPLIED">Applied</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Min Match:</span>
          <select
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            style={{ width: '120px' }}
          >
            <option value={0}>Any Score</option>
            <option value={60}>60% +</option>
            <option value={75}>75% +</option>
            <option value={85}>85% +</option>
          </select>
        </div>
      </div>

      {/* Job Cards */}
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
          <p style={{ fontSize: '14px' }}>Try clearing filters or click "Scan for New Jobs" to fetch live postings.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredJobs.map((job) => {
            const isTailored = job.status === 'TAILORED' || job.status === 'APPLIED';
            const isApplied = job.status === 'APPLIED';
            const isExpanded = expandedDesc[job.id];

            return (
              <div
                key={job.id}
                style={{
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '24px',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)' }}>{job.title}</h3>
                      <span className={`badge ${job.matchScore >= 80 ? 'badge-green' : job.matchScore >= 60 ? 'badge-blue' : 'badge-yellow'}`}>
                        {job.matchScore}% ATS Match
                      </span>
                      <span className="badge badge-gray">{job.jobType || 'Remote'}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px' }}>
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

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <button
                      onClick={() => handleTailor(job.id)}
                      disabled={actionLoading[job.id] === 'tailoring'}
                      className={isTailored ? "btn-secondary" : "btn-primary"}
                      style={{ padding: '8px 14px', fontSize: '13px' }}
                    >
                      <Sparkles size={14} />
                      {actionLoading[job.id] === 'tailoring' ? 'Tailoring...' : isTailored ? 'Re-Tailor Resume' : 'Tailor Resume'}
                    </button>

                    <button
                      onClick={() => handleApply(job.id)}
                      disabled={isApplied || actionLoading[job.id] === 'applying'}
                      className={isApplied ? "btn-secondary" : "btn-success"}
                      style={{ padding: '8px 14px', fontSize: '13px' }}
                    >
                      {isApplied ? <Check size={14} /> : <Send size={14} />}
                      {isApplied ? 'Applied' : 'Apply'}
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

                {/* Job Description excerpt */}
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
                      gap: '4px'
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
    </div>
  );
}
