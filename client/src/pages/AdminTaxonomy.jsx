import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';

const AdminTaxonomy = () => {
  const { user } = useContext(AuthContext);
  const [branches, setBranches] = useState([]);
  const [localColors, setLocalColors] = useState({}); // Optimistic color state
  const [expandedBranch, setExpandedBranch] = useState(null);
  const [newBranch, setNewBranch] = useState({ name: '', shortName: '', colorHex: '#74C3A3' });
  const [newSubject, setNewSubject] = useState({ branchId: '', yearLevel: '', semesterNumber: '', name: '', type: 'theory' });
  const [newSection, setNewSection] = useState({ branchId: '', yearLevel: '', semesterNumber: '', section: '' });
  const [saveStatus, setSaveStatus] = useState({}); // For branch color save feedback
  const [subjectSaveStatus, setSubjectSaveStatus] = useState({}); // For new subject save feedback
  const [sectionSaveStatus, setSectionSaveStatus] = useState({}); // For new section save feedback

  // Auto-detect text color based on background brightness
  const getTextColor = (hex) => {
    if (!hex) return '#ffffff';
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.55 ? '#1e293b' : '#ffffff';
  };

  const fetchBranches = () => api.get('/taxonomy').then(data => {
    if (user?.role === 'admin_faculty' && user?.profile?.branch) {
      setBranches(data.filter(b => b.id === user.profile.branch));
    } else {
      setBranches(data);
    }
  }).catch(() => {});
  useEffect(() => { fetchBranches(); }, []);

  const handleAddBranch = async (e) => {
    e.preventDefault();
    try {
      await api.post('/taxonomy/branches', newBranch);
      setNewBranch({ name: '', shortName: '', colorHex: '#dbeafe' });
      fetchBranches();
    } catch (err) { alert(err.message); }
  };

  const handleDeleteBranch = async (id) => {
    if (!window.confirm('DELETE this branch and ALL its data? This cannot be undone.')) return;
    try { await api.delete(`/taxonomy/branches/${id}`); fetchBranches(); }
    catch (err) { alert(err.message); }
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    try { await api.post('/taxonomy/subjects', newSubject); setNewSubject(prev => ({ ...prev, name: '' })); fetchBranches(); }
    catch (err) { alert(err.message); }
  };

  const handleDeleteSubject = async (id) => {
    if (!window.confirm('Delete this subject and all its resources?')) return;
    try { await api.delete(`/taxonomy/subjects/${id}`); fetchBranches(); }
    catch (err) { alert(err.message); }
  };

  const handleAddSection = async (e, branchId) => {
    e.preventDefault();
    try {
      await api.post('/taxonomy/sections', newSection);
      setNewSection(prev => ({ ...prev, section: '' }));
      fetchBranches();
      setSectionSaveStatus(prev => ({ ...prev, [branchId]: 'Section added!' }));
      setTimeout(() => setSectionSaveStatus(prev => ({ ...prev, [branchId]: null })), 3000);
    } catch (err) { alert(err.message); }
  };

  const handleRemoveSection = async (branchId, yearLevel, semesterNumber, section) => {
    if (!window.confirm(`Remove Section ${section}?`)) return;
    try { await api.delete('/taxonomy/sections', { branchId, yearLevel, semesterNumber, section }); fetchBranches(); }
    catch (err) { alert(err.message); }
  };

  const handleEditSubject = async (subject) => {
    const newName = window.prompt("Enter new subject name:", subject.name);
    if (!newName || newName === subject.name) return;
    try { await api.patch(`/taxonomy/subjects/${subject.id}`, { name: newName }); fetchBranches(); }
    catch (err) { alert(err.message); }
  };

  const handleEditSection = async (branchId, yearLevel, semesterNumber, oldSection) => {
    const newSection = window.prompt(`Rename Section ${oldSection} to:`, oldSection);
    if (!newSection || newSection.toUpperCase() === oldSection) return;
    try { await api.patch('/taxonomy/sections', { branchId, yearLevel, semesterNumber, oldSection, newSection }); fetchBranches(); }
    catch (err) { alert(err.message); }
  };

  const handleChangeThemeColor = async (branchId, colorHex) => {
    // Optimistic update — instant visual change before API call
    setLocalColors(prev => ({ ...prev, [branchId]: colorHex }));
    setSaveStatus(prev => ({ ...prev, [branchId]: 'Saving...' }));
    try {
      await api.patch(`/taxonomy/branches/${branchId}/color`, { colorHex });
      setSaveStatus(prev => ({ ...prev, [branchId]: '✓ Saved!' }));
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [branchId]: null })), 3000);
      fetchBranches();
    } catch (err) {
      // Revert on failure
      setLocalColors(prev => { const copy = { ...prev }; delete copy[branchId]; return copy; });
      setSaveStatus(prev => ({ ...prev, [branchId]: '✗ Failed' }));
      setTimeout(() => setSaveStatus(prev => ({ ...prev, [branchId]: null })), 3000);
      alert(err.message);
    }
  };

  const handleSubjectSubmit = async (e, branchId) => {
    e.preventDefault();
    try {
      await api.post('/taxonomy/subjects', newSubject);
      setNewSubject(prev => ({ ...prev, name: '' }));
      fetchBranches();
      setSubjectSaveStatus({ ...subjectSaveStatus, [branchId]: 'Subject added successfully!' });
      setTimeout(() => setSubjectSaveStatus(prev => ({ ...prev, [branchId]: null })), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="app-header"><h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Taxonomy Manager</h1></div>

      {/* Add Branch */}
      {user?.role !== 'admin_faculty' && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Add New Branch</h3>
          <form onSubmit={handleAddBranch} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 2, minWidth: '150px', marginBottom: 0 }}>
              <label className="form-label">Name</label>
              <input className="form-input" value={newBranch.name} onChange={e => setNewBranch({ ...newBranch, name: e.target.value })} placeholder="e.g., Data Science" required />
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: '100px', marginBottom: 0 }}>
              <label className="form-label">Short</label>
              <input className="form-input" value={newBranch.shortName} onChange={e => setNewBranch({ ...newBranch, shortName: e.target.value })} placeholder="DS" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Color</label>
              <input type="color" value={newBranch.colorHex} onChange={e => setNewBranch({ ...newBranch, colorHex: e.target.value })} style={{ width: 40, height: 40, border: 'none', borderRadius: 4, cursor: 'pointer' }} />
            </div>
            <button className="btn btn-primary" type="submit">Add Branch</button>
          </form>
        </div>
      )}

      {/* Branch List */}
      <div className="anim-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {branches.map(branch => (
          <div key={branch.id} className="card card-flat" style={{ padding: 0, overflow: 'hidden' }}>
            {/* Colored Header - uses localColors for instant update */}
            {(() => {
              const activeBgColor = localColors[branch.id] || branch.colorHex || '#74C3A3';
              const activeTextColor = getTextColor(activeBgColor);
              return (
                <div style={{ 
                  background: activeBgColor, 
                  padding: '1.25rem', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  transition: 'background 0.3s ease'
                }}
                  onClick={() => setExpandedBranch(expandedBranch === branch.id ? null : branch.id)}>
                  <div>
                    <h4 style={{ fontWeight: 800, margin: 0, fontSize: '1.2rem', color: activeTextColor }}>
                      {branch.name} <span style={{ opacity: 0.75, fontSize: '0.85em', fontWeight: 600 }}>({branch.shortName})</span>
                    </h4>
                    <p style={{ margin: 0, fontSize: '0.85rem', opacity: 0.8, marginTop: '0.25rem', color: activeTextColor }}>
                      {branch.years?.length || 0} years • {branch.years?.reduce((a, y) => a + y.semesters.reduce((b, s) => b + s.subjects.length, 0), 0)} subjects
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {user?.role !== 'admin_faculty' && (
                      <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); handleDeleteBranch(branch.id); }} style={{ background: '#ef4444', color: '#ffffff', border: 'none', padding: '0.25rem 0.75rem', borderRadius: '6px' }}>Delete</button>
                    )}
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={activeTextColor} strokeWidth="2" style={{ opacity: 0.8, transform: expandedBranch === branch.id ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </div>
              );
            })()}

            {expandedBranch === branch.id && (
              <div style={{ padding: '1.25rem', background: 'var(--bg-glass)', borderTop: '1px solid var(--border-glass)' }}>
                {/* Theme Customization Panel */}
                <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(255,255,255,0.04)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                  <p style={{ fontWeight: 700, margin: '0 0 0.75rem 0', fontSize: '0.9rem', letterSpacing: '0.05em', textTransform: 'uppercase', opacity: 0.7 }}>🎨 Header Color</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    {/* Preset swatches */}
                    {[
                      { color: '#74C3A3', label: 'Mint' },
                      { color: '#F4A6C1', label: 'Pink' },
                      { color: '#818CF8', label: 'Purple' },
                      { color: '#FB923C', label: 'Orange' },
                      { color: '#38BDF8', label: 'Sky' },
                      { color: '#A3E635', label: 'Lime' },
                      { color: '#1e293b', label: 'Dark' },
                      { color: '#ffffff', label: 'White' },
                    ].map(({ color, label }) => {
                      const activeColor = localColors[branch.id] || branch.colorHex;
                      const isActive = activeColor === color;
                      return (
                        <button key={color} onClick={() => handleChangeThemeColor(branch.id, color)}
                          title={label}
                          style={{ 
                            width: 36, height: 36, borderRadius: '50%', background: color, 
                            border: isActive ? '3px solid var(--primary)' : '2px solid rgba(255,255,255,0.15)',
                            cursor: 'pointer', flexShrink: 0,
                            boxShadow: isActive ? '0 0 0 2px var(--accent)' : 'none',
                            transition: 'transform 0.15s, box-shadow 0.15s',
                            transform: isActive ? 'scale(1.15)' : 'scale(1)'
                          }}
                        />
                      );
                    })}
                    {/* Divider */}
                    <div style={{ width: 1, height: 28, background: 'var(--border-glass)' }} />
                    {/* Custom color picker */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Custom:</span>
                      <input 
                        type="color" 
                        value={localColors[branch.id] || branch.colorHex || '#74C3A3'} 
                        onChange={(e) => handleChangeThemeColor(branch.id, e.target.value)} 
                        style={{ width: 36, height: 36, border: '2px solid var(--border-glass)', borderRadius: '6px', cursor: 'pointer', padding: 2, background: 'transparent' }} 
                      />
                    </div>
                    {/* Save status */}
                    {saveStatus[branch.id] && (
                      <span style={{ 
                        fontSize: '0.85rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '6px',
                        color: saveStatus[branch.id].includes('✓') ? '#22c55e' : saveStatus[branch.id].includes('✗') ? '#ef4444' : 'var(--text-secondary)',
                        background: saveStatus[branch.id].includes('✓') ? 'rgba(34,197,94,0.1)' : saveStatus[branch.id].includes('✗') ? 'rgba(239,68,68,0.1)' : 'transparent'
                      }}>{saveStatus[branch.id]}</span>
                    )}
                  </div>
                </div>
                {branch.years?.map(year => (
                  <div key={year.id} style={{ marginBottom: '1rem' }}>
                    <h5 style={{ fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{year.name}</h5>
                    {year.semesters?.map(sem => (
                      <div key={sem.id} style={{ marginLeft: '1rem', marginBottom: '0.75rem', padding: '0.75rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{sem.name}</span>
                          <div style={{ display: 'flex', gap: '0.25rem' }}>
                            {sem.sections?.map(sec => (
                              <span key={sec} className="badge badge-type" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <span onClick={() => handleEditSection(branch.id, year.level, sem.number, sec)} title="Click to rename">{sec}</span>
                                <button onClick={() => handleRemoveSection(branch.id, year.level, sem.number, sec)} title="Remove section" style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7, padding: 0, fontSize: '12px' }}>×</button>
                              </span>
                            ))}
                          </div>
                        </div>
                        {/* Subjects */}
                        {sem.subjects?.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginBottom: '0.5rem' }}>
                            {sem.subjects.map(sub => (
                              <span key={sub.id} className={`badge ${sub.type === 'lab' ? 'badge-lab' : 'badge-theory'}`} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <span onClick={() => handleEditSubject(sub)} title="Click to rename">{sub.name}</span>
                                <button onClick={() => handleDeleteSubject(sub.id)} title="Delete subject" style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7, padding: 0, fontSize: '12px' }}>×</button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}

                {/* Add New Subject Card */}
                <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'var(--accent-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <p style={{ fontWeight: 700, margin: 0, fontSize: '1.05rem' }}>Add New Subject</p>
                    {subjectSaveStatus[branch.id] && <span className="badge" style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '0.25rem 0.75rem' }}>{subjectSaveStatus[branch.id]}</span>}
                  </div>
                  <form onSubmit={(e) => handleSubjectSubmit(e, branch.id)} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <select className="form-select" style={{ flex: 1, minWidth: '80px' }} value={newSubject.branchId === branch.id ? newSubject.yearLevel : ''} onChange={e => setNewSubject({ ...newSubject, branchId: branch.id, yearLevel: e.target.value })} required>
                      <option value="">Year</option>
                      {branch.years?.map(y => <option key={y.id} value={y.level}>{y.name}</option>)}
                    </select>
                    <select className="form-select" style={{ flex: 1, minWidth: '80px' }} value={newSubject.branchId === branch.id ? newSubject.semesterNumber : ''} onChange={e => setNewSubject({ ...newSubject, branchId: branch.id, semesterNumber: e.target.value })} required>
                      <option value="">Sem</option>
                      {branch.years?.find(y => y.level === Number(newSubject.yearLevel))?.semesters?.map(s => <option key={s.id} value={s.number}>{s.name}</option>)}
                    </select>
                    <input className="form-input" style={{ flex: 2, minWidth: '150px' }} value={newSubject.branchId === branch.id ? newSubject.name : ''} onChange={e => setNewSubject({ ...newSubject, branchId: branch.id, name: e.target.value })} placeholder="Enter subject name" required />
                    <select className="form-select" style={{ width: '100px' }} value={newSubject.type} onChange={e => setNewSubject({ ...newSubject, type: e.target.value })}>
                      <option value="theory">Theory</option>
                      <option value="lab">Lab</option>
                    </select>
                    <button className="btn btn-primary" style={{ padding: '0.6rem 1.25rem' }} type="submit">Save Subject</button>
                  </form>
                </div>

                {/* Add New Section Card — identical style to Add New Subject */}
                <div style={{ marginTop: '1rem', padding: '1.25rem', background: 'var(--accent-bg)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <p style={{ fontWeight: 700, margin: 0, fontSize: '1.05rem' }}>Add New Section</p>
                    {sectionSaveStatus[branch.id] && <span className="badge" style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '0.25rem 0.75rem' }}>✓ {sectionSaveStatus[branch.id]}</span>}
                  </div>
                  <form onSubmit={(e) => handleAddSection(e, branch.id)} style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <select className="form-select" style={{ flex: 1, minWidth: '80px' }} value={newSection.branchId === branch.id ? newSection.yearLevel : ''} onChange={e => setNewSection({ ...newSection, branchId: branch.id, yearLevel: e.target.value })} required>
                      <option value="">Year</option>
                      {branch.years?.map(y => <option key={y.id} value={y.level}>{y.name}</option>)}
                    </select>
                    <select className="form-select" style={{ flex: 1, minWidth: '80px' }} value={newSection.branchId === branch.id ? newSection.semesterNumber : ''} onChange={e => setNewSection({ ...newSection, branchId: branch.id, semesterNumber: e.target.value })} required>
                      <option value="">Sem</option>
                      {branch.years?.find(y => y.level === Number(newSection.yearLevel))?.semesters?.map(s => <option key={s.id} value={s.number}>{s.name}</option>)}
                    </select>
                    <input className="form-input" style={{ width: '70px', textAlign: 'center', fontWeight: 700, letterSpacing: '0.1em' }} maxLength={1} value={newSection.branchId === branch.id ? newSection.section : ''} onChange={e => setNewSection({ ...newSection, branchId: branch.id, section: e.target.value.toUpperCase() })} placeholder="D" required />
                    <button className="btn btn-primary" style={{ padding: '0.6rem 1.25rem' }} type="submit">Save Section</button>
                  </form>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminTaxonomy;
