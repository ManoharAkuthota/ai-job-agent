import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import JobFeed from './pages/JobFeed';
import ProfileEditor from './pages/ProfileEditor';
import TailoredResumes from './pages/TailoredResumes';
import Applications from './pages/Applications';
import AgentSettings from './pages/AgentSettings';
import { LayoutDashboard, Briefcase, FileText, FileCode2, Send, Settings, Bot } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="brand">
          <Bot size={28} />
          <span>JobAgent.ai</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('jobs')}
            className={`nav-item ${activeTab === 'jobs' ? 'active' : ''}`}
          >
            <Briefcase size={18} />
            Job Feed
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
          >
            <FileCode2 size={18} />
            Master Resume
          </button>

          <button
            onClick={() => setActiveTab('resumes')}
            className={`nav-item ${activeTab === 'resumes' ? 'active' : ''}`}
          >
            <FileText size={18} />
            Tailored Resumes
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`nav-item ${activeTab === 'applications' ? 'active' : ''}`}
          >
            <Send size={18} />
            Applications
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          >
            <Settings size={18} />
            Settings
          </button>
        </nav>

        {/* System footer badge */}
        <div style={{
          background: '#f8fafc',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '12px',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600', color: '#10b981', marginBottom: '2px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
            Agent Active
          </div>
          <div>Spring Boot 3 + MySQL + React</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
        {activeTab === 'jobs' && <JobFeed onNavigate={setActiveTab} />}
        {activeTab === 'profile' && <ProfileEditor />}
        {activeTab === 'resumes' && <TailoredResumes />}
        {activeTab === 'applications' && <Applications />}
        {activeTab === 'settings' && <AgentSettings />}
      </main>
    </div>
  );
}
