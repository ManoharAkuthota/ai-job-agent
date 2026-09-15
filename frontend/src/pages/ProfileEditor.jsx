import React, { useState, useEffect, useRef } from 'react';
import { getProfile, saveProfile, uploadResume } from '../services/api';
import { User, Mail, Phone, MapPin, Globe, Award, CheckCircle2, Save, UploadCloud, RefreshCw } from 'lucide-react';

export default function ProfileEditor() {
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    targetDomain: '',
    summary: '',
    skills: '',
    experience: '',
    education: ''
  });
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getProfile()
      .then((res) => {
        if (res.data) setProfile(res.data);
      })
      .catch((err) => console.error("Error loading profile:", err));
  }, []);

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingResume(true);
    try {
      const res = await uploadResume(file);
      if (res.data && res.data.profile) {
        setProfile(res.data.profile);
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 4000);
      }
    } catch (err) {
      alert("Error parsing uploaded resume: " + (err.response?.data?.error || err.message));
    } finally {
      setUploadingResume(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      await saveProfile(profile);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      alert("Error saving profile: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px' }}>
      <div className="top-header">
        <div>
          <h2 className="page-title">Master Resume & Profile</h2>
          <p className="page-subtitle">The AI Agent uses this profile to calculate match scores and customize your resume daily.</p>
        </div>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            style={{ display: 'none' }}
            onChange={handleResumeUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            disabled={uploadingResume}
            className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {uploadingResume ? <RefreshCw size={16} className="spin" /> : <UploadCloud size={16} />}
            {uploadingResume ? 'Parsing PDF...' : 'Upload PDF to Auto-Fill'}
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div style={{
          background: '#ecfdf5',
          border: '1px solid #a7f3d0',
          borderRadius: '8px',
          padding: '12px 18px',
          marginBottom: '20px',
          color: '#065f46',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <CheckCircle2 size={18} color="#10b981" />
          <span>Profile saved! The AI Agent will use these updated details for future job tailorings.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '28px' }}>
        {/* Basic Information */}
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1e293b' }}>Contact & Basics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Full Name</label>
            <input type="text" name="fullName" value={profile.fullName || ''} onChange={handleChange} required />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Email Address</label>
            <input type="email" name="email" value={profile.email || ''} onChange={handleChange} required />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Phone Number</label>
            <input type="text" name="phone" value={profile.phone || ''} onChange={handleChange} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Location (City, Country)</label>
            <input type="text" name="location" value={profile.location || ''} onChange={handleChange} />
          </div>
        </div>

        {/* Links */}
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1e293b' }}>Links & Online Presence</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>LinkedIn URL</label>
            <input type="url" name="linkedinUrl" placeholder="https://linkedin.com/in/..." value={profile.linkedinUrl || ''} onChange={handleChange} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>GitHub URL</label>
            <input type="url" name="githubUrl" placeholder="https://github.com/..." value={profile.githubUrl || ''} onChange={handleChange} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Portfolio Website</label>
            <input type="url" name="portfolioUrl" placeholder="https://..." value={profile.portfolioUrl || ''} onChange={handleChange} />
          </div>
        </div>

        {/* Target Domain & Skills */}
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1e293b' }}>Target Domain & Technical Skills</h3>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Target Domain / Primary Job Title
          </label>
          <input
            type="text"
            name="targetDomain"
            placeholder="e.g. Java Full Stack Developer, React Frontend Engineer"
            value={profile.targetDomain || ''}
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Technical Skills (Comma separated)
          </label>
          <textarea
            rows="3"
            name="skills"
            placeholder="Java, Spring Boot, React, MySQL, Hibernate, REST APIs, Git, Docker, HTML/CSS, Maven"
            value={profile.skills || ''}
            onChange={handleChange}
          />
        </div>

        {/* Summary & Experience */}
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#1e293b' }}>Summary & Experience</h3>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Base Professional Summary
          </label>
          <textarea
            rows="3"
            name="summary"
            placeholder="A concise overview of your background, experience, and key technical strengths..."
            value={profile.summary || ''}
            onChange={handleChange}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Work Experience & Key Projects (Bullet points)
          </label>
          <textarea
            rows="6"
            name="experience"
            placeholder="• Engineered RESTful APIs using Spring Boot and connected to MySQL&#10;• Developed interactive user interfaces using React and Vite&#10;• Reduced latency and optimized queries..."
            value={profile.experience || ''}
            onChange={handleChange}
          />
        </div>

        <div style={{ marginBottom: '28px' }}>
          <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
            Education & Certifications
          </label>
          <textarea
            rows="2"
            name="education"
            placeholder="Bachelor of Technology in Computer Science & Engineering (2020 - 2024)"
            value={profile.education || ''}
            onChange={handleChange}
          />
        </div>

        <button type="submit" disabled={saving} className="btn-primary" style={{ padding: '12px 24px' }}>
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Master Profile'}
        </button>
      </form>
    </div>
  );
}
