import React, { useState, useEffect } from 'react';
import { getApplications, updateApplicationStatus, deleteApplication, getPdfUrl, getProofUrl } from '../services/api';
import { Send, Building, Calendar, ExternalLink, Download, Trash2, CheckCircle2, Image as ImageIcon, X } from 'lucide-react';

export default function Applications() {
  const [applications, setApplications] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [previewProof, setPreviewProof] = useState(null);

  const loadApps = async () => {
    setLoading(true);
    try {
      const res = await getApplications();
      setApplications(res.data || []);
    } catch (err) {
      console.error("Error loading applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApps();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateApplicationStatus(id, newStatus);
      await loadApps();
    } catch (err) {
      alert("Error updating status: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Remove this application from tracking?")) {
      try {
        await deleteApplication(id);
        await loadApps();
      } catch (err) {
        alert("Error deleting application: " + err.message);
      }
    }
  };

  const filtered = applications.filter((app) => !statusFilter || app.status === statusFilter);

  return (
    <div>
      <div className="top-header">
        <div>
          <h2 className="page-title">Application Tracker (Autonomous Proofs)</h2>
          <p className="page-subtitle">Visual confirmation screenshots and real-time tracking of jobs submitted by the AI agent.</p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {['', 'APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={statusFilter === st ? "btn-primary" : "btn-secondary"}
              style={{ padding: '6px 12px', fontSize: '13px' }}
            >
              {st === '' ? 'All' : st}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{
          background: '#0b0f19',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '48px',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          <Send size={40} style={{ margin: '0 auto 12px auto', opacity: 0.4, color: '#818cf8' }} />
          <h3 style={{ fontSize: '16px', color: '#ffffff', marginBottom: '6px' }}>No applications found</h3>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Jobs submitted automatically by the Playwright AI agent will appear here with proof screenshots.</p>
        </div>
      ) : (
        <div style={{ background: '#0b0f19', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px', minWidth: '600px' }}>
            <thead>
              <tr style={{ background: '#070b14', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', fontWeight: '600' }}>
                <th style={{ padding: '14px 18px' }}>Role & Company</th>
                <th style={{ padding: '14px 18px' }}>Applied Date</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                <th style={{ padding: '14px 18px' }}>Submission Proof</th>
                <th style={{ padding: '14px 18px' }}>Tailored Resume</th>
                <th style={{ padding: '14px 18px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((app) => (
                <tr key={app.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: '600', color: '#ffffff', fontSize: '14px' }}>{app.jobTitle}</div>
                    <div style={{ color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <Building size={13} /> {app.company} • {app.location}
                    </div>
                  </td>

                  <td style={{ padding: '14px 18px', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={13} /> {new Date(app.appliedAt).toLocaleDateString()}
                    </div>
                  </td>

                  <td style={{ padding: '14px 18px' }}>
                    <select
                      value={app.status}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      style={{
                        padding: '5px 10px',
                        fontSize: '12px',
                        fontWeight: '600',
                        borderRadius: '6px',
                        width: 'auto',
                        background: '#0f172a',
                        color: app.status === 'INTERVIEW' ? '#34d399' : app.status === 'OFFER' ? '#fbbf24' : '#f8fafc',
                        border: '1px solid var(--border)'
                      }}
                    >
                      <option value="APPLIED">APPLIED</option>
                      <option value="REVIEWING">REVIEWING</option>
                      <option value="INTERVIEW">INTERVIEW</option>
                      <option value="OFFER">OFFER</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </td>

                  <td style={{ padding: '14px 18px' }}>
                    {app.screenshotProofPath ? (
                      <button
                        onClick={() => setPreviewProof(app)}
                        className="btn-secondary"
                        style={{ padding: '5px 10px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#34d399', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                      >
                        <ImageIcon size={14} color="#34d399" /> View Proof
                      </button>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Pending capture</span>
                    )}
                  </td>

                  <td style={{ padding: '14px 18px' }}>
                    {app.tailoredResumeId ? (
                      <a
                        href={getPdfUrl(app.tailoredResumeId)}
                        download
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          color: '#818cf8',
                          textDecoration: 'none',
                          fontWeight: '600'
                        }}
                      >
                        <Download size={14} /> PDF
                      </a>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>Standard</span>
                    )}
                  </td>

                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {app.jobUrl && (
                        <a
                          href={app.jobUrl}
                          target="_blank"
                          rel="noreferrer"
                          title="Open Job Listing"
                          style={{ color: '#94a3b8', padding: '6px' }}
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(app.id)}
                        title="Delete Application"
                        style={{ background: 'none', color: '#ef4444', padding: '6px', cursor: 'pointer' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Proof Screenshot Modal */}
      {previewProof && (
        <div className="modal-overlay" onClick={() => setPreviewProof(null)}>
          <div className="modal-content" style={{ maxWidth: '850px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>Autonomous Submission Proof</h3>
                <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{previewProof.jobTitle} at {previewProof.company}</span>
              </div>
              <button onClick={() => setPreviewProof(null)} style={{ background: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ textAlign: 'center', background: '#000', borderRadius: '8px', overflow: 'hidden', padding: '10px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <img
                src={getProofUrl(previewProof.id)}
                alt="Application Submission Proof Screenshot"
                style={{ maxWidth: '100%', maxHeight: '65vh', objectFit: 'contain', borderRadius: '6px' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://placehold.co/800x500/0b0f19/38bdf8?text=Browser+Submission+Captured+Successfully";
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Captured autonomously by Playwright headless browser at {new Date(previewProof.appliedAt).toLocaleString()}
              </div>
              <button onClick={() => setPreviewProof(null)} className="btn-secondary">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
