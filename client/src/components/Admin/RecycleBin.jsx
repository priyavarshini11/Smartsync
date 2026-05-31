import React, { useState } from 'react';

const RecycleBin = () => {
  // Placeholder for soft-deleted items fetched from backend
  const [deletedItems, setDeletedItems] = useState([
    { id: 1, title: 'Old Midterm Syllabus.pdf', type: 'PDF', deletedAt: '2023-10-12', reason: 'Admin Deleted' },
    { id: 2, title: 'Guest Lecture Notice', type: 'Notice', deletedAt: '2023-10-15', reason: 'Auto-Expired' },
    { id: 3, title: 'CorruptedLink_CS.pdf', type: 'Link', deletedAt: '2023-10-18', reason: 'Flagged by Student' },
  ]);

  const handleRestore = (id) => {
    // API Call to PATCH { isDeleted: false }
    setDeletedItems(deletedItems.filter(item => item.id !== id));
    alert('Resource restored to live view.');
  };

  const handlePermanentDelete = (id) => {
    if(window.confirm('Are you sure you want to permanently destroy this file? This action cannot be undone.')) {
      // API Call to DELETE
      setDeletedItems(deletedItems.filter(item => item.id !== id));
    }
  };

  const handleEmptyBin = () => {
    if(window.confirm('Empty entire recycle bin permanently?')) {
      setDeletedItems([]);
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0 }}>Recently Deleted & Expired</h3>
        <button 
          onClick={handleEmptyBin}
          disabled={deletedItems.length === 0}
          style={{ padding: '0.5rem 1rem', backgroundColor: deletedItems.length === 0 ? 'var(--border-color)' : '#fee2e2', color: deletedItems.length === 0 ? 'var(--text-secondary)' : '#b91c1c', border: 'none', borderRadius: 'var(--radius-lg)', fontWeight: 500, cursor: deletedItems.length === 0 ? 'not-allowed' : 'pointer' }}
        >
          Empty Bin
        </button>
      </div>

      {deletedItems.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>The recycle bin is empty.</p>
        </div>
      ) : (
        <div className="grid-container" style={{ padding: 0 }}>
          {deletedItems.map(item => (
            <div key={item.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderLeft: item.reason.includes('Flagged') ? '4px solid #b91c1c' : '4px solid var(--border-color)' }}>
              <div>
                <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>{item.title}</h4>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <span>{item.type}</span> • <span>Deleted: {item.deletedAt}</span>
                </div>
                {item.reason.includes('Flagged') ? (
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: '#b91c1c', fontWeight: 600 }}>⚠️ {item.reason}</p>
                ) : (
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Reason: {item.reason}</p>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                <button 
                  onClick={() => handleRestore(item.id)}
                  style={{ flex: 1, padding: '0.5rem', backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-lg)', fontSize: '0.875rem' }}
                >
                  Restore
                </button>
                <button 
                  onClick={() => handlePermanentDelete(item.id)}
                  style={{ flex: 1, padding: '0.5rem', backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 'var(--radius-lg)', fontSize: '0.875rem' }}
                >
                  Destroy
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecycleBin;
