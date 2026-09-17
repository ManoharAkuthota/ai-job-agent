import React, { useState, useEffect, useRef } from 'react';
import { getProfile, saveProfile, uploadResume } from '../services/api';
import { User, Mail, Phone, MapPin, Globe, Award, CheckCircle2, Save, UploadCloud, RefreshCw } from 'lucide-react';

const DEFAULT_PROFILE = {
  fullName: 'Akuthota Manohar',
  email: 'manoharsriakuthota@gmail.com',
  phone: '8096870549',
  location: 'Ahmedabad, India',
  linkedinUrl: 'https://linkedin.com/in/manoharsriakuthota',
  githubUrl: 'https://github.com/ManoharAkuthota',
  portfolioUrl: '',
  targetDomain: 'Java Full Stack Developer',
  summary: 'Computer Science (AI) graduate and Java developer with hands-on experience building backend microservices for a production CPaaS (Communications Platform as a Service) using Spring Boot, Spring Security, JWT, and Apache Kafka. Combines strong full-stack fundamentals (Java, JavaScript, React, Angular) with practical experience across content strategy and web development. Proven ability to design secure, scalable systems and deliver responsive, user-friendly applications.',
  skills: 'Java, Spring Boot, Spring Security, JWT, Microservices, Apache Kafka, React, Angular, Node.js, Express, MySQL, MongoDB, GitHub, REST APIs, Postman, JavaScript, Python, HTML, CSS, DSA',
  experience: 'Junior Java Developer | Keyanna Technologies, Ahmedabad (Jan 2026 - Present)\n- Built and maintained backend microservices for the company CPaaS product using Spring Boot.\n- Implemented secure authentication and authorization flows with Spring Security and JWT-based token management.\n- Integrated Apache Kafka for real-time, event-driven messaging between services.\n\nContent Writer | Parul University, Vadodara (Apr 2025 - Dec 2025)\n- Created and oversaw academic and technical content for the CDOE department.\n\nWeb Developer Intern | Talent Lad, Vijayawada (Feb 2025 - May 2025)\n- Designed and developed responsive, mobile-friendly web pages using HTML, CSS, and JavaScript.',
  education: 'B.Tech in Computer Science (Artificial Intelligence) | Parul University, Vadodara (2022 - 2026) -- CGPA: 8.26/10\nClass XII | Sri Vidwan Junior College, Warangal, Telangana (2020 - 2022) -- Score: 96.4%\nClass X | Vidyodaya High School, Nekkonda, Warangal, Telangana (2019 - 2020) -- GPA: 10/10'
};

export default function ProfileEditor({ onNavigate }) {
  const [profile, setProfile] = useState(DEFAULT_PROFILE);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getProfile()
      .then((res) => {
        if (res?.data && res.data.fullName) setProfile(res.data);
      })
      .catch((err) => console.warn("Using instant local profile defaults:", err));
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
          <span>Profile saved! The AI Agent will use these updated details for future job tailorings.</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ background: '#0b0f19', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '28px' }}>
        {/* Basic Information */}
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#ffffff' }}>Contact & Basics</h3>
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
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#ffffff' }}>Links & Online Presence</h3>
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
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#ffffff' }}>Target Domain & Technical Skills</h3>
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
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: '#ffffff' }}>Summary & Experience</h3>
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
