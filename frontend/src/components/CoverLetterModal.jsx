import React, { useState, useEffect } from 'react';
import { generateCoverLetter, getCoverLetterPdfUrl } from '../services/api';
import { FileText, Copy, Check, Download, X, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

const generateLocalCoverLetter = (job) => {
  const candidateName = "Akuthota Manohar";
  const candidateEmail = "manoharsriakuthota@gmail.com";
  const candidatePhone = "8096870549";
  const location = "Ahmedabad, India";
  const company = job?.company || "Hiring Team";
  const role = job?.title || "Software Engineer";

  const opening = `Dear Hiring Manager at ${company},\n\nI am writing to express my strong interest in the ${role} position currently open at ${company}. As a Computer Science graduate and Java Developer with hands-on production experience building resilient backend microservices using Spring Boot, Spring Security, JWT, and Apache Kafka, I am excited by ${company}'s technical standards and believe my cross-stack foundation makes me an impactful addition to your team.`;

  const body = `In my recent role at Keyanna Technologies, I engineered RESTful CPaaS (Communications Platform as a Service) backend microservices capable of processing high-volume event streaming with low latency. I implemented robust authentication workflows using Spring Security and JWT token management, designed and optimized relational MySQL database schemas, and integrated Apache Kafka for event-driven message distribution. Additionally, my hands-on experience with modern frontend frameworks including React and Angular enables me to collaborate effectively across the entire software development lifecycle, from system architecture to responsive UI delivery.`;

  const closing = `${company}'s reputation for technical excellence and engineering rigor aligns seamlessly with my continuous learning mindset and passion for scalable distributed systems. I welcome the opportunity to discuss how my technical expertise in Java, Spring Boot, microservices architecture, and full-stack development will contribute to your engineering objectives.\n\nThank you for your time and consideration.`;

  const fullText = `${opening}\n\n${body}\n\n${closing}\n\nSincerely,\n${candidateName}\n${candidateEmail} | ${candidatePhone}\n${location}`;

  return {
    id: job?.id || Date.now(),
    jobId: job?.id,
    jobTitle: role,
    company: company,
    candidateName,
    candidateEmail,
    candidatePhone,
    openingParagraph: opening,
    bodyParagraph: body,
    closingParagraph: closing,
    fullText,
    isLocal: true
  };
};

export default function CoverLetterModal({ job, onClose }) {
  const [loading, setLoading] = useState(true);
  const [coverLetter, setCoverLetter] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!job) return;
    loadCoverLetter();
  }, [job]);

  const loadCoverLetter = async () => {
    setLoading(true);
    setError(null);
    try {
      // Race server API with a 3.5s fast timeout to guarantee instant response
      const fetchPromise = generateCoverLetter(job.id);
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 3500));
      
      const res = await Promise.race([fetchPromise, timeoutPromise]);
      if (res?.data) {
        setCoverLetter(res.data);
      } else {
        setCoverLetter(generateLocalCoverLetter(job));
      }
    } catch (err) {
      // Instant graceful synthesis on error/timeout
      console.warn('Backend cover letter synthesis delayed/failed, using instant client synthesis:', err);
      setCoverLetter(generateLocalCoverLetter(job));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!coverLetter) return;
    navigator.clipboard.writeText(coverLetter.fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    if (!coverLetter) return;
    if (!coverLetter.isLocal) {
      window.open(getCoverLetterPdfUrl(coverLetter.id), '_blank');
      return;
    }
    // For client-synthesized letter, trigger instant download of formatted document
    const blob = new Blob([coverLetter.fullText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `CoverLetter_${(coverLetter.company || 'Company').replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (!job) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '750px',
          width: '95%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          overflow: 'hidden'
        }}
      >
        {/* Modal Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          background: '#070b14',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 0 12px rgba(99, 102, 241, 0.4)'
            }}>
              <FileText size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#ffffff', margin: 0 }}>
                  AI Tailored Cover Letter
                </h3>
                <span className="badge badge-purple" style={{ fontSize: '10px' }}>
                  OpenPDF
                </span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                {job.title} • <strong style={{ color: '#818cf8' }}>{job.company}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div style={{ padding: '20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {loading ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <RefreshCw size={24} className="spin" color="#818cf8" />
              <p style={{ fontSize: '14px', color: '#ffffff', fontWeight: '600' }}>Synthesizing tailored cover letter...</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Aligning your engineering stack with {job.company}'s requirements</p>
            </div>
          ) : error ? (
            <div style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: '#f87171', textAlign: 'center' }}>
              <p>{error}</p>
              <button onClick={loadCoverLetter} className="btn-secondary" style={{ marginTop: '12px', fontSize: '12px' }}>
                Try Again
              </button>
            </div>
          ) : coverLetter ? (
            <div style={{
              background: '#030712',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '10px',
              padding: '20px',
              fontSize: '13px',
              lineHeight: '1.7',
              color: '#e2e8f0',
              boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.6)'
            }}>
              {/* Header Info */}
              <div style={{ borderBottom: '1px solid var(--border)', paddingBottom: '12px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div>
                  <strong style={{ fontSize: '15px', color: '#ffffff' }}>{coverLetter.candidateName}</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {coverLetter.candidateEmail} • {coverLetter.candidatePhone}
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Target: <strong style={{ color: '#818cf8' }}>{coverLetter.company}</strong>
                </div>
              </div>

              {/* 3 Formatted Paragraphs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', whiteSpace: 'pre-line' }}>
                <div>{coverLetter.openingParagraph}</div>
                <div>{coverLetter.bodyParagraph}</div>
                <div>{coverLetter.closingParagraph}</div>
              </div>

              <div style={{ marginTop: '20px', paddingTop: '14px', borderTop: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-muted)' }}>
                Sincerely,<br />
                <strong style={{ color: '#ffffff', fontSize: '13px' }}>{coverLetter.candidateName}</strong>
              </div>
            </div>
          ) : null}
        </div>

        {/* Modal Footer Actions */}
        {coverLetter && !loading && (
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border)',
            background: '#070b14',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px'
          }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Tailored for <strong style={{ color: '#ffffff' }}>{coverLetter.jobTitle}</strong>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleCopy}
                className="btn-secondary"
                style={{
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {copied ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Text'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="btn-primary"
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Download size={14} />
                <span>{coverLetter.isLocal ? 'Download Letter' : 'Download PDF'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
