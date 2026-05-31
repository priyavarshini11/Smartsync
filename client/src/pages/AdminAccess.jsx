import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const AdminAccess = () => {
  const { user: currentUser } = useContext(AuthContext);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchAdmins = async () => {
    try {
      const allUsers = await api.get('/admin/users');
      setAdmins(allUsers.filter(u => u.role === 'admin'));
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleDelete = async (adminId, username) => {
    if (adminId === currentUser?.id) {
      alert('You cannot delete your own account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to permanently delete admin "${username}"? This action cannot be undone.`)) return;

    setDeleting(adminId);
    try {
      await api.delete(`/admin/users/${adminId}`);
      setAdmins(prev => prev.filter(a => a.id !== adminId));
    } catch (err) {
      alert(err.message || 'Failed to delete admin');
    }
    setDeleting(null);
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const avatarColors = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4', '#ef4444', '#3b82f6'];

  return (
    <div>
      {/* Header */}
      <div className="app-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Admin Access</h1>
          <p className="text-sm text-muted">
            Manage administrator accounts with dashboard access
          </p>
        </div>
      </div>

      {/* Stats Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)',
        color: '#fff', marginBottom: '1.5rem', border: 'none',
        padding: '1.5rem 2rem', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute', top: '-30%', right: '-5%', width: '180px', height: '180px',
          borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none'
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <div>
            <p style={{ fontSize: '0.8rem', opacity: 0.85, marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              Total Admins
            </p>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>
              {loading ? '...' : admins.length}
            </p>
          </div>
          <div style={{ width: '1px', height: '48px', background: 'rgba(255,255,255,0.2)' }} />
          <div>
            <p style={{ fontSize: '0.8rem', opacity: 0.85, marginBottom: '0.25rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              Access Level
            </p>
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>🛡️ Full Dashboard Access</p>
          </div>
        </div>
      </div>

      {/* Admin Profiles */}
      {loading ? (
        <div className="grid grid-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card" style={{
              height: '130px', animation: 'pulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.1}s`
            }} />
          ))}
        </div>
      ) : admins.length === 0 ? (
        <div className="empty-state" style={{ paddingTop: '3rem' }}>
          <div style={{ fontSize: '3.5rem', marginBottom: '1rem', opacity: 0.5 }}>🛡️</div>
          <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>No admin accounts found</p>
        </div>
      ) : (
        <div className="anim-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {admins.map((admin, index) => {
            const isSelf = admin.id === currentUser?.id;
            const color = avatarColors[index % avatarColors.length];

            return (
              <div key={admin.id} className="card card-flat" style={{
                padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem',
                borderLeft: isSelf ? '4px solid var(--accent)' : '4px solid var(--border-glass)',
              }}>
                {/* Avatar */}
                <div style={{
                  width: 48, height: 48, borderRadius: '50%',
                  background: color, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '1.1rem', flexShrink: 0,
                  boxShadow: `0 4px 12px ${color}40`
                }}>
                  {getInitials(admin.username)}
                </div>

                {/* Profile Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <p className="truncate" style={{ fontWeight: 700, fontSize: '1rem' }}>
                      {admin.username || 'No username'}
                    </p>
                    {isSelf && (
                      <span style={{
                        background: 'var(--accent-bg)', color: 'var(--accent)',
                        borderRadius: '999px', padding: '0.1rem 0.5rem',
                        fontSize: '0.65rem', fontWeight: 700
                      }}>YOU</span>
                    )}
                    {admin.isMainAdmin && (
                      <span style={{
                        background: 'var(--color-ds)', color: 'var(--accent)',
                        borderRadius: '999px', padding: '0.1rem 0.5rem',
                        fontSize: '0.65rem', fontWeight: 700
                      }}>MAIN</span>
                    )}
                  </div>
                  <p className="text-sm text-muted truncate" style={{ marginBottom: '0.25rem' }}>
                    {admin.email}
                  </p>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span className="badge badge-type" style={{ fontSize: '0.65rem' }}>
                      🛡️ ADMIN
                    </span>
                    {admin.isMainAdmin && (
                      <span className="badge badge-type" style={{ fontSize: '0.65rem', background: 'var(--accent-bg)', color: 'var(--accent)' }}>
                        🔑 PIN AUTH
                      </span>
                    )}
                    <span className="text-xs text-muted">
                      Joined {new Date(admin.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* ID */}
                <div style={{ textAlign: 'right', flexShrink: 0 }} className="hide-mobile">
                  <p className="text-xs text-muted" style={{ fontFamily: 'monospace', opacity: 0.6 }}>
                    ID: {admin.id.substring(0, 8)}…
                  </p>
                </div>

                {/* Delete Button */}
                <div style={{ flexShrink: 0 }}>
                  {isSelf ? (
                    <div style={{
                      padding: '0.375rem 0.75rem', borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-glass)', fontSize: '0.8rem',
                      color: 'var(--text-muted)', fontWeight: 500
                    }}>
                      Current
                    </div>
                  ) : admin.isMainAdmin ? (
                    <div style={{
                      padding: '0.375rem 0.75rem', borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-glass)', fontSize: '0.8rem',
                      color: 'var(--warning)', fontWeight: 600, border: '1px dashed var(--warning)'
                    }}>
                      Protected
                    </div>
                  ) : (
                    <button
                      className="btn btn-sm"
                      onClick={() => handleDelete(admin.id, admin.username)}
                      disabled={deleting === admin.id}
                      style={{
                        background: 'var(--danger-bg)', color: 'var(--danger)',
                        border: '1px solid transparent', padding: '0.375rem 0.75rem',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={e => { e.currentTarget.style.background = 'var(--danger)'; e.currentTarget.style.color = '#fff'; }}
                      onMouseOut={e => { e.currentTarget.style.background = 'var(--danger-bg)'; e.currentTarget.style.color = 'var(--danger)'; }}
                      title={`Delete admin: ${admin.username}`}
                    >
                      {deleting === admin.id ? (
                        'Deleting...'
                      ) : (
                        <>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                          </svg>
                          Delete
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Footer */}
      <div style={{
        marginTop: '2rem', padding: '1rem 1.25rem',
        background: 'var(--accent-bg)', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--accent)',
        fontSize: '0.85rem', color: 'var(--text-secondary)'
      }}>
        <p style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--accent)' }}>
          ℹ️ About Admin Access
        </p>
        <p>
          All admins share equal access to the entire dashboard. The <strong>Main Admin</strong> uses a secure PIN and ID system for authentication.
          Secondary admins are created via the user management system. Deleting an admin removes their account permanently.
          The Main Admin and the last remaining admin account are protected from deletion.
        </p>
      </div>
    </div>
  );
};

export default AdminAccess;
