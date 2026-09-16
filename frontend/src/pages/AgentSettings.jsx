import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings, checkOllama, testEmailNotification } from '../services/api';
import { Settings, Sparkles, CheckCircle2, Key, Globe, Sliders, Shield, Cpu, Mail, Send, AlertCircle, RefreshCw } from 'lucide-react';

export default function AgentSettings() {
  const [settings, setSettings] = useState({
    targetDomain: 'Java Full Stack',
    targetKeywords: 'Java, Spring Boot, React, MySQL, REST API',
    preferredLocation: 'Remote, India, Hybrid',
    minMatchScore: 60,
    autoApplyEnabled: false,
    geminiApiKey: '',
    cronExpression: '0 0 9 * * ?',
    aiProvider: 'AUTO',
    ollamaEndpoint: 'http://localhost:11434',
    ollamaModel: 'llama3',
    emailNotificationsEnabled: true,
    notificationEmail: 'manoharsriakuthota@gmail.com'
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  // Ollama Connection Test State
  const [checkingOllama, setCheckingOllama] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState(null);

  // Email Notification Test State
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);

  useEffect(() => {
    getSettings()
      .then((res) => {
        if (res.data) setSettings(res.data);
      })
      .catch((err) => console.error("Error fetching settings:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleTestOllama = async () => {
    setCheckingOllama(true);
    setOllamaStatus(null);
    try {
      const res = await checkOllama(settings.ollamaEndpoint || 'http://localhost:11434');
      setOllamaStatus(res.data);
    } catch (err) {
      setOllamaStatus({
        connected: false,
        message: 'Could not reach Ollama server: ' + (err.message || 'Connection failed')
      });
    } finally {
      setCheckingOllama(false);
    }
  };

  const handleTestEmail = async () => {
    if (!settings.notificationEmail) {
      alert("Please enter a valid notification email address.");
      return;
    }
    setSendingTestEmail(true);
    setEmailStatus(null);
    try {
      const res = await testEmailNotification(settings.notificationEmail);
      setEmailStatus(res.data);
    } catch (err) {
      setEmailStatus({
        success: false,
        message: 'Error sending test email: ' + (err.message || 'Unknown error')
      });
    } finally {
      setSendingTestEmail(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await updateSettings(settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      alert("Error saving settings: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '840px' }} className="space-y-6">
      <div className="top-header">
        <div>
          <h2 className="page-title">Agent Settings & System Control</h2>
          <p className="page-subtitle">Configure search parameters, autonomous scheduling, local Ollama (Llama 3), and email notifications.</p>
        </div>
      </div>

      {success && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '8px',
          padding: '12px 18px',
          color: '#a7f3d0',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} color="#10b981" />
          <span>Settings saved successfully! The autonomous agent will operate with these configurations.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: '#0b0f19', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '24px' }}>
        
        {/* SECTION 1: SEARCH DOMAIN & KEYWORDS */}
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={18} color="var(--primary)" /> Target Search Domain & Skills
        </h3>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Target Domain
          </label>
          <input
            type="text"
            name="targetDomain"
            value={settings.targetDomain || ''}
            onChange={handleChange}
            placeholder="e.g. Java Full Stack, Backend Microservices"
            required
          />
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Target Skill Keywords (Comma separated)
          </label>
          <input
            type="text"
            name="targetKeywords"
            value={settings.targetKeywords || ''}
            onChange={handleChange}
            placeholder="Java, Spring Boot, React, MySQL, REST API, Apache Kafka"
          />
          <small style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
            The agent uses these keywords to query live career portals and match jobs.
          </small>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Preferred Location Filter
          </label>
          <input
            type="text"
            name="preferredLocation"
            value={settings.preferredLocation || ''}
            onChange={handleChange}
            placeholder="Remote, India, Hybrid, Bengaluru, Hyderabad, Pune"
          />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />

        {/* SECTION 2: AI PROVIDER (OLLAMA / GEMINI / RULE-BASED) */}
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cpu size={18} color="#818cf8" /> AI Engine & Local Ollama Integration
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Choose your AI inference provider. <strong>Local Ollama (Llama 3)</strong> runs completely offline and 100% free on your machine with zero API costs.
        </p>

        {/* Provider Radio Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 mb-5">
          {[
            { id: 'AUTO', label: 'Auto (Recommended)', desc: 'Detects Ollama -> Gemini -> Built-in' },
            { id: 'OLLAMA', label: 'Ollama (Llama 3)', desc: '100% Free, Local & Offline' },
            { id: 'GEMINI', label: 'Google Gemini', desc: 'Cloud Gemini 1.5 API' },
            { id: 'RULE_BASED', label: 'Built-in Engine', desc: 'Deterministic Smart NLP' },
          ].map(p => (
            <label
              key={p.id}
              className={`p-3 rounded-xl border cursor-pointer flex flex-col justify-between transition-all ${
                settings.aiProvider === p.id
                  ? 'bg-indigo-950/30 border-indigo-500 shadow-md shadow-indigo-500/10'
                  : 'bg-[#070b14] border-gray-800 hover:border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-white">{p.label}</span>
                <input
                  type="radio"
                  name="aiProvider"
                  value={p.id}
                  checked={settings.aiProvider === p.id}
                  onChange={handleChange}
                  className="accent-indigo-500"
                />
              </div>
              <span className="text-[11px] text-gray-400">{p.desc}</span>
            </label>
          ))}
        </div>

        {/* Ollama Details when AUTO or OLLAMA is selected */}
        {(settings.aiProvider === 'AUTO' || settings.aiProvider === 'OLLAMA') && (
          <div className="bg-[#070b14] border border-gray-800 rounded-xl p-4 mb-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu size={14} /> Ollama Local Configuration
              </span>
              <button
                type="button"
                onClick={handleTestOllama}
                disabled={checkingOllama}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {checkingOllama ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
                <span>{checkingOllama ? 'Pinging...' : 'Test Connection'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-400 block mb-1">Ollama API Endpoint</label>
                <input
                  type="text"
                  name="ollamaEndpoint"
                  value={settings.ollamaEndpoint || ''}
                  onChange={handleChange}
                  placeholder="http://localhost:11434"
                  className="w-full text-xs"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-400 block mb-1">Model Name</label>
                <input
                  type="text"
                  name="ollamaModel"
                  value={settings.ollamaModel || ''}
                  onChange={handleChange}
                  placeholder="llama3"
                  className="w-full text-xs"
                />
              </div>
            </div>

            {ollamaStatus && (
              <div className={`p-3 rounded-lg text-xs border ${
                ollamaStatus.connected
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                  : 'bg-amber-950/20 border-amber-800/40 text-amber-300'
              }`}>
                <div className="font-semibold flex items-center gap-1.5">
                  {ollamaStatus.connected ? '🟢 ' : '⚠️ '}
                  {ollamaStatus.message}
                </div>
                {ollamaStatus.models && ollamaStatus.models.length > 0 && (
                  <div className="text-[11px] text-gray-400 mt-1">
                    Installed Models: <span className="text-gray-200">{ollamaStatus.models.join(', ')}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Gemini API Key */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Gemini API Key (Optional)
          </label>
          <input
            type="password"
            name="geminiApiKey"
            value={settings.geminiApiKey || ''}
            onChange={handleChange}
            placeholder="AIzaSy..."
          />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />

        {/* SECTION 3: EMAIL NOTIFICATIONS */}
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Mail size={18} color="#38bdf8" /> Email Notification Pipeline
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Receive automated HTML notifications when your AI bot auto-applies or discovers a 80%+ ATS matching job.
        </p>

        <div className="bg-[#070b14] border border-gray-800 rounded-xl p-4 mb-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div style={{ fontWeight: '600', fontSize: '14px', color: '#ffffff' }}>Enable Email Alerts</div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Sends dispatch confirmations with proof links & high-match alerts.
              </div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                name="emailNotificationsEnabled"
                checked={Boolean(settings.emailNotificationsEnabled)}
                onChange={handleChange}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: settings.emailNotificationsEnabled ? 'var(--primary)' : '#334155',
                borderRadius: '24px',
                transition: '0.2s',
                display: 'flex',
                alignItems: 'center',
                padding: '2px'
              }}>
                <span style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#fff',
                  borderRadius: '50%',
                  transform: settings.emailNotificationsEnabled ? 'translateX(20px)' : 'translateX(0)',
                  transition: '0.2s'
                }} />
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <div className="sm:col-span-2">
              <label className="text-[11px] font-semibold text-gray-400 block mb-1">Notification Email Recipient</label>
              <input
                type="email"
                name="notificationEmail"
                value={settings.notificationEmail || ''}
                onChange={handleChange}
                placeholder="manoharsriakuthota@gmail.com"
                className="w-full text-xs"
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleTestEmail}
                disabled={sendingTestEmail || !settings.notificationEmail}
                className="w-full py-2.5 rounded-xl text-xs font-semibold bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {sendingTestEmail ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
                <span>{sendingTestEmail ? 'Sending...' : 'Send Test Alert'}</span>
              </button>
            </div>
          </div>

          {emailStatus && (
            <div className={`p-3 rounded-lg text-xs border ${
              emailStatus.success
                ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                : 'bg-red-950/20 border-red-800/40 text-red-300'
            }`}>
              {emailStatus.message}
            </div>
          )}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />

        {/* SECTION 4: AUTOMATION THRESHOLDS */}
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} color="var(--primary)" /> Automation Criteria
        </h3>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>
              Minimum Match Score for Auto-Tailoring & Applying
            </label>
            <span style={{ fontWeight: '700', color: '#818cf8' }}>{settings.minMatchScore}%</span>
          </div>
          <input
            type="range"
            min="40"
            max="95"
            name="minMatchScore"
            value={settings.minMatchScore || 60}
            onChange={handleChange}
            style={{ width: '100%', accentColor: 'var(--primary)' }}
          />
        </div>

        <div style={{
          background: '#070b14',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px'
        }}>
          <div>
            <div style={{ fontWeight: '600', fontSize: '14px', color: '#ffffff' }}>Daily Auto-Apply</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Automatically submits applications with screenshot proof during the scheduled morning cycle.
            </div>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              name="autoApplyEnabled"
              checked={Boolean(settings.autoApplyEnabled)}
              onChange={handleChange}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: settings.autoApplyEnabled ? 'var(--primary)' : '#334155',
              borderRadius: '24px',
              transition: '0.2s',
              display: 'flex',
              alignItems: 'center',
              padding: '2px'
            }}>
              <span style={{
                width: '20px',
                height: '20px',
                backgroundColor: '#fff',
                borderRadius: '50%',
                transform: settings.autoApplyEnabled ? 'translateX(20px)' : 'translateX(0)',
                transition: '0.2s'
              }} />
            </span>
          </label>
        </div>

        <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '12px 28px', cursor: 'pointer' }}>
          {saving ? 'Saving...' : 'Save Agent Settings'}
        </button>
      </form>
    </div>
  );
}
