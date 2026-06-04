import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../utils/api';
import ResourceEditModal from '../components/UI/ResourceEditModal';

const FacultyUploads = () => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingResource, setEditingResource] = useState(null);
  const [previewResource, setPreviewResource] = useState(null);
  const [filterType, setFilterType] = useState('ALL');

  const [analytics, setAnalytics] = useState({});

  const fetchResources = () => {
    api.get('/resources/faculty').then(async (data) => {
      setResources(data);
      if (data.length > 0) {
        // Fetch analytics for all resources
        const ids = data.map(r => r.id);
        try {
          const stats = await api.post('/resources/analytics/bulk', { resourceIds: ids });
          setAnalytics(stats);
        } catch (e) {
          console.error('Failed to fetch analytics', e);
        }
      }
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchResources();
  }, []);

  const handleDelete = async (group) => {
    if (!window.confirm('Move this resource (and all targeted classes in this upload group) to recycle bin?')) return;
    try {
      await Promise.all(group.items.map(r => api.patch(`/resources/${r.id}/delete`, { reason: 'Faculty Deleted' })));
      fetchResources(); // refetch to handle group updates
    } catch (err) { alert(err.message); }
  };

  // Group resources by uploadGroupId (or fallback to signature grouping if missing)
  const getGroupedResources = () => {
    const groups = {};
    const filteredResources = filterType === 'ALL' ? resources : resources.filter(r => r.type === filterType);

    filteredResources.forEach(r => {
      // Group by uploadGroupId, or if missing, group by title+fileUrl+date+uploader signature
      const dateStr = new Date(r.createdAt).toDateString();
      const gId = r.uploadGroupId || `${r.title}-${r.fileUrl}-${dateStr}-${r.uploadedBy}`;
      if (!groups[gId]) {
        groups[gId] = [];
      }
      groups[gId].push(r);
    });

    // Convert to flat list representation of unique groups
    return Object.entries(groups).map(([gId, items]) => {
      // Pick first item as base preview item
      const base = items[0];

      // Format branches, years, semesters, sections targeted in this group
      const branches = [...new Set(items.map(i => i.targetBranch.replace('br_', '').toUpperCase()))].sort();
      const years = [...new Set(items.map(i => `${i.targetYear} Yr`))].sort();
      const semesters = [...new Set(items.map(i => `Sem ${i.targetSemester}`))].sort();
      const sections = [...new Set(items.map(i => i.targetSection === 'ALL' ? 'All Sections' : `Sec ${i.targetSection}`))].sort();

      return {
        ...base,
        items,
        groupCount: items.length,
        targetedBranches: branches.join(', '),
        targetedYears: years.join(', '),
        targetedSemesters: semesters.join(', '),
        targetedSections: sections.join(', '),
      };
    });
  };

  const groupedList = getGroupedResources();

  return (
    <div>
      <div className="app-header" style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>My Uploads</h1>
      </div>
      
      {/* Filters */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }} className="hide-scrollbar">
        {['ALL', 'PDF', 'Notes', 'Assignment', 'Notice', 'Project', 'Timetable', 'Syllabus', 'Link', 'Case Study', 'Video', 'Image'].map(t => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: filterType === t ? 700 : 500,
              background: filterType === t ? 'var(--accent)' : 'var(--bg-glass)',
              color: filterType === t ? '#fff' : 'var(--text-secondary)',
              border: `1px solid ${filterType === t ? 'var(--accent)' : 'var(--border-glass)'}`,
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
          >
            {t}
          </button>
        ))}
      </div>
      {loading ? (
        <p className="text-muted">Loading...</p>
      ) : groupedList.length === 0 ? (
        <div className="empty-state card">
          <p style={{ fontWeight: 600 }}>No uploads yet</p>
          <p className="text-sm">Resources you publish will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-2 anim-stagger">
          {groupedList.map(r => (
            <div key={r.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{r.title}</h4>
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  <span className="badge badge-type">{r.type}</span>
                  {r.groupCount > 1 && (
                    <span className="badge badge-theory" style={{ background: 'var(--success-bg)', color: 'var(--success)' }}>
                      Multiple Classes
                    </span>
                  )}
                </div>
                
                {/* Meta details list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.5rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <div><strong>Stream / Branch:</strong> {r.targetedBranches}</div>
                  <div><strong>Year(s):</strong> {r.targetedYears}</div>
                  <div><strong>Semester(s):</strong> {r.targetedSemesters}</div>
                  <div><strong>Section(s):</strong> {r.targetedSections}</div>
                  <div style={{ marginTop: '0.25rem', fontSize: '0.7rem', opacity: 0.8 }}>Uploaded by {r.uploaderName}</div>
                </div>

                {/* Analytics Badge */}
                {analytics[r.id] && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)' }}>
                    <span style={{ background: 'var(--bg-glass)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                      Views: {analytics[r.id].readCount} / {analytics[r.id].targetCount}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted" style={{ marginTop: 'auto' }}>
                Uploaded: {new Date(r.createdAt).toLocaleDateString()}
              </p>
              <div style={{ display: 'flex', gap: '0.375rem' }}>
                <button onClick={() => setPreviewResource(r)} className="btn btn-sm btn-outline" style={{ flex: 1 }} title="View File">
                  View
                </button>
                <button className="btn btn-sm btn-outline" onClick={() => setEditingResource(r)} style={{ flex: 1 }} title="Edit Target">
                  Edit
                </button>
                <button className="btn btn-sm" onClick={() => handleDelete(r)} style={{ background: 'var(--danger-bg)', color: 'var(--danger)', flex: 1 }} title="Delete Upload">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* ---- Full-Screen Preview Modal ---- */}
      {previewResource && createPortal(
        <div className="preview-overlay" onClick={() => setPreviewResource(null)}>
          <div className="preview-container" onClick={e => e.stopPropagation()}>
            <div className="preview-header">
              <h3 className="truncate" style={{ fontWeight: 700, fontSize: '1rem', lineHeight: 1.2 }}>{previewResource.title}</h3>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {/* Open in new tab button removed */}
                <button className="btn btn-sm" onClick={() => setPreviewResource(null)} style={{ background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                  Close
                </button>
              </div>
            </div>
            <div className="preview-body">
              {(() => {
                const url = previewResource.fileUrl || '';
                const urlLower = url.toLowerCase();
                const ext = urlLower.split('.').pop()?.split('?')[0]?.split('#')[0] || '';
                const type = (previewResource.type || '').toLowerCase();
                const isGoogleDrive = urlLower.includes('drive.google.com') || urlLower.includes('docs.google.com');

                // Helper: Convert Google Drive share link to embeddable preview URL
                const getGDriveEmbed = (u) => {
                  const patterns = [/\/file\/d\/([a-zA-Z0-9_-]+)/, /id=([a-zA-Z0-9_-]+)/, /\/d\/([a-zA-Z0-9_-]+)/];
                  for (const p of patterns) {
                    const m = u.match(p);
                    if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
                  }
                  if (u.includes('docs.google.com')) return u.replace(/\/edit.*$/, '/preview').replace(/\/view.*$/, '/preview');
                  return u;
                };

                if (previewResource.textContent) {
                  return (
                    <div style={{ padding: '2rem', whiteSpace: 'pre-wrap', lineHeight: '1.6', fontSize: '1.1rem', color: 'var(--text-primary)', overflowY: 'auto', height: '100%' }}>
                      {previewResource.textContent}
                    </div>
                  );
                } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext) || type === 'image') {
                  return (
                    <div className="preview-image-container">
                      <img src={url} alt={previewResource.title} className="preview-image" />
                    </div>
                  );
                } else if (['mp4', 'webm', 'ogg', 'mov'].includes(ext) || type === 'video') {
                  return (
                    <div className="preview-media-container">
                      <video controls autoPlay className="preview-video"><source src={url} /></video>
                    </div>
                  );
                } else if (ext === 'pdf' || type === 'pdf') {
                  return <iframe src={`${url}#toolbar=1&navpanes=0`} className="preview-frame" title={previewResource.title} />;
                } else if (isGoogleDrive) {
                  return <iframe src={getGDriveEmbed(url)} className="preview-frame" title={previewResource.title} sandbox="allow-scripts allow-same-origin allow-popups" />;
                } else if (['assignment', 'notes', 'syllabus', 'timetable', 'case study', 'project'].includes(type) && urlLower.startsWith('http')) {
                  return <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(url)}&embedded=true`} className="preview-frame" title={previewResource.title} />;
                } else if (type === 'link' || urlLower.startsWith('http')) {
                  return <iframe src={url} className="preview-frame" title={previewResource.title} sandbox="allow-scripts allow-same-origin allow-popups" />;
                } else {
                  return (
                    <div className="preview-unsupported">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: '1rem', opacity: 0.5 }}>
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path>
                        <polyline points="13 2 13 9 20 9"></polyline>
                      </svg>
                      <h3 style={{ marginBottom: '0.5rem' }}>No Preview Available</h3>
                      <p style={{ color: 'var(--text-secondary)' }}>This file type cannot be previewed in the browser.</p>
                      <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => window.open(url, '_blank')}>
                        Download File
                      </button>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}

      {editingResource && (
        <ResourceEditModal
          resource={editingResource}
          onClose={() => setEditingResource(null)}
          onSave={() => {
            setEditingResource(null);
            fetchResources();
          }}
        />
      )}
    </div>
  );
};

export default FacultyUploads;
