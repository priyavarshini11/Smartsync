import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const AuthPage = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ email: '', password: '', username: '', adminId: '', pin: '', recoveryKey: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(true);

  // Generate completely random names on mount so Chrome's history can never match them
  const [randomNames] = useState({
    username: 'u_' + Math.random().toString(36).substr(2, 9),
    password: 'p_' + Math.random().toString(36).substr(2, 9),
    email: 'e_' + Math.random().toString(36).substr(2, 9),
    adminId: 'a_' + Math.random().toString(36).substr(2, 9),
    pin: 'pin_' + Math.random().toString(36).substr(2, 9),
    recoveryKey: 'rk_' + Math.random().toString(36).substr(2, 9),
  });

  // Clear form fields when the component opens/mounts to prevent previous credentials from showing
  useEffect(() => {
    setForm({ email: '', password: '', username: '', adminId: '', pin: '', recoveryKey: '' });
    setShowPassword(false);
    setShowPin(false);
    setIsReadOnly(true);
  }, [mode, selectedRole]);
  const { signup, login, adminLogin, setUsername } = useContext(AuthContext);
  const navigate = useNavigate();

  // Admin PIN system state
  const [adminSetupComplete, setAdminSetupComplete] = useState(null);
  const [adminMode, setAdminMode] = useState('login'); // login | setup | reset | credentials
  const [credentials, setCredentials] = useState(null);
  const [credentialsSaved, setCredentialsSaved] = useState(false);

  // Check admin setup status when admin role selected
  useEffect(() => {
    if (selectedRole === 'admin') {
      api.get('/admin/auth/status').then(data => {
        setAdminSetupComplete(data.setupComplete);
        setAdminMode(data.setupComplete ? 'login' : 'setup');
      }).catch(() => setAdminSetupComplete(false));
    }
  }, [selectedRole]);

  const handleChange = (e) => { setForm(prev => ({ ...prev, [e.target.name]: e.target.value })); setError(''); };

  const handleSignup = async (e) => {
    e.preventDefault(); setLoading(true);
    try { await signup(form.email, form.password, selectedRole); setMode('username'); setError(''); }
    catch (err) { setError(err.message); }
    setLoading(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const user = await login(form.username, form.password, selectedRole);
      if (user.role === 'admin' || user.role === 'admin_faculty' || user.isMainAdmin) {
        navigate('/admin');
      } else if (user.role === 'faculty') {
        navigate('/faculty');
      } else {
        navigate('/student');
      }
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const handleSetUsername = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const user = await setUsername(form.username);
      if (user.role === 'admin' || user.role === 'admin_faculty' || user.isMainAdmin) {
        navigate('/admin');
      } else if (user.role === 'faculty') {
        navigate('/faculty');
      } else {
        navigate('/onboarding');
      }
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  // Admin PIN handlers
  const handleAdminSetup = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const data = await api.post('/admin/auth/setup', { adminId: form.adminId });
      setCredentials({ adminId: data.adminId, pin: data.pin, recoveryKey: data.recoveryKey });
      setAdminMode('credentials');
    } catch (err) { setError(err.message || 'Setup failed'); }
    setLoading(false);
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await adminLogin(form.adminId, form.pin);
      navigate('/admin');
    } catch (err) { setError(err.message || 'Login failed'); }
    setLoading(false);
  };

  const handlePinReset = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const data = await api.post('/admin/auth/reset-pin', { adminId: form.adminId, recoveryKey: form.recoveryKey });
      setCredentials({ adminId: form.adminId, pin: data.newPin, recoveryKey: data.newRecoveryKey });
      setAdminMode('credentials');
      setCredentialsSaved(false);
    } catch (err) { setError(err.message || 'Reset failed'); }
    setLoading(false);
  };

  const handleCredentialsDone = async () => {
    try {
      await adminLogin(credentials.adminId, credentials.pin);
      navigate('/admin');
    } catch { navigate('/auth'); }
  };

  const cardStyle = { maxWidth: '460px', width: '100%', padding: '2.5rem', animation: 'fadeSlideUp 0.4s ease-out', margin: 'auto' };
  const pageStyle = { minHeight: '100vh', display: 'flex', flexDirection: 'column', padding: '2rem 1rem', background: 'var(--bg-gradient)', backgroundAttachment: 'fixed' };

  const LogoBlock = ({ subtitle }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.2))' }}>
            <defs>
              <linearGradient id="authGrad1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4F46E5" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
              <linearGradient id="authGrad2" x1="1" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            <rect x="4" y="4" width="11" height="11" rx="3.5" fill="url(#authGrad1)" fillOpacity="0.95" />
            <rect x="9" y="9" width="11" height="11" rx="3.5" fill="url(#authGrad2)" fillOpacity="0.95" />
          </svg>
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0, lineHeight: 1 }}>Smart Sync</h1>
      </div>
      <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{subtitle}</p>
    </div>
  );

  const ErrorBox = () => error ? (
    <div style={{ padding: '0.75rem 1rem', background: 'var(--danger-bg)', borderRadius: 'var(--radius-sm)', color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem', fontWeight: 500 }}>{error}</div>
  ) : null;

  const BgOrbs = () => (
    <>
      <div style={{ position: 'fixed', top: '-20%', right: '-10%', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-20%', left: '-10%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
    </>
  );

  // ============ ADMIN: CREDENTIALS DISPLAY (one-time) ============
  if (selectedRole === 'admin' && adminMode === 'credentials' && credentials) {
    return (
      <div style={pageStyle}><BgOrbs />
        <div className="card" style={{ ...cardStyle, maxWidth: '520px' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔐</div>
            <h2 style={{ fontWeight: 800, fontSize: '1.3rem', marginBottom: '0.25rem' }}>Save Your Credentials</h2>
            <p style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 600 }}>⚠️ These will NEVER be shown again!</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              { label: 'Admin ID', value: credentials.adminId, icon: '🆔' },
              { label: 'Permanent PIN', value: credentials.pin, icon: '🔑' },
              { label: 'Recovery Key', value: credentials.recoveryKey, icon: '🛡️' },
            ].map(item => (
              <div key={item.label} style={{ padding: '1rem 1.25rem', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>{item.icon}</span>
                    <span className="text-xs text-muted" style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>{item.label}</span>
                  </div>
                  <button 
                    onClick={() => navigator.clipboard.writeText(item.value)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                    onMouseOver={e => e.currentTarget.style.color = 'var(--accent)'}
                    onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                    Copy
                  </button>
                </div>
                <p style={{ fontFamily: 'monospace', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.1em', wordBreak: 'break-all', color: 'var(--accent)' }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>

          <div style={{ padding: '0.875rem 1rem', background: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--warning)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
            <strong>Instructions:</strong><br />
            • Write down or securely store your <strong>PIN</strong> and <strong>Recovery Key</strong><br />
            • The PIN is used for every admin login<br />
            • The Recovery Key is used ONLY to reset a forgotten PIN<br />
            • Neither can be recovered from the system
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', cursor: 'pointer', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', background: credentialsSaved ? 'var(--success-bg)' : 'var(--bg-glass)', border: `1px solid ${credentialsSaved ? 'var(--success)' : 'var(--border-glass)'}`, marginBottom: '1rem', transition: 'all 0.2s' }}>
            <input type="checkbox" checked={credentialsSaved} onChange={e => setCredentialsSaved(e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--success)' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: credentialsSaved ? 'var(--success)' : 'var(--text-secondary)' }}>
              I have securely saved my PIN and Recovery Key
            </span>
          </label>

          <button className="btn btn-primary btn-block" disabled={!credentialsSaved} onClick={handleCredentialsDone} style={{ padding: '0.875rem' }}>
            Continue to Dashboard →
          </button>
        </div>
      </div>
    );
  }

  // ============ ADMIN AUTH SCREENS (setup/login/reset) ============
  if (selectedRole === 'admin') {
    return (
      <div style={pageStyle}><BgOrbs />
        <div className="card" style={cardStyle}>
          <LogoBlock subtitle={
            adminMode === 'setup' ? 'Set up your Admin account' :
            adminMode === 'reset' ? 'Reset your PIN using Recovery Key' :
            'Enter your Admin credentials'
          } />

          <button className="btn btn-ghost" onClick={() => { setSelectedRole(null); setAdminMode('login'); setError(''); setCredentials(null); setForm({ email: '', password: '', username: '', adminId: '', pin: '', recoveryKey: '' }); setShowPassword(false); setShowPin(false); }}
            style={{ marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            ← Back to role selection
          </button>

          <ErrorBox />

          {/* ADMIN SETUP */}
          {adminMode === 'setup' && (
            <form onSubmit={handleAdminSetup} autoComplete="off">
              <div style={{ padding: '0.75rem 1rem', background: 'var(--accent-bg)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--accent)', marginBottom: '1.25rem', fontWeight: 500 }}>
                🛡️ First-time setup — choose your Admin ID. A secure PIN and Recovery Key will be auto-generated.
              </div>
              <div className="form-group">
                <label className="form-label">Admin ID</label>
                <input className="form-input" name={randomNames.adminId} value={form.adminId} onChange={(e) => { setForm(prev => ({...prev, adminId: e.target.value})); setError(''); }} placeholder="e.g., main_admin" required minLength={3} autoComplete="new-password" readOnly={isReadOnly} onFocus={() => setIsReadOnly(false)} />
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Min 3 characters. This is your permanent admin identifier.</p>
              </div>
              <button className="btn btn-primary btn-block" type="submit" disabled={loading} style={{ padding: '0.875rem' }}>
                {loading ? 'Setting up...' : '🔐 Generate Credentials'}
              </button>
            </form>
          )}

          {/* ADMIN PIN LOGIN */}
          {adminMode === 'login' && adminSetupComplete && (
            <form onSubmit={handleAdminLogin} autoComplete="off">
              <div style={{ padding: '0.75rem 1rem', background: 'var(--accent-bg)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--accent)', marginBottom: '1.25rem', fontWeight: 500 }}>
                💡 <strong>Main Admin</strong>: Use your Admin ID and PIN here.<br />
                <strong>Admin Faculty</strong>: Please go back and use the standard "Lecturer" login with your Username & Password.
              </div>
              <div className="form-group">
                <label className="form-label">Admin ID</label>
                <input className="form-input" name={randomNames.adminId} value={form.adminId} onChange={(e) => { setForm(prev => ({...prev, adminId: e.target.value})); setError(''); }} placeholder="Your admin ID" required autoComplete="new-password" readOnly={isReadOnly} onFocus={() => setIsReadOnly(false)} />
              </div>
              <div className="form-group">
                <label className="form-label">PIN</label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input className="form-input" name={randomNames.pin} type={showPin ? "text" : "password"} value={form.pin} onChange={(e) => { setForm(prev => ({...prev, pin: e.target.value})); setError(''); }} placeholder="••••••" required autoComplete="new-password"
                    style={{ letterSpacing: '0.25em', fontSize: '1.1rem', textAlign: 'center', paddingRight: '3rem', width: '100%' }} maxLength={6} inputMode="numeric" readOnly={isReadOnly} onFocus={() => setIsReadOnly(false)} />
                  <button type="button" onClick={() => setShowPin(!showPin)} style={{ position: 'absolute', right: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {showPin ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <button className="btn btn-primary btn-block" type="submit" disabled={loading} style={{ padding: '0.875rem' }}>
                {loading ? 'Verifying...' : '🔓 Unlock Dashboard'}
              </button>
              <button type="button" className="btn btn-ghost btn-block" onClick={() => { setAdminMode('reset'); setError(''); }}
                style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Forgot PIN? Reset with Recovery Key
              </button>
            </form>
          )}

          {/* ADMIN PIN LOADING */}
          {adminMode === 'login' && adminSetupComplete === null && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p className="text-muted">Checking admin status...</p>
            </div>
          )}

          {/* ADMIN PIN RESET */}
          {adminMode === 'reset' && (
            <form onSubmit={handlePinReset} autoComplete="off">
              <div style={{ padding: '0.75rem 1rem', background: 'var(--warning-bg)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--warning)', marginBottom: '1.25rem', fontWeight: 500 }}>
                ⚠️ Enter your Recovery Key to generate a new PIN. Both PIN and Recovery Key will be replaced.
              </div>
              <div className="form-group">
                <label className="form-label">Admin ID</label>
                <input className="form-input" name={randomNames.adminId} value={form.adminId} onChange={(e) => { setForm(prev => ({...prev, adminId: e.target.value})); setError(''); }} placeholder="Your admin ID" required autoComplete="new-password" readOnly={isReadOnly} onFocus={() => setIsReadOnly(false)} />
              </div>
              <div className="form-group">
                <label className="form-label">Recovery Key</label>
                <input className="form-input" name={randomNames.recoveryKey} value={form.recoveryKey} onChange={(e) => { setForm(prev => ({...prev, recoveryKey: e.target.value})); setError(''); }} placeholder="24-character recovery key" required autoComplete="new-password"
                  style={{ fontFamily: 'monospace', letterSpacing: '0.05em' }} readOnly={isReadOnly} onFocus={() => setIsReadOnly(false)} />
              </div>
              <button className="btn btn-primary btn-block" type="submit" disabled={loading} style={{ padding: '0.875rem' }}>
                {loading ? 'Resetting...' : '🔄 Reset PIN'}
              </button>
              <button type="button" className="btn btn-ghost btn-block" onClick={() => { setAdminMode('login'); setError(''); }}
                style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                ← Back to PIN login
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ============ ROLE SELECTION SCREEN ============
  if (!selectedRole && mode !== 'username') {
    return (
      <div style={pageStyle}><BgOrbs />
        <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '2.5rem', animation: 'fadeSlideUp 0.4s ease-out', margin: 'auto' }}>
          <LogoBlock subtitle="Select your role to continue" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { role: 'student', label: "I'm a Student", desc: 'Access personalized resources, assignments & notes', color: 'var(--color-aiml)',
                icon: <><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 4 3 6 3s6-1 6-3v-5"/></> },
              { role: 'faculty', label: "I'm a Faculty", desc: 'Upload & manage resources for your students', color: 'var(--color-ds)',
                icon: <><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></> },
            ].map(item => (
              <button key={item.role} onClick={() => setSelectedRole(item.role)} style={{
                display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1.5rem', borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-glass)', border: '1.5px solid var(--border-glass)', cursor: 'pointer', transition: 'all 0.25s ease', textAlign: 'left', width: '100%'
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-bg)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-glass)'; e.currentTarget.style.background = 'var(--bg-glass)'; e.currentTarget.style.transform = 'none'; }}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{item.icon}</svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{item.label}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.4 }}>{item.desc}</div>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" style={{ marginLeft: 'auto', flexShrink: 0 }}><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-glass)' }}>
            <button onClick={() => setSelectedRole('admin')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: '0.375rem', transition: 'color 0.2s ease' }}
              onMouseOver={e => e.currentTarget.style.color = 'var(--accent)'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              Admin Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============ STUDENT / TEACHER LOGIN/SIGNUP ============
  return (
    <div style={pageStyle}><BgOrbs />
      <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '2.5rem', animation: 'fadeSlideUp 0.4s ease-out', margin: 'auto' }}>
        <LogoBlock subtitle={
          mode === 'login' ? `Welcome back, ${selectedRole === 'faculty' ? 'Faculty' : 'Student'}! Sign in to continue.` :
          mode === 'signup' ? `Create your ${selectedRole === 'faculty' ? 'Faculty' : 'Student'} account.` :
          'Choose a unique username.'
        } />

        {mode !== 'username' && (
          <>
            <div className="tabs" style={{ marginBottom: '1.5rem' }}>
              <button className={`tab-item ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); setForm({ email: '', password: '', username: '', adminId: '', pin: '', recoveryKey: '' }); setShowPassword(false); setShowPin(false); }} style={{ flex: 1 }}>Sign In</button>
              <button className={`tab-item ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); setError(''); setForm({ email: '', password: '', username: '', adminId: '', pin: '', recoveryKey: '' }); setShowPassword(false); setShowPin(false); }} style={{ flex: 1 }}>Sign Up</button>
            </div>
            <button className="btn btn-ghost" onClick={() => { setSelectedRole(null); setMode('login'); setError(''); setForm({ email: '', password: '', username: '', adminId: '', pin: '', recoveryKey: '' }); setShowPassword(false); setShowPin(false); }} style={{ marginBottom: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              ← Change role ({selectedRole === 'faculty' ? 'Faculty' : 'Student'})
            </button>
          </>
        )}

        <ErrorBox />

        {mode === 'login' && (
          <form onSubmit={handleLogin} autoComplete="off">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input className="form-input" name={randomNames.username} value={form.username} onChange={(e) => { setForm(prev => ({...prev, username: e.target.value})); setError(''); }} placeholder="Your username" required autoComplete="new-password" readOnly={isReadOnly} onFocus={() => setIsReadOnly(false)} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input className="form-input" name={randomNames.password} type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => { setForm(prev => ({...prev, password: e.target.value})); setError(''); }} placeholder="••••••••" required autoComplete="new-password" style={{ paddingRight: '3rem', width: '100%' }} readOnly={isReadOnly} onFocus={() => setIsReadOnly(false)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.875rem' }}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        )}

        {mode === 'signup' && (
          <form onSubmit={handleSignup} autoComplete="off">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input className="form-input" name={randomNames.email} type="email" value={form.email} onChange={(e) => { setForm(prev => ({...prev, email: e.target.value})); setError(''); }} placeholder="you@example.com" required autoComplete="new-password" readOnly={isReadOnly} onFocus={() => setIsReadOnly(false)} />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input className="form-input" name={randomNames.password} type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => { setForm(prev => ({...prev, password: e.target.value})); setError(''); }} placeholder="Min 4 characters" required minLength={4} autoComplete="new-password" style={{ paddingRight: '3rem', width: '100%' }} readOnly={isReadOnly} onFocus={() => setIsReadOnly(false)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={loading} style={{ marginTop: '0.5rem', padding: '0.875rem' }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        )}

        {mode === 'username' && (
          <form onSubmit={handleSetUsername} autoComplete="off">
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <span style={{ fontSize: '2rem' }}>🎉</span>
              <p style={{ fontWeight: 600, marginTop: '0.5rem' }}>Account created!</p>
            </div>
            <div className="form-group">
              <label className="form-label">Choose Your Username</label>
              <input className="form-input" name={randomNames.username} value={form.username} onChange={(e) => { setForm(prev => ({...prev, username: e.target.value})); setError(''); }} placeholder="e.g., john_doe" required minLength={3} autoComplete="new-password" readOnly={isReadOnly} onFocus={() => setIsReadOnly(false)} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.375rem' }}>Min 3 characters. This will be used for future logins.</p>
            </div>
            <button className="btn btn-primary btn-block" type="submit" disabled={loading} style={{ padding: '0.875rem' }}>
              {loading ? 'Setting...' : 'Set Username & Continue'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
