import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const StudentFaculty = () => {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const data = await api.get('/student/faculty');
        setFaculty(data);
      } catch (err) {
        console.error('Failed to fetch faculty:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFaculty();
  }, []);

  return (
    <div>
      <div style={{
        background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)',
        borderRadius: 'var(--radius-lg)', padding: '1.5rem 1rem', marginBottom: '1.5rem',
        color: '#fff', position: 'relative', overflow: 'hidden',
        animation: 'fadeSlideUp 0.35s ease-out both'
      }}>
        <div style={{
          position: 'absolute', top: '-40%', right: '-5%', width: '180px', height: '180px',
          borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none'
        }} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem' }}>My Faculty</h1>
        <p style={{ fontSize: '0.9rem', opacity: 0.9 }}>
          {!loading && `You have ${faculty.length} faculty member${faculty.length !== 1 ? 's' : ''} currently assigned to your section.`}
          {loading && 'Loading your faculty...'}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-3" style={{ gap: '1rem' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card card-flat" style={{ height: '120px', animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      ) : faculty.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon" style={{ fontSize: '2rem', marginBottom: '1rem' }}>👨‍🏫</div>
          <p className="text-muted">No faculty members found for your specific section.</p>
        </div>
      ) : (
        <div className="grid grid-3" style={{ gap: '1rem' }}>
          {faculty.map((f, i) => {
            const displayName = f.name || f.username || 'Faculty';
            return (
              <div key={f.id} className="card card-flat" style={{ 
                animation: 'fadeSlideUp 0.4s ease-out both', 
                animationDelay: `${i * 0.05}s`,
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                padding: '1.25rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', 
                  background: 'var(--accent-bg)', color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.25rem', fontWeight: 700, flexShrink: 0
                }}>
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 className="truncate" style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.25rem', lineHeight: 1.2 }}>
                    {displayName}
                  </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                    {f.role === 'admin_faculty' ? 'Admin Faculty' : 'Faculty'}
                  </span>
                  {f.profile?.department && (
                    <span className="badge" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                      Branch: {f.profile.department.replace('br_', '').replace('aiml', 'aml').toUpperCase()}
                    </span>
                  )}
                </div>
                </div>
                </div>

                {f.explicitSubjectName ? (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <strong>Subject:</strong> {f.explicitSubjectName}
                  </div>
                ) : f.recentPost?.subjectName ? (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <strong>Subject:</strong> {f.recentPost.subjectName}
                  </div>
                ) : (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <strong>Subject:</strong> General
                  </div>
                )}

                {f.recentPost && (
                  <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.15rem' }}>
                      Recent Post
                    </div>
                    <div className="truncate" style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                      <span style={{ color: 'var(--accent)', marginRight: '0.3rem', fontWeight: 700 }}>[{f.recentPost.type}]</span>
                      {f.recentPost.title}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentFaculty;
