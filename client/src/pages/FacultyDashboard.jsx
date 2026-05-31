import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import AnalyticsDashboard from '../components/Admin/AnalyticsDashboard';
import EditNameButton from '../components/UI/EditNameButton';
import ResourceCard from '../components/Student/ResourceCard';

const FacultyDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState([]);


  useEffect(() => {
    Promise.all([
      api.get('/resources/faculty/stats'),
      api.get('/taxonomy')
    ])
    .then(([statsData, taxonomyData]) => {
      setStats(statsData);
      setBranches(taxonomyData || []);
      setLoading(false);
    })
    .catch(() => setLoading(false));
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const typeIcons = {
    PDF: '📄', Assignment: '📝', Notice: '📢', Project: '🔬',
    'Case Study': '📊', Link: '🔗', Timetable: '📅', Syllabus: '📋'
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)',
        color: '#fff', marginBottom: '1.5rem', border: 'none',
        padding: '1.5rem 1rem', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-30%', right: '-5%', width: '200px', height: '200px',
          borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-40%', right: '15%', width: '150px', height: '150px',
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none'
        }} />
        <p style={{ fontSize: '0.85rem', opacity: 0.85, marginBottom: '0.25rem' }}>{getGreeting()},</p>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ minWidth: 0, wordBreak: 'break-word', flex: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
            <span>{user?.username || 'Lecturer'}</span>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="url(#facultyBadgeGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginLeft: '0.5rem', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.25))', flexShrink: 0 }} title="Lecturer">
              <defs>
                <linearGradient id="facultyBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a5f3fc" />
                  <stop offset="40%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0369a1" />
                </linearGradient>
              </defs>
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" fill="url(#facultyBadgeGrad)" fillOpacity="0.3"/>
              <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" fill="url(#facultyBadgeGrad)" fillOpacity="0.1"/>
            </svg>
          </span>
          <EditNameButton />
        </h1>


        {(() => {
          if (user?.profile?.assignments?.length > 0) {
            return (
              <div style={{ marginTop: '0.5rem', marginBottom: '1rem', background: 'rgba(255,255,255,0.1)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
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
            );
          } else if (user?.profile?.branch) {
            return (
              <p style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '-0.25rem', marginBottom: '0.75rem', fontWeight: 600 }}>
                📌 Branch: {user.profile.branch.replace(/^br_/, '').toUpperCase()}
              </p>
            );
          }
          return null;
        })()}
        <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
          {stats?.totalUploads > 0
            ? `You have ${stats.totalUploads} resource${stats.totalUploads !== 1 ? 's' : ''} published across ${stats.uniqueClasses} class${stats.uniqueClasses !== 1 ? 'es' : ''}.`
            : 'Start by uploading your first resource for students.'
          }
        </p>
      </div>



      {/* Stats Cards */}
      <div className="grid grid-3 anim-stagger" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--accent)', cursor: 'pointer' }}
          onClick={() => navigate('/faculty/my-uploads')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p className="text-xs text-muted" style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>My Uploads</p>
              <p style={{ fontSize: '2.25rem', fontWeight: 800, marginTop: '0.25rem', lineHeight: 1 }}>
                {loading ? '...' : stats?.totalUploads || 0}
              </p>
            </div>
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--radius-md)',
              background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem'
            }}>📚</div>
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--warning)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p className="text-xs text-muted" style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Active Deadlines</p>
              <p style={{ fontSize: '2.25rem', fontWeight: 800, marginTop: '0.25rem', lineHeight: 1 }}>
                {loading ? '...' : stats?.activeAssignments || 0}
              </p>
            </div>
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--radius-md)',
              background: 'var(--warning-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem'
            }}>⏰</div>
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid var(--success)', cursor: 'pointer' }}
          onClick={() => navigate('/faculty/upload')}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p className="text-xs text-muted" style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Classes Reached</p>
              <p style={{ fontSize: '2.25rem', fontWeight: 800, marginTop: '0.25rem', lineHeight: 1 }}>
                {loading ? '...' : stats?.uniqueClasses || 0}
              </p>
            </div>
            <div style={{
              width: 48, height: 48, borderRadius: 'var(--radius-md)',
              background: 'var(--success-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem'
            }}>🎯</div>
          </div>
        </div>
      </div>

      {/* Upload Distribution */}
      {stats?.uploadsByType && Object.keys(stats.uploadsByType).length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '0.95rem' }}>Upload Distribution</h3>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {Object.entries(stats.uploadsByType).map(([type, count]) => (
              <div key={type} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.5rem 1rem', background: 'var(--bg-glass)',
                border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)'
              }}>
                <span style={{ fontSize: '1.1rem' }}>{typeIcons[type] || '📁'}</span>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{type}</span>
                <span className="badge badge-type">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <AnalyticsDashboard data={stats} role="faculty" />

      {/* Recent Uploads */}
      {stats?.recentUploads?.length > 0 ? (
        <div>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Recent Uploads</h3>
          <div className="anim-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {stats.recentUploads.map(r => (
              <div key={r.id} className="card card-flat" style={{
                padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', gap: '1rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '1.25rem', flexShrink: 0 }}>{typeIcons[r.type] || '📁'}</span>
                  <div style={{ minWidth: 0 }}>
                    <p className="truncate" style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.title}</p>
                    <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                      <span className="badge badge-type">{r.type}</span>
                      <span className="badge badge-theory">{r.branchName} • Y{r.targetYear} S{r.targetSemester} {r.targetSection}</span>
                    </div>
                  </div>
                </div>
                <span className="text-xs text-muted" style={{ whiteSpace: 'nowrap' }}>
                  {new Date(r.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : !loading && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📤</div>
          <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem' }}>No uploads yet</p>
          <p className="text-muted" style={{ marginBottom: '1.5rem' }}>
            Start by publishing your first resource for students.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/faculty/upload')}>
            Upload Your First Resource →
          </button>
        </div>
      )}
    </div>
  );
};

export default FacultyDashboard;
