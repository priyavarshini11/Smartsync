import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import AnalyticsDashboard from '../components/Admin/AnalyticsDashboard';
import EditNameButton from '../components/UI/EditNameButton';

const AdminOverview = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  const [branches, setBranches] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/taxonomy')
    ])
    .then(([statsData, taxonomyData]) => {
      setStats(statsData);
      setBranches(taxonomyData || []);
    })
    .catch(() => {});
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (!stats) return (
    <div className="grid grid-3" style={{ gap: '1rem' }}>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="card" style={{
          height: '110px', animation: 'pulse 1.5s ease-in-out infinite',
          animationDelay: `${i * 0.1}s`
        }} />
      ))}
    </div>
  );

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'var(--accent)', path: '/admin/users' },
    { label: 'Students', value: stats.students, icon: '🎓', color: 'var(--color-aiml)', path: '/admin/users' },
    ...(user?.role === 'admin' ? [{ label: 'Facultys', value: stats.facultys, icon: '👨‍🏫', color: 'var(--color-ds)', path: '/admin/users' }] : []),
    { label: 'Resources', value: stats.totalResources, icon: '📚', color: 'var(--warning)', path: null },
    ...(user?.role === 'admin' ? [{ label: 'Branches', value: stats.totalBranches, icon: '🏛️', color: 'var(--color-mech)', path: '/admin/taxonomy' }] : []),
    { label: 'Recycle Bin', value: stats.deletedResources, icon: '🗑️', color: 'var(--danger)', path: '/admin/recycle' },
  ];

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)',
        borderRadius: 'var(--radius-lg)', padding: '1.5rem 1rem', marginBottom: '1.5rem',
        color: '#fff', position: 'relative', overflow: 'hidden',
        animation: 'fadeSlideUp 0.35s ease-out both'
      }}>
        <div style={{
          position: 'absolute', top: '-30%', right: '-5%', width: '200px', height: '200px',
          borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none'
        }} />
        <p style={{ fontSize: '0.85rem', opacity: 0.85, marginBottom: '0.25rem' }}>{getGreeting()},</p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ minWidth: 0, wordBreak: 'break-word', flex: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
            <span>{user?.role === 'admin_faculty' ? 'Admin Faculty' : 'Main Admin'} {user?.username ? `(${user.username})` : ''}</span>
            {user?.role !== 'admin_faculty' && (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="url(#goldGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginLeft: '0.5rem', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.3))', flexShrink: 0 }} title="System Administrator">
                <defs>
                  <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffe066" />
                    <stop offset="50%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="url(#goldGrad)" fillOpacity="0.25"/>
                <polygon points="12 8 13.5 11.5 17 11.5 14 13.5 15.5 17 12 15 8.5 17 10 13.5 7 11.5 10.5 11.5" fill="url(#goldGrad)"/>
              </svg>
            )}
          </span>
          <EditNameButton />
        </h1>

        {user?.role === 'admin_faculty' && user?.profile?.branch && (
          <p style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '0.15rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="url(#silverGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.4rem', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.25))' }}>
              <defs>
                <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="30%" stopColor="#e2e8f0" />
                  <stop offset="70%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
              </defs>
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" fill="url(#silverGrad)" fillOpacity="0.3"/>
              <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" fill="url(#silverGrad)" fillOpacity="0.1"/>
            </svg>
            HOD: {user.profile.branch.replace(/^br_/, '').toUpperCase()}
          </p>
        )}
        {user?.role === 'admin_faculty' && user?.profile?.assignments?.length > 0 && (
          <div style={{ marginTop: '0.75rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
            <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.5rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="badge" style={{ background: 'linear-gradient(135deg, var(--warning) 0%, #f59e0b 100%)', color: '#000', padding: '0.15rem 0.4rem', borderRadius: '4px', display: 'inline-flex', alignItems: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </span>
              Allocated Curriculum:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8rem', opacity: 0.9 }}>
              {user.profile.assignments.map((a, i) => (
                <div key={i} style={{ paddingBottom: '0.25rem', borderBottom: i < user.profile.assignments.length - 1 ? '1px solid rgba(255,255,255,0.2)' : 'none' }}>
                  Branch: {branches.find(b => b.id === a.branch)?.shortName || a.branch} | Year: {a.year} | Sem: {a.semester} | Section: {a.section}
                  {a.subjectId && ` | Subject: ${branches.find(b => b.id === a.branch)?.years?.find(y => y.level === Number(a.year))?.semesters?.find(s => s.number === Number(a.semester))?.subjects?.find(sub => sub.id === a.subjectId)?.name || 'Unknown'}`}
                </div>
              ))}
            </div>
          </div>
        )}
        <p style={{ fontSize: '0.85rem', opacity: 0.75, marginTop: '0.25rem' }}>
          {user?.role === 'admin_faculty'
            ? `Managing resources for your branch.`
            : `Managing ${stats.totalUsers} users and ${stats.totalResources} resources across ${stats.totalBranches} branches.`
          }
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-3 anim-stagger">
        {cards.map(c => (
          <div key={c.label} className="card stat-card"
            onClick={() => c.path && navigate(c.path)}
            style={{ borderLeft: `4px solid ${c.color}`, cursor: c.path ? 'pointer' : 'default' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p className="text-xs text-muted" style={{
                  textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em'
                }}>{c.label}</p>
                <p style={{ fontSize: '2.25rem', fontWeight: 800, marginTop: '0.25rem', lineHeight: 1 }}>{c.value}</p>
              </div>
              <span style={{ fontSize: '1.75rem' }}>{c.icon}</span>
            </div>
          </div>
        ))}
      </div>

      <AnalyticsDashboard data={stats} role="admin" />

      {/* Recent Resources */}
      {stats.recentResources?.length > 0 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Recent Resources</h3>
          <div className="anim-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(() => {
              const grouped = [];
              const groupMap = {};
              stats.recentResources.forEach(r => {
                const dateStr = new Date(r.createdAt).toDateString();
                const key = r.uploadGroupId || `${r.title}-${r.fileUrl}-${dateStr}-${r.uploadedBy}`;
                if (!groupMap[key]) {
                  groupMap[key] = { ...r, targets: [r] };
                  grouped.push(groupMap[key]);
                } else {
                  groupMap[key].targets.push(r);
                }
              });
              
              return grouped.slice(0, 5).map(group => {
                const r = group.targets[0];
                return (
                  <div key={r.id} className="card card-flat" style={{
                    padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', gap: '1rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                      <div style={{ minWidth: 0 }}>
                        <span className="truncate" style={{ fontWeight: 600, display: 'block' }}>{r.title}</span>
                        <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.25rem' }}>
                          <span className="badge badge-type">{r.type}</span>
                          <span className="text-xs text-muted">by {r.uploaderName}</span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-muted" style={{ whiteSpace: 'nowrap' }}>
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Quick Actions</h3>
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: 'Upload Resource', icon: '📤', path: '/admin/upload', color: 'var(--accent-bg)' },
            ...(user?.role === 'admin' ? [{ label: 'Manage Taxonomy', icon: '🏛️', path: '/admin/taxonomy', color: 'var(--success-bg)' }] : []),
            { label: 'Manage Users', icon: '👥', path: '/admin/users', color: 'var(--warning-bg)' },
            { label: 'Recycle Bin', icon: '🗑️', path: '/admin/recycle', color: 'var(--danger-bg)' },
          ].map(a => (
            <button key={a.label} className="card card-flat" onClick={() => navigate(a.path)}
              style={{
                padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem',
                cursor: 'pointer', border: '1px solid var(--border-glass)',
                width: '100%', textAlign: 'left', transition: 'all 0.2s ease'
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-glass)'; e.currentTarget.style.transform = 'none'; }}>
              <span style={{
                width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                background: a.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.25rem'
              }}>{a.icon}</span>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
