import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import JobFeed from './pages/JobFeed';
import ProfileEditor from './pages/ProfileEditor';
import TailoredResumes from './pages/TailoredResumes';
import Applications from './pages/Applications';
import AgentSettings from './pages/AgentSettings';
import { LayoutDashboard, Briefcase, FileText, FileCode2, Send, Settings, Bot, Menu, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('jobs');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    setMobileNavOpen(false);
  };

  return (
    <div className="app-container">
      {/* Mobile Top Header (Visible on screens <= 768px) */}
      <header className="mobile-header">
        <div className="brand" style={{ margin: 0, padding: 0 }}>
          <Bot size={24} />
          <span>JobAgent.ai</span>
        </div>
        <button
          className="mobile-menu-toggle"
          onClick={() => setMobileNavOpen(!mobileNavOpen)}
          aria-label="Toggle navigation menu"
        >
          {mobileNavOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Backdrop overlay for mobile */}
      {mobileNavOpen && (
        <div className="sidebar-backdrop" onClick={() => setMobileNavOpen(false)} />
      )}

      {/* Sidebar (Fixed on Desktop, Slide-out Drawer on Mobile) */}
      <aside className={`sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
        <div className="brand desktop-brand">
          <Bot size={28} />
          <span>JobAgent.ai</span>
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
        {activeTab === 'applications' && <Applications />}
        {activeTab === 'settings' && <AgentSettings />}
      </main>
    </div>
  );
}
