import React, { useContext } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { ThemeContext } from '../../context/ThemeContext';
import { subscribeToNotifications } from '../../utils/notifications';
import { useEffect } from 'react';
import BranchSelectionModal from './BranchSelectionModal';
import GoToTop from './GoToTop';


const AppShell = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const location = useLocation();
  const role = user?.role || 'student';

  useEffect(() => {
    if (user) {
      subscribeToNotifications();
    }
  }, [user]);

  const navItems = {
    student: [
      { to: '/student', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', label: 'Home' },
      { to: '/student/favorites', icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', label: 'Favorites' },
      { to: '/student/faculty', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', label: 'My Faculty' },
      { divider: true },
      { to: '/student?filter=PDF', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', label: 'PDF' },
      { to: '/student?filter=Notes', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', label: 'Notes' },
      { to: '/student?filter=Assignment', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', label: 'Assignment' },
      { to: '/student?filter=Notice', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', label: 'Notice' },
      { to: '/student?filter=Project', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', label: 'Project' },
      { to: '/student?filter=Case Study', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', label: 'Case Study' },
      { to: '/student?filter=Images', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', label: 'Images' },
      { to: '/student?filter=Videos', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', label: 'Videos' },
      { to: '/student?filter=Link', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', label: 'Links' },
      { to: '/student?filter=Timetable', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', label: 'Time Table' },
      { to: '/student?filter=Syllabus', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', label: 'Syllabus' }
    ],
    faculty: [
      { to: '/faculty', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', label: 'Dashboard' },
      { to: '/faculty/upload', icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12', label: 'Upload' },
      { to: '/faculty/my-uploads', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', label: 'My Files' },
      { to: '/faculty/users', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', label: 'Students' },
    ],
    admin_faculty: [
      { to: '/admin', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', label: 'Overview' },
      { to: '/admin/resources', icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15', label: 'Resources' },
      { to: '/admin/taxonomy', icon: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z', label: 'Taxonomy' },
      { to: '/admin/upload', icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12', label: 'Upload' },
      { to: '/admin/my-uploads', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', label: 'My Files' },
      { to: '/admin/users', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', label: 'Students' },
      { to: '/admin/recycle', icon: 'M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2', label: 'Recycle' },
    ],
    admin: [
      { to: '/admin', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', label: 'Overview' },
      { to: '/admin/resources', icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15', label: 'Resources' },
      { to: '/admin/taxonomy', icon: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z', label: 'Taxonomy' },
      { to: '/admin/upload', icon: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12', label: 'Upload' },
      { to: '/admin/my-uploads', icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z', label: 'My Files' },
      { to: '/admin/users', icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75', label: 'Users' },
      { to: '/admin/recycle', icon: 'M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2', label: 'Recycle' },
      { to: '/admin/access', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', label: 'Admin Access' },
    ],
  };

  const items = navItems[role] || navItems.student;

  const handleLogout = () => { logout(); navigate('/auth'); };

  return (
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <aside className="app-sidebar hide-mobile">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem', paddingLeft: '0.5rem' }}>
          <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))' }}>
              <defs>
                <linearGradient id="navGrad1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
                <linearGradient id="navGrad2" x1="1" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#06B6D4" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
              <rect x="4" y="4" width="11" height="11" rx="3.5" fill="url(#navGrad1)" fillOpacity="0.95" />
              <rect x="9" y="9" width="11" height="11" rx="3.5" fill="url(#navGrad2)" fillOpacity="0.95" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', lineHeight: 1.1 }}>Smart Sync</div>
            <div style={{ fontSize: '0.65rem', color: (role === 'admin_faculty' || role === 'cr') ? 'var(--warning)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: (role === 'admin_faculty' || role === 'cr') ? 700 : 400 }}>
              {(role === 'admin_faculty' || role === 'faculty') 
                ? `${role === 'admin_faculty' ? 'ADMIN FACULTY' : 'FACULTY'}${user?.profile?.branch ? ' • ' + user.profile.branch.replace(/^br_/, '').toUpperCase() : ''}` 
                : role === 'cr' ? 'STUDENT (CR)' : 'STUDENT'}
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', overflowY: 'auto' }} className="hide-scrollbar">
          {items.map((item, index) => {
            if (item.divider) {
              return <div key={`div-${index}`} style={{ height: 1, background: 'var(--border-glass)', margin: '0.5rem 0' }} />;
            }
            const isFilter = item.to?.includes('?filter=');
            const isActiveMatch = isFilter 
              ? location.pathname === '/student' && location.search.includes(item.to.split('?')[1])
              : location.pathname === item.to;
              
            return (
              <NavLink key={item.label || item.to} to={item.to} end={!isFilter} className={`nav-item ${isActiveMatch ? 'active' : ''}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d={item.icon} />
                </svg>
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Area */}
        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {/* Theme & Notifications */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{theme === 'dark' ? '🌙 Dark' : '☀️ Light'}</span>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button onClick={subscribeToNotifications} title="Enable Notifications" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </button>
              <div className="theme-toggle" onClick={toggleTheme} />
            </div>
          </div>
          {/* Profile */}
          <div className="profile-pill">
            <div className="profile-avatar">{(user?.username || user?.email || '?')[0].toUpperCase()}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }} className="truncate">{user?.username || 'User'}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }} className="truncate">{user?.email}</div>
            </div>
          </div>
          <button className="btn btn-outline btn-sm btn-block" onClick={handleLogout}>Sign Out</button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="mobile-header hide-desktop">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' }}>
              <defs>
                <linearGradient id="mobGrad1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#4F46E5" />
                  <stop offset="100%" stopColor="#EC4899" />
                </linearGradient>
                <linearGradient id="mobGrad2" x1="1" y1="1" x2="0" y2="0">
                  <stop offset="0%" stopColor="#06B6D4" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
              </defs>
              <rect x="4" y="4" width="11" height="11" rx="3.5" fill="url(#mobGrad1)" fillOpacity="0.95" />
              <rect x="9" y="9" width="11" height="11" rx="3.5" fill="url(#mobGrad2)" fillOpacity="0.95" />
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', lineHeight: 1 }}>Smart Sync</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: theme === 'dark' ? 0.5 : 1 }}>
                <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="4.22" x2="19.78" y2="5.64"/>
              </svg>
              <div className="theme-toggle" onClick={toggleTheme} style={{ transform: 'scale(0.7)', margin: 0 }} />
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: theme === 'dark' ? 1 : 0.5 }}>
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            </div>
            <span style={{ fontSize: '0.6rem', fontWeight: 600, opacity: 0.7 }}>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
          </div>

          <button onClick={handleLogout} style={{ color: 'var(--danger)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', padding: '0 0.5rem', background: 'none', border: 'none', cursor: 'pointer' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            <span style={{ fontSize: '0.6rem', fontWeight: 700 }}>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Mobile Top Navigation Options */}
      {!(role === 'admin' || role === 'admin_faculty' || role === 'faculty') && (
        <nav className="mobile-top-nav hide-desktop hide-scrollbar" style={{
        position: 'fixed',
        top: 'var(--header-height)',
        left: 0,
        right: 0,
        height: '48px',
        background: 'var(--bg-glass-strong)',
        WebkitBackdropFilter: 'blur(20px)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-glass)',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        padding: '0 1rem',
        zIndex: 99,
      }}>
        {items.map((item, index) => {
          if (item.divider) return null;
          const isFilter = item.to?.includes('?filter=');
          const isActiveMatch = isFilter 
            ? location.pathname === '/student' && location.search.includes(item.to.split('?')[1])
            : location.pathname === item.to;

          return (
            <NavLink 
              key={item.label || item.to} 
              to={item.to} 
              end={!isFilter} 
              className={`mobile-top-nav-item ${isActiveMatch ? 'active' : ''}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                color: isActiveMatch ? 'var(--accent)' : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: isActiveMatch ? 600 : 500,
                transition: 'all 0.2s ease',
                cursor: 'pointer',
                background: isActiveMatch ? 'var(--accent-bg)' : 'var(--bg-glass)',
                border: `1px solid ${isActiveMatch ? 'var(--accent)' : 'var(--border-glass)'}`,
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
        </nav>
      )}

      {/* Main Content */}
      <main className="app-main">
        <BranchSelectionModal />
        {children}
        <GoToTop />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav hide-desktop">
        {items.filter(i => !i.divider && (!i.to || !i.to.includes('?filter='))).map(item => {
          const isActiveMatch = location.pathname === item.to;
          return (
            <NavLink key={item.label || item.to} to={item.to} end className={`bottom-nav-item ${isActiveMatch ? 'active' : ''}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default AppShell;
