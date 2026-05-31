import React, { useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';

const EditNameButton = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const openModal = () => {
    setNewName(user?.username || '');
    setError('');
    setIsEditing(true);
  };

  const handleSave = async () => {
    const trimmedName = newName.trim();
    const currentName = user?.username || '';
    
    if (!trimmedName || trimmedName === currentName) {
      setIsEditing(false);
      return;
    }
    if (trimmedName.length < 3) {
      setError('Name must be at least 3 characters long.');
      return;
    }
    
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/set-username', { username: trimmedName });
      if (refreshUser) {
        await refreshUser();
      } else {
        window.location.reload();
      }
      setIsEditing(false);
    } catch (err) {
      setError(err.message || 'Failed to update name');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={openModal}
        style={{
          background: 'rgba(255, 255, 255, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#fff',
          borderRadius: 'var(--radius-sm)',
          padding: '0.2rem 0.5rem',
          fontSize: '0.75rem',
          cursor: 'pointer',
          marginLeft: '0.75rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.25rem',
          backdropFilter: 'blur(4px)',
          verticalAlign: 'middle',
          fontWeight: 600
        }}
        title="Edit Name"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
        </svg>
        Edit Name
      </button>

      {isEditing && createPortal(
        <div className="modal-overlay" onClick={() => setIsEditing(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '350px', padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Edit Your Name</h3>
            <input 
              type="text" 
              className="form-input" 
              value={newName} 
              onChange={e => setNewName(e.target.value)} 
              placeholder="Enter new name"
              autoFocus
            />
            {error && <div className="text-danger text-xs" style={{ marginTop: '0.5rem' }}>{error}</div>}
            
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-outline btn-sm" onClick={() => setIsEditing(false)} disabled={loading}>
                Cancel
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={loading || !newName.trim()}>
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default EditNameButton;
