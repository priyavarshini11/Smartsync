import React, { useState, useEffect } from 'react';
import api from '../utils/api';

const AdminRecycle = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = () => api.get('/resources/recycle-bin').then(setItems).catch(() => {}).finally(() => setLoading(false));
  useEffect(() => { fetchItems(); }, []);

  const handleRestore = async (id) => {
    try { await api.patch(`/resources/${id}/restore`); fetchItems(); }
    catch (err) { alert(err.message); }
  };

  const handleDestroy = async (id) => {
    if (!window.confirm('Permanently destroy? This cannot be undone.')) return;
    try { await api.delete(`/resources/${id}/permanent`); fetchItems(); }
    catch (err) { alert(err.message); }
  };

  const handleEmptyBin = async () => {
    if (!window.confirm('Empty ENTIRE recycle bin permanently?')) return;
    try { 
      await api.delete('/resources/empty-recycle-bin'); 
      fetchItems(); 
    } catch (err) { alert(err.message); }
  };

  return (
    <div>
      <div className="app-header">
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Recycle Bin</h1>
        <button className="btn btn-sm" disabled={items.length === 0} onClick={handleEmptyBin}
          style={{ background: items.length === 0 ? 'var(--border-glass)' : 'var(--danger-bg)', color: items.length === 0 ? 'var(--text-muted)' : 'var(--danger)' }}>
          Empty Bin
        </button>
      </div>
      {loading ? <p className="text-muted">Loading...</p> : items.length === 0 ? (
        <div className="empty-state card"><p>Recycle bin is empty.</p></div>
      ) : (
        <div className="grid grid-2 anim-stagger">
          {items.map(item => (
            <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderLeft: item.deletedReason?.includes('Flagged') ? '4px solid var(--danger)' : '4px solid var(--border-glass)' }}>
              <div>
                <h4 style={{ fontWeight: 700 }}>{item.title}</h4>
                <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.25rem' }}>
                  <span className="badge badge-type">{item.type}</span>
                </div>
                <p className="text-xs" style={{ marginTop: '0.5rem', color: item.deletedReason?.includes('Flagged') ? 'var(--danger)' : 'var(--text-muted)', fontWeight: item.deletedReason?.includes('Flagged') ? 600 : 400 }}>
                  {item.deletedReason?.includes('Flagged') ? '⚠️ ' : ''}{item.deletedReason || 'Deleted'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => handleRestore(item.id)}>Restore</button>
                <button className="btn btn-sm" style={{ flex: 1, background: 'var(--danger-bg)', color: 'var(--danger)' }} onClick={() => handleDestroy(item.id)}>Destroy</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRecycle;
