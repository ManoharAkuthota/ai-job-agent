import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import JobFeed from './pages/JobFeed';
import ProfileEditor from './pages/ProfileEditor';
import TailoredResumes from './pages/TailoredResumes';
import Applications from './pages/Applications';
import AgentSettings from './pages/AgentSettings';
import InterviewPrep from './pages/InterviewPrep';
import LoginModal from './components/LoginModal';
import { getCurrentUser } from './services/api';
import { LayoutDashboard, Briefcase, FileText, FileCode2, Send, Settings, Bot, Menu, X, LogOut, UserCheck, GraduationCap } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('jobagent_user');
      const savedToken = localStorage.getItem('jobagent_token');
      if (savedUser && savedToken) {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      console.error("Error reading saved user session", e);
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState('jobs');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Validate session on app load
  useEffect(() => {
    const token = localStorage.getItem('jobagent_token');
    if (token) {
      getCurrentUser()
        .then((res) => {
          if (res.data) {
            setCurrentUser(res.data);
            localStorage.setItem('jobagent_user', JSON.stringify(res.data));
          }
        })
        .catch(() => {
          // Token invalid or expired
          handleLogout();
        });
    }
  }, []);

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    setMobileNavOpen(false);
  };

  const handleLoginSuccess = (user, token) => {
    setCurrentUser(user);
    setActiveTab('jobs');
  };

  const handleLogout = () => {
    localStorage.removeItem('jobagent_token');
    localStorage.removeItem('jobagent_user');
    setCurrentUser(null);
  };

  // If user is not authenticated, display the OLED Black Auth Screen
  if (!currentUser) {
    return <LoginModal onLoginSuccess={handleLoginSuccess} />;
  }

  // User initials for avatar
  const initials = (currentUser.fullName || 'User')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="app-container">
      {/* Mobile Top Header (Visible on screens <= 768px) */}
      <header className="mobile-header">
        <div className="mobile-brand-title">
          <Bot size={22} color="#818cf8" style={{ filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.7))' }} />
          <span>JobAgent<span style={{ color: '#818cf8' }}>.ai</span></span>
          <span className="mobile-status-pill">
            <span className="mobile-status-dot"></span>
            LIVE
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Quick Settings Icon Button */}
          <button
            onClick={() => handleSelectTab('settings')}
            title="Settings"
            style={{
              background: activeTab === 'settings' ? 'rgba(99, 102, 241, 0.25)' : '#0f172a',
              color: activeTab === 'settings' ? '#818cf8' : '#94a3b8',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Settings size={18} />
          </button>

          {/* User Profile Avatar Pill */}
          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            title="User Menu"
            style={{
              background: '#111827',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              borderRadius: '8px',
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#f8fafc',
              cursor: 'pointer'
            }}
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '10px'
            }}>
              {initials}
            </div>
            {mobileNavOpen ? <X size={16} color="#94a3b8" /> : <Menu size={16} color="#94a3b8" />}
          </button>
        </div>
      </header>

      {/* Backdrop overlay for mobile drawer */}
      {mobileNavOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileNavOpen(false)} />
      )}

      {/* Sidebar (Fixed on Desktop, Slide-out Drawer on Mobile) */}
      <aside className={`sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
        <div className="brand desktop-brand">
          <Bot size={28} />
          <span>JobAgent.ai</span>
        </div>

        {/* Logged-In User Profile Card */}
        <div style={{
          background: '#0c1220',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '10px',
          padding: '12px 14px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '13px',
              flexShrink: 0,
              boxShadow: '0 0 10px rgba(99, 102, 241, 0.5)'
            }}>
              {initials}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.fullName}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentUser.email}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Log Out"
            style={{
              background: 'none',
              color: '#94a3b8',
              padding: '6px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#f87171'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
          >
            <LogOut size={16} />
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <button
            onClick={() => handleSelectTab('jobs')}
            className={`nav-item ${activeTab === 'jobs' ? 'active' : ''}`}
          >
            <Briefcase size={18} />
            Job Feed
          </button>

          <button
            onClick={() => handleSelectTab('dashboard')}
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>

          <button
            onClick={() => handleSelectTab('profile')}
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          >
            <FileCode2 size={18} />
            Master Resume
          </button>

          <button
            onClick={() => handleSelectTab('resumes')}
            className={`nav-item ${activeTab === 'resumes' ? 'active' : ''}`}
          >
            <FileText size={18} />
            Tailored Resumes
          </button>

          <button
            onClick={() => handleSelectTab('prep')}
            className={`nav-item ${activeTab === 'prep' ? 'active' : ''}`}
          >
            <GraduationCap size={18} />
            Interview Prep
          </button>

          <button
            onClick={() => handleSelectTab('applications')}
            className={`nav-item ${activeTab === 'applications' ? 'active' : ''}`}
          >
            <Send size={18} />
            Applications
          </button>

          <button
            onClick={() => handleSelectTab('settings')}
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <Settings size={18} />
            Settings
          </button>
        </nav>

        {/* System footer badge */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: '#10b981', marginBottom: '2px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
            Agent Active
          </div>
          <div style={{ color: '#94a3b8' }}>Spring Boot 3 + MySQL + React</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard onNavigate={handleSelectTab} />}
        {activeTab === 'jobs' && <JobFeed onNavigate={handleSelectTab} />}
        {activeTab === 'profile' && <ProfileEditor />}
        {activeTab === 'resumes' && <TailoredResumes />}
        {activeTab === 'prep' && <InterviewPrep />}
        {activeTab === 'applications' && <Applications />}
        {activeTab === 'settings' && <AgentSettings />}
      </main>

      {/* Modern Frosted OLED Mobile Bottom Navigation Bar (Visible on screens <= 768px) */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        <button
          onClick={() => handleSelectTab('jobs')}
          className={`mobile-tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
          aria-label="Jobs Feed"
        >
          {activeTab === 'jobs' && <span className="mobile-tab-indicator" />}
          <Briefcase size={20} />
          <span>Jobs</span>
        </button>

        <button
          onClick={() => handleSelectTab('prep')}
          className={`mobile-tab-btn ${activeTab === 'prep' ? 'active' : ''}`}
          aria-label="Interview Prep"
        >
          {activeTab === 'prep' && <span className="mobile-tab-indicator" />}
          <GraduationCap size={20} />
          <span>Prep</span>
        </button>

        <button
          onClick={() => handleSelectTab('dashboard')}
          className={`mobile-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          aria-label="Dashboard"
        >
          {activeTab === 'dashboard' && <span className="mobile-tab-indicator" />}
          <LayoutDashboard size={20} />
          <span>Agent</span>
        </button>

        <button
          onClick={() => handleSelectTab('resumes')}
          className={`mobile-tab-btn ${activeTab === 'resumes' ? 'active' : ''}`}
          aria-label="Tailored Resumes"
        >
          {activeTab === 'resumes' && <span className="mobile-tab-indicator" />}
          <FileText size={20} />
          <span>Tailored</span>
        </button>

        <button
          onClick={() => handleSelectTab('applications')}
          className={`mobile-tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
          aria-label="Application Tracker"
        >
          {activeTab === 'applications' && <span className="mobile-tab-indicator" />}
          <Send size={20} />
          <span>Tracker</span>
        </button>
      </nav>
    </div>
  );
}
