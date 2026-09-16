import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../services/api';
import { Settings, Sparkles, CheckCircle2, Key, Globe, Sliders, Shield } from 'lucide-react';

export default function AgentSettings() {
  const [settings, setSettings] = useState({
    targetDomain: 'Java Full Stack',
    targetKeywords: 'Java, Spring Boot, React, MySQL, REST API',
    preferredLocation: 'Remote, India, Hybrid',
    minMatchScore: 60,
    autoApplyEnabled: false,
    geminiApiKey: '',
    cronExpression: '0 0 9 * * ?'
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

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
    <div style={{ maxWidth: '800px' }}>
      <div className="top-header">
        <div>
          <h2 className="page-title">Agent Settings & Schedule</h2>
          <p className="page-subtitle">Configure search parameters, daily automation, and free AI provider.</p>
        </div>
      </div>

      {success && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: '8px',
          padding: '12px 18px',
          marginBottom: '20px',
          color: '#a7f3d0',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} color="#10b981" />
          <span>Settings saved successfully! The daily agent will apply these rules.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: '#0b0f19', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '28px' }}>
        {/* Domain & Keywords */}
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={18} color="var(--primary)" /> Target Search Domain
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
            placeholder="e.g. Java Full Stack, Python Developer, Frontend React"
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
            placeholder="Java, Spring Boot, React, MySQL, REST API"
          />
          <small style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
            The agent uses these keywords to search public job feeds every morning.
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
            placeholder="Remote, India, Hybrid"
          />
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />

        {/* Automation Thresholds */}
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={18} color="var(--primary)" /> Automation Criteria
        </h3>

        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>
              Minimum Match Score for Auto-Tailoring
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
              Automatically submits applications for discovered jobs meeting the minimum match threshold.
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

        <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '24px 0' }} />

        {/* Free AI Configuration */}
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '8px', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Key size={18} color="var(--primary)" /> Free AI Model Engine
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          You can provide a <strong style={{ color: '#f8fafc' }}>Google Gemini Free API Key</strong> (from Google AI Studio). If left blank, the application automatically uses the built-in smart NLP rule-based engine at 100% free of cost!
        </p>

        <div style={{ marginBottom: '28px' }}>
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

        <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '12px 24px' }}>
          {saving ? 'Saving...' : 'Save Agent Settings'}
        </button>
      </form>
    </div>
  );
}
