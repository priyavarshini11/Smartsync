import React, { useState, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import api from '../utils/api';
import ResourceEditModal from '../components/UI/ResourceEditModal';
import { AuthContext } from '../context/AuthContext';

const AdminResourceBrowser = () => {
  const { user, selectedBranch: authSelectedBranch } = useContext(AuthContext);
  const [taxonomy, setTaxonomy] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ branch: '', year: '', semester: '', section: '', type: '' });
  const [expandedBranch, setExpandedBranch] = useState(null);
  const [editingResource, setEditingResource] = useState(null);
  const [previewResource, setPreviewResource] = useState(null);
  const [analytics, setAnalytics] = useState({});
  const fetchResources = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.branch) params.set('branch', filters.branch);
      if (filters.year) params.set('year', filters.year);
      if (filters.semester) params.set('semester', filters.semester);
      if (filters.section) params.set('section', filters.section);
      if (filters.type) params.set('type', filters.type);
      const qs = params.toString();
      const data = await api.get('/resources' + (qs ? `?${qs}` : ''));
      setResources(data);
      if (data.length > 0) {
        try {
          const stats = await api.post('/resources/analytics/bulk', { resourceIds: data.map(r => r.id) });
          setAnalytics(stats);
        } catch (e) {
          console.error('Failed to fetch analytics', e);
        }
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  // Fetch taxonomy on mount
  useEffect(() => {
    api.get('/taxonomy').then(data => {
      const assignedBranch = user?.role === 'admin_faculty' && (user?.profile?.branch || authSelectedBranch);
      if (assignedBranch) {
        setTaxonomy(data.filter(b => b.id === assignedBranch));
        setFilter('branch', assignedBranch);
        setExpandedBranch(assignedBranch);
      } else {
        setTaxonomy(data);
      }
    }).catch(() => {});
  }, [user]);

  // Fetch resources whenever filters change
  useEffect(() => {
    fetchResources();
  }, [filters]);

  const selectedBranch = taxonomy.find(b => b.id === filters.branch);
  const selectedYear = selectedBranch?.years?.find(y => y.level === Number(filters.year));
  const selectedSem = selectedYear?.semesters?.find(s => s.number === Number(filters.semester));

  const setFilter = (key, value) => {
    const next = { ...filters, [key]: value };
    // Reset dependent filters when parent changes
    if (key === 'branch') { next.year = ''; next.semester = ''; next.section = ''; }
    if (key === 'year') { next.semester = ''; next.section = ''; }
    if (key === 'semester') { next.section = ''; }
    setFilters(next);
  };

  const clearFilters = () => setFilters({ branch: '', year: '', semester: '', section: '', type: '' });

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  const typeIcons = {
    PDF: '📄', Assignment: '📝', Notice: '📢', Project: '🔬',
    'Case Study': '📊', Link: '🔗', Timetable: '📅', Syllabus: '📋'
  };

  const handleSoftDelete = async (group) => {
    if (!window.confirm(`Move this resource (and its ${group.targets.length - 1} other copies) to the recycle bin?`)) return;
    try {
      await Promise.all(group.targets.map(r => api.patch(`/resources/${r.id}/delete`, { reason: 'Admin Deleted' })));
      setResources(prev => prev.filter(r => !group.targets.find(t => t.id === r.id)));
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="resource-browser-container" style={{ display: 'flex', gap: '1.5rem', minHeight: '70vh' }}>
      {/* ====== LEFT: Filter Sidebar ====== */}
      <div className="resource-browser-sidebar" style={{
        width: '260px', flexShrink: 0,
        background: 'var(--bg-glass)', backdropFilter: 'blur(16px)',
        border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-lg)',
        padding: '1.25rem', alignSelf: 'flex-start', position: 'sticky', top: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>
            🔍 Filters
            {activeFilterCount > 0 && (
              <span style={{
                marginLeft: '0.5rem', background: 'var(--accent)', color: '#fff',
                borderRadius: '999px', padding: '0.1rem 0.5rem', fontSize: '0.7rem'
              }}>{activeFilterCount}</span>
            )}
          </h3>
          {activeFilterCount > 0 && (
            <button className="btn btn-ghost" onClick={clearFilters}
              style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}>Clear</button>
          )}
        </div>

        {/* Branch List */}
        <div style={{ marginBottom: '1rem' }}>
          <p className="text-xs text-muted" style={{
            textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.5rem'
          }}>Branch</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {taxonomy.map(branch => {
              const isActive = filters.branch === branch.id;
              return (
                <button key={branch.id}
                  onClick={() => {
                    setFilter('branch', isActive ? '' : branch.id);
                    setExpandedBranch(isActive ? null : branch.id);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)',
                    background: isActive ? 'var(--accent-bg)' : 'transparent',
                    border: `1px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                    color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500, fontSize: '0.85rem',
                    cursor: 'pointer', transition: 'all 0.2s ease', textAlign: 'left', width: '100%'
                  }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                    background: branch.colorHex || 'var(--accent)'
                  }} />
                  {branch.shortName || branch.name}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                    style={{ marginLeft: 'auto', transform: isActive ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              );
            })}
          </div>
        </div>

        {/* Year selector (shows when branch selected) */}
        {filters.branch && selectedBranch && (
          <div style={{ marginBottom: '1rem', animation: 'fadeSlideUp 0.2s ease-out' }}>
            <p className="text-xs text-muted" style={{
              textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.5rem'
            }}>Year</p>
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              {selectedBranch.years.map(y => (
                <button key={y.level}
                  onClick={() => setFilter('year', filters.year === String(y.level) ? '' : String(y.level))}
                  className={`btn btn-sm ${filters.year === String(y.level) ? 'btn-primary' : 'btn-outline'}`}
                  style={{ minWidth: '48px' }}>
                  Y{y.level}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Semester selector */}
        {filters.year && selectedYear && (
          <div style={{ marginBottom: '1rem', animation: 'fadeSlideUp 0.2s ease-out' }}>
            <p className="text-xs text-muted" style={{
              textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.5rem'
            }}>Semester</p>
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              {selectedYear.semesters.map(s => (
                <button key={s.number}
                  onClick={() => setFilter('semester', filters.semester === String(s.number) ? '' : String(s.number))}
                  className={`btn btn-sm ${filters.semester === String(s.number) ? 'btn-primary' : 'btn-outline'}`}
                  style={{ minWidth: '48px' }}>
                  S{s.number}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Section selector */}
        {filters.semester && selectedSem && (
          <div style={{ marginBottom: '1rem', animation: 'fadeSlideUp 0.2s ease-out' }}>
            <p className="text-xs text-muted" style={{
              textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.5rem'
            }}>Section</p>
            <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setFilter('section', filters.section === 'ALL' ? '' : 'ALL')}
                className={`btn btn-sm ${filters.section === 'ALL' ? 'btn-primary' : 'btn-outline'}`}>
                ALL
              </button>
              {selectedSem.sections.map(sec => (
                <button key={sec}
                  onClick={() => setFilter('section', filters.section === sec ? '' : sec)}
                  className={`btn btn-sm ${filters.section === sec ? 'btn-primary' : 'btn-outline'}`}
                  style={{ minWidth: '40px' }}>
                  {sec}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Type filter */}
        <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '1rem' }}>
          <p className="text-xs text-muted" style={{
            textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '0.5rem'
          }}>Resource Type</p>
          <select className="form-select" value={filters.type}
            onChange={e => setFilter('type', e.target.value)}
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}>
            <option value="">All Types</option>
            {['PDF', 'Notes', 'Assignment', 'Notice', 'Project', 'Timetable', 'Syllabus', 'Link', 'Case Study', 'Video', 'Image'].map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* ====== RIGHT: Resource List ====== */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Header */}
        <div className="app-header">
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Browse Resources</h1>
            <p className="text-sm text-muted">
              {loading ? 'Loading...' :
                `${resources.length} resource${resources.length !== 1 ? 's' : ''} found` +
                (activeFilterCount > 0 ? ` (${activeFilterCount} filter${activeFilterCount !== 1 ? 's' : ''} active)` : '')
              }
            </p>
          </div>
        </div>

        {/* Active filter breadcrumbs */}
        {activeFilterCount > 0 && (
          <div style={{
            display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginBottom: '1.25rem',
            animation: 'fadeSlideUp 0.2s ease-out'
          }}>
            {filters.branch && (
              <span className="badge badge-theory" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>
                {selectedBranch?.shortName || filters.branch}
                <button onClick={() => setFilter('branch', '')} style={{
                  marginLeft: '0.375rem', background: 'none', border: 'none', cursor: 'pointer',
                  color: 'inherit', fontWeight: 700, fontSize: '0.8rem'
                }}>×</button>
              </span>
            )}
            {filters.year && (
              <span className="badge badge-theory" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>
                Year {filters.year}
                <button onClick={() => setFilter('year', '')} style={{
                  marginLeft: '0.375rem', background: 'none', border: 'none', cursor: 'pointer',
                  color: 'inherit', fontWeight: 700, fontSize: '0.8rem'
                }}>×</button>
              </span>
            )}
            {filters.semester && (
              <span className="badge badge-theory" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>
                Sem {filters.semester}
                <button onClick={() => setFilter('semester', '')} style={{
                  marginLeft: '0.375rem', background: 'none', border: 'none', cursor: 'pointer',
                  color: 'inherit', fontWeight: 700, fontSize: '0.8rem'
                }}>×</button>
              </span>
            )}
            {filters.section && (
              <span className="badge badge-theory" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>
                Section {filters.section}
                <button onClick={() => setFilter('section', '')} style={{
                  marginLeft: '0.375rem', background: 'none', border: 'none', cursor: 'pointer',
                  color: 'inherit', fontWeight: 700, fontSize: '0.8rem'
                }}>×</button>
              </span>
            )}
            {filters.type && (
              <span className="badge badge-type" style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}>
                {filters.type}
                <button onClick={() => setFilter('type', '')} style={{
                  marginLeft: '0.375rem', background: 'none', border: 'none', cursor: 'pointer',
                  color: 'inherit', fontWeight: 700, fontSize: '0.8rem'
                }}>×</button>
              </span>
            )}
          </div>
        )}

        {/* Resources */}
        {loading ? (
          <div className="grid grid-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="card" style={{
                height: '120px', animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.1}s`
              }} />
            ))}
          </div>
        ) : resources.length === 0 ? (
          <div className="empty-state" style={{ paddingTop: '3rem' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem', opacity: 0.5 }}>📂</div>
            <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              No resources found
            </p>
            <p className="text-sm" style={{ maxWidth: '320px', margin: '0 auto' }}>
              {activeFilterCount > 0
                ? 'Try adjusting your filters to see more results.'
                : 'No resources have been uploaded yet.'}
            </p>
            {activeFilterCount > 0 && (
              <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={clearFilters}>
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="anim-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {(() => {
              const grouped = [];
              const groupMap = {};
              resources.forEach(r => {
                const dateStr = new Date(r.createdAt).toDateString();
                const key = r.uploadGroupId || `${r.title}-${r.fileUrl}-${dateStr}-${r.uploadedBy}`;
                if (!groupMap[key]) {
                  groupMap[key] = { ...r, targets: [r] };
                  grouped.push(groupMap[key]);
                } else {
                  groupMap[key].targets.push(r);
                }
              });
              
              return grouped.map(group => {
                const r = group.targets[0];
                let targetLabel = '';
                if (group.targets.length === 1) {
                  const branchObj = taxonomy.find(b => b.id === r.targetBranch);
                  targetLabel = `${branchObj?.shortName || r.targetBranch} • Y${r.targetYear} S${r.targetSemester} ${r.targetSection}`;
                } else {
                  const branches = [...new Set(group.targets.map(t => taxonomy.find(b => b.id === t.targetBranch)?.shortName || t.targetBranch))];
                  const branchStr = branches.length > 1 ? 'Multiple Branches' : branches[0];
                  
                  const years = [...new Set(group.targets.map(t => `Y${t.targetYear}`))].sort().join(', ');
                  const sems = [...new Set(group.targets.map(t => `S${t.targetSemester}`))].sort().join(', ');
                  
                  targetLabel = `${branchStr} • ${years} • ${sems}`;
                }

                return (
                  <div key={r.id} className="card card-flat" style={{
                    padding: '1rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', justifyContent: 'space-between'
                  }}>
                    {/* Icon and Info (Left Side) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: '1 1 250px', minWidth: 0 }}>
                      <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>{typeIcons[r.type] || '📁'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p className="truncate" style={{ fontWeight: 600, fontSize: '0.95rem' }}>{r.title}</p>
                        <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                          <span className="badge badge-type">{r.type}</span>
                          <span className="badge badge-theory">
                            {targetLabel}
                          </span>
                          {r.subjectType && (
                            <span className={`badge ${r.subjectType === 'lab' ? 'badge-lab' : 'badge-theory'}`}>
                              {r.subjectType}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Meta and Actions (Right / Bottom Side) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', flex: '1 1 200px', justifyContent: 'space-between' }}>
                      <div style={{ textAlign: 'left', minWidth: '100px' }}>
                        <p className="text-xs text-muted">{r.uploaderName}</p>
                        <p className="text-xs text-muted">{new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>

                      {/* Analytics Badge */}
                      {analytics[r.id] && (
                        <div style={{ textAlign: 'center', minWidth: '90px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.25rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent)' }}>
                            <span>Views: {analytics[r.id].readCount} / {analytics[r.id].targetCount}</span>
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '0.375rem', flexShrink: 0 }}>
                        <button onClick={() => setPreviewResource(r)}
                          className="btn btn-sm btn-outline" title="View">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
                          </svg>
                        </button>
                        <button className="btn btn-sm btn-outline" onClick={() => setEditingResource(r)} title="Edit Resource">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                          </svg>
                        </button>
                        <button className="btn btn-sm" onClick={() => handleSoftDelete(group)}
                          style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '0.375rem 0.5rem' }}
                          title="Move to recycle bin">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
      
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
    </div>
  );
};

export default AdminResourceBrowser;
