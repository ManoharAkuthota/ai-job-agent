import React, { useState, useEffect } from 'react';
import { getResumes, getPdfUrl } from '../services/api';
import { FileText, Download, Eye, Building, Calendar, X, Sparkles } from 'lucide-react';

export default function TailoredResumes() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewResume, setPreviewResume] = useState(null);

  const loadResumes = async () => {
    setLoading(true);
    try {
      const res = await getResumes();
      setResumes(res.data || []);
    } catch (err) {
      console.error("Error loading resumes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  return (
    <div>
      <div className="top-header">
        <div>
          <h2 className="page-title">Tailored ATS Resumes</h2>
          <p className="page-subtitle">Resumes automatically customized and compiled for each job posting.</p>
        </div>
      </div>

      {resumes.length === 0 ? (
        <div style={{
          background: '#fff',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '48px',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <FileText size={40} style={{ margin: '0 auto 12px auto', opacity: 0.4 }} />
          <h3 style={{ fontSize: '16px', color: 'var(--text-main)', marginBottom: '6px' }}>No tailored resumes yet</h3>
          <p style={{ fontSize: '14px' }}>
            Go to the "Job Feed" and click "Tailor Resume", or run the AI Agent from the Dashboard to generate them.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {resumes.map((r) => (
            <div
              key={r.id}
              style={{
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '22px',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>{r.jobTitle}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      <Building size={13} /> {r.company}
                    </div>
                  </div>
                  <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Sparkles size={12} /> {r.atsMatchScore}% ATS
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
                  <Calendar size={13} /> Generated {new Date(r.createdAt).toLocaleDateString()}
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Tailored Summary
                  </div>
                  <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {r.tailoredSummary}
                  </p>
                </div>

                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Keywords Emphasized
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {r.highlightedSkills?.split(',').slice(0, 5).map((skill, i) => (
                      <span key={i} className="badge badge-purple" style={{ fontSize: '11px' }}>
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', paddingTop: '14px', borderTop: '1px solid var(--border)' }}>
                <button
                  onClick={() => setPreviewResume(r)}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center', padding: '8px 12px', fontSize: '13px' }}
                >
                  <Eye size={14} /> Preview
                </button>

                <a
                  href={getPdfUrl(r.id)}
                  download
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: 'center', padding: '8px 12px', fontSize: '13px', textDecoration: 'none' }}
                >
                  <Download size={14} /> ATS PDF
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewResume && (
        <div className="modal-overlay" onClick={() => setPreviewResume(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Resume for {previewResume.company}</h3>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{previewResume.jobTitle}</span>
              </div>
              <button onClick={() => setPreviewResume(null)} style={{ background: 'none', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div
              style={{ background: '#f8fafc', padding: '20px', borderRadius: '8px', border: '1px solid var(--border)' }}
              dangerouslySetInnerHTML={{ __html: previewResume.resumeHtml }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setPreviewResume(null)} className="btn-secondary">Close</button>
              <a href={getPdfUrl(previewResume.id)} download className="btn-primary" style={{ textDecoration: 'none' }}>
                <Download size={16} /> Download ATS PDF
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
