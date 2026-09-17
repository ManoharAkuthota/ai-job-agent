import React, { useState, useEffect } from 'react';
import { getAgentStatus, getAgentLogs, runAgentNow } from '../services/api';
import { Play, Sparkles, Briefcase, FileText, Send, Calendar, CheckCircle2, Clock, AlertCircle, Bot, ShieldCheck, Zap } from 'lucide-react';

export default function Dashboard({ onNavigate }) {
  const [status, setStatus] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);

  const loadData = async () => {
    try {
      const [statusRes, logsRes] = await Promise.all([getAgentStatus(), getAgentLogs()]);
      setStatus(statusRes.data);
      setLogs(logsRes.data || []);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRunAgent = async () => {
    setLoading(true);
    setRunResult(null);
    try {
      const res = await runAgentNow();
      setRunResult(res.data);
      await loadData();
    } catch (err) {
      alert("Error triggering agent: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Autonomous System Status Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
        borderRadius: 'var(--radius)',
        padding: '28px 32px',
        color: '#fff',
        marginBottom: '28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        boxShadow: '0 12px 30px -5px rgba(49, 46, 129, 0.45)',
        border: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <Bot size={26} color="#38bdf8" />
            <h2 style={{ fontSize: '22px', fontWeight: '800', letterSpacing: '-0.5px' }}>
              Autonomous Hands-Free AI Agent
            </h2>
            <span style={{
              background: '#10b981',
              color: '#ffffff',
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: '700',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Zap size={12} fill="#fff" /> ZERO USER INVOLVEMENT ACTIVE
            </span>
          </div>

          <p style={{ opacity: 0.9, fontSize: '14px', maxWidth: '650px', lineHeight: '1.6' }}>
            The agent operates continuously in the background:
            <br />
            <strong>1. Daily Resume Evolution:</strong> Scans domain trends & refines skills daily.
            <br />
            <strong>2. Headless Browser Auto-Apply:</strong> Playwright fills applications, attaches tailored ATS PDFs & captures screenshot proof.
          </p>

          <div style={{ display: 'flex', gap: '12px', marginTop: '14px', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px' }}>
              Target: <strong>{status?.targetDomain || 'Java Full Stack'}</strong>
            </span>
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px' }}>
              Schedule: <strong>Daily at 09:00 AM IST</strong>
            </span>
            <span style={{ background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '6px', fontSize: '12px' }}>
              Proof Screenshots: <strong>Enabled</strong>
            </span>
          </div>
        </div>

        <button
          onClick={handleRunAgent}
          disabled={loading}
          className="btn-primary"
          style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: '#ffffff',
            padding: '14px 26px',
            fontSize: '15px',
            fontWeight: '700',
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.45)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            borderRadius: '10px'
          }}
        >
          <Play size={18} fill="#ffffff" />
          {loading ? 'Executing Autonomous Cycle...' : 'Trigger Autonomous Cycle Now'}
        </button>
      </div>

      {/* Result feedback if run triggered */}
      {runResult && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '8px',
          padding: '16px 20px',
          marginBottom: '24px',
          color: '#a7f3d0',
          display: 'flex',
          alignItems: 'center',
          gap: '14px'
        }}>
          <CheckCircle2 size={24} color="#10b981" />
          <div>
            <div style={{ fontWeight: '700', fontSize: '15px', color: '#34d399' }}>Autonomous Cycle Finished Successfully!</div>
            <div style={{ fontSize: '13px', marginTop: '2px', color: '#cbd5e1' }}>
              Master Resume Evolved & Updated • Discovered {runResult.jobsDiscovered} Jobs • Tailored {runResult.resumesTailored} ATS Resumes • Autonomously Applied to {runResult.applicationsSubmitted} roles with screenshot proofs saved.
            </div>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid-4">
        <div className="stat-card" onClick={() => onNavigate && onNavigate('jobs')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
            <Briefcase size={24} />
          </div>
          <div>
            <div className="stat-value">{status?.totalJobsDiscovered ?? 0}</div>
            <div className="stat-label">Jobs Discovered</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigate && onNavigate('resumes')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <FileText size={24} />
          </div>
          <div>
            <div className="stat-value">{status?.resumesTailored ?? 0}</div>
            <div className="stat-label">Resumes Tailored</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigate && onNavigate('applications')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <Send size={24} />
          </div>
          <div>
            <div className="stat-value">{status?.totalApplied ?? 0}</div>
            <div className="stat-label">Submitted Applications</div>
          </div>
        </div>

        <div className="stat-card" onClick={() => onNavigate && onNavigate('applications')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <Calendar size={24} />
          </div>
          <div>
            <div className="stat-value">{status?.interviewsScheduled ?? 0}</div>
            <div className="stat-label">Interviews Scheduled</div>
          </div>
        </div>
      </div>

      {/* Activity Logs & Autonomous Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div style={{ background: '#0b0f19', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>Live Autonomous Execution Logs</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Auto-updating</span>
          </div>

          {logs.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', padding: '20px 0' }}>
              No logs recorded yet. The daily morning cron triggers automatically at 09:00 AM IST.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '420px', overflowY: 'auto' }}>
              {logs.slice(0, 15).map((log) => (
                <div key={log.id} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 14px',
                  background: '#070b14',
                  borderRadius: '8px',
                  borderLeft: `4px solid ${log.level === 'SUCCESS' ? '#10b981' : log.level === 'WARN' ? '#f59e0b' : '#6366f1'}`
                }}>
                  <div style={{ marginTop: '2px' }}>
                    {log.level === 'SUCCESS' && <CheckCircle2 size={16} color="#10b981" />}
                    {log.level === 'WARN' && <AlertCircle size={16} color="#f59e0b" />}
                    {log.level === 'INFO' && <Clock size={16} color="#6366f1" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', color: '#f8fafc' }}>{log.message}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {log.action} • {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Autonomous Capabilities Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#0b0f19', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff' }}>
              <ShieldCheck size={18} color="#10b981" /> Daily Resume Evolution
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: '1.5' }}>
              Every single day, the agent checks what technologies are most demanded in your domain and automatically re-optimizes your master profile summary and skill priorities.
            </p>
            <button onClick={() => onNavigate('profile')} className="btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              Inspect Evolved Resume
            </button>
          </div>

          <div style={{ background: '#0b0f19', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '20px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff' }}>
              <Bot size={18} color="#818cf8" /> Headless Browser Auto-Apply
            </h4>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '14px', lineHeight: '1.5' }}>
              Playwright headless browser automatically navigates to jobs, fills input fields, attaches the tailored PDF resume, submits, and logs visual screenshot proof.
            </p>
            <button onClick={() => onNavigate('applications')} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
              View Submission Proofs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
