import React, { useState, useEffect } from 'react';
import { generateCoverLetter, getCoverLetterPdfUrl } from '../services/api';
import { FileText, Copy, Check, Download, X, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';

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
      const res = await generateCoverLetter(job.id);
      setCoverLetter(res.data);
    } catch (err) {
      console.error('Failed to generate cover letter:', err);
      setError('Unable to generate cover letter right now. Please try again.');
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

              <a
                href={getCoverLetterPdfUrl(coverLetter.id)}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none'
                }}
              >
                <Download size={14} />
                <span>Download PDF</span>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
