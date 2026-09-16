import React, { useState } from 'react';
import { login, register } from '../services/api';
import { Bot, Mail, Lock, User, ArrowRight, Sparkles, CheckCircle2, AlertCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function LoginModal({ onLoginSuccess }) {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errorMessage) setErrorMessage(null);
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await login('manohar@jobagent.ai', 'Password@123');
      if (res.data && res.data.token) {
        localStorage.setItem('jobagent_token', res.data.token);
        localStorage.setItem('jobagent_user', JSON.stringify(res.data.user));
        onLoginSuccess(res.data.user, res.data.token);
      }
    } catch (err) {
      console.error("Demo login error:", err);
      setErrorMessage(err.response?.data?.error || "Unable to reach server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (isRegister) {
      if (!formData.fullName.trim()) {
        setErrorMessage("Please enter your full name.");
        return;
      }
      if (formData.password.length < 6) {
        setErrorMessage("Password must be at least 6 characters.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setErrorMessage("Passwords do not match.");
        return;
      }
    }

    setLoading(true);
    try {
      let res;
      if (isRegister) {
        res = await register(formData.fullName, formData.email, formData.password);
      } else {
        res = await login(formData.email, formData.password);
      }

      if (res.data && res.data.token) {
        localStorage.setItem('jobagent_token', res.data.token);
        localStorage.setItem('jobagent_user', JSON.stringify(res.data.user));
        onLoginSuccess(res.data.user, res.data.token);
      }
    } catch (err) {
      console.error("Auth error:", err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || "Authentication failed.";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#030712',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Neon Glow Accents */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '20%',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-15%',
        right: '20%',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16, 185, 129, 0.12) 0%, rgba(0,0,0,0) 70%)',
        filter: 'blur(50px)',
        pointerEvents: 'none'
      }} />

      {/* Main Authentication Card */}
      <div style={{
        width: '100%',
        maxWidth: '460px',
        background: '#0b0f19',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '36px 28px',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(99, 102, 241, 0.1)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(56, 189, 248, 0.2) 100%)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            color: '#818cf8',
            marginBottom: '14px',
            boxShadow: '0 0 24px rgba(99, 102, 241, 0.35)'
          }}>
            <Bot size={32} />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', letterSpacing: '-0.5px' }}>
            JobAgent<span style={{ color: '#818cf8' }}>.ai</span>
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>
            Autonomous AI Career Portal & Intelligent Job Matcher
          </p>
        </div>

        {/* 1-Click Quick Demo Login Button */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={loading}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '14px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 18px rgba(16, 185, 129, 0.35)',
            marginBottom: '20px',
            transition: 'all 0.2s ease'
          }}
        >
          <Sparkles size={16} />
          <span>Quick 1-Click Demo Login</span>
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          color: '#64748b',
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
          <span>or continue with email</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
        </div>

        {/* Tabs: Sign In / Create Account */}
        <div style={{
          display: 'flex',
          background: '#070b14',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '22px',
          border: '1px solid rgba(255, 255, 255, 0.08)'
        }}>
          <button
            type="button"
            onClick={() => { setIsRegister(false); setErrorMessage(null); }}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              background: !isRegister ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' : 'transparent',
              color: !isRegister ? '#ffffff' : '#94a3b8',
              boxShadow: !isRegister ? '0 2px 8px rgba(79, 70, 229, 0.4)' : 'none'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setErrorMessage(null); }}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: '600',
              background: isRegister ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' : 'transparent',
              color: isRegister ? '#ffffff' : '#94a3b8',
              boxShadow: isRegister ? '0 2px 8px rgba(79, 70, 229, 0.4)' : 'none'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error Feedback Message */}
        {errorMessage && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#f87171',
            fontSize: '13px',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isRegister && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                Full Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="text"
                  name="fullName"
                  placeholder="e.g. Manohar Akuthota"
                  value={formData.fullName}
                  onChange={handleChange}
                  required={isRegister}
                  style={{ paddingLeft: '38px', background: '#0f172a' }}
                />
              </div>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="email"
                name="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                style={{ paddingLeft: '38px', background: '#0f172a' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                style={{ paddingLeft: '38px', paddingRight: '38px', background: '#0f172a' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  color: '#64748b',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#cbd5e1', marginBottom: '6px' }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <ShieldCheck size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required={isRegister}
                  style={{ paddingLeft: '38px', background: '#0f172a' }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              padding: '12px',
              fontSize: '14px',
              fontWeight: '700',
              marginTop: '8px'
            }}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : isRegister ? (
              <>
                <span>Create Account</span>
                <ArrowRight size={16} />
              </>
            ) : (
              <>
                <span>Sign In to Dashboard</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Demo credentials hint */}
        <div style={{
          marginTop: '22px',
          padding: '10px 14px',
          background: '#070b14',
          borderRadius: '8px',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          fontSize: '12px',
          color: '#94a3b8',
          textAlign: 'center'
        }}>
          <div><strong>Demo Credentials:</strong></div>
          <div style={{ color: '#cbd5e1', marginTop: '2px' }}>
            Email: <code style={{ color: '#818cf8', background: '#0f172a', padding: '2px 6px', borderRadius: '4px' }}>manohar@jobagent.ai</code>
            <br />
            Password: <code style={{ color: '#818cf8', background: '#0f172a', padding: '2px 6px', borderRadius: '4px' }}>Password@123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
