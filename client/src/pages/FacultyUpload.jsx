import React, { useState, useEffect, useRef, useContext } from 'react';
import { createPortal } from 'react-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const FacultyUpload = () => {
  const fileRef = useRef(null);
  const [step, setStep] = useState(0); // 0=file, 1=target, 2=details, 3=review
  const [file, setFile] = useState(null);
  const [branches, setBranches] = useState([]);
  const [form, setForm] = useState({
    targetBranch: '', targetYear: '', targetSemester: '', targetSection: '',
    subjectType: '', subjectId: '', title: '', type: 'PDF',
    categoryHeading: '', startDate: '', endDate: '', expirationDate: '',
    linkUrl: '', textContent: '', pinShape: 'pin', pinColor: 'yellow', notify: false,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showSubjectTypeDropdown, setShowSubjectTypeDropdown] = useState(false);

  const { user, selectedBranch: authSelectedBranch } = useContext(AuthContext);
  const isStrictBranch = user?.role === 'faculty' || user?.role === 'admin_faculty';
  const assignments = user?.role === 'faculty' ? user?.profile?.assignments || [] : [];
  const legacyBranch = isStrictBranch ? (user?.profile?.branch || authSelectedBranch) : null;

  useEffect(() => { 
    api.get('/taxonomy').then(data => {
      if (assignments.length > 0) {
        const assignedBranchIds = [...new Set(assignments.map(a => a.branch))];
        setBranches(data.filter(b => assignedBranchIds.includes(b.id)));
      } else if (legacyBranch) {
        setBranches(data.filter(b => b.id === legacyBranch));
      } else {
        setBranches(data);
      }
    }).catch(() => {});
    
    if (legacyBranch) {
      setForm(prev => ({ ...prev, targetBranch: legacyBranch }));
    } else if (user?.role === 'faculty' && assignments.length === 1) {
      setForm(prev => ({ ...prev, targetBranch: assignments[0].branch }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'linkUrl' && value && !file && !prev.textContent) {
        updated.type = 'Link';
      }
      if (name === 'textContent' && value && !file && !prev.linkUrl) {
        updated.type = 'Tweet';
      }
      return updated;
    });
  };

  const handleCheckboxChange = (name, val, checked) => {
    setForm(prev => {
      const current = Array.isArray(prev[name]) ? prev[name] : (prev[name] ? [prev[name]] : []);
      let updated;
      if (checked) {
        updated = [...current, val];
      } else {
        updated = current.filter(item => String(item) !== String(val));
      }
      return { ...prev, [name]: updated };
    });
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      setForm(prev => ({ 
        ...prev, 
        targetBranch: [], 
        targetYear: [], 
        targetSemester: [], 
        targetSection: [] 
      }));
    } else if (user?.role === 'admin_faculty') {
      setForm(prev => ({ 
        ...prev, 
        targetYear: [], 
        targetSemester: [], 
        targetSection: [] 
      }));
    }
  }, [user]);

  const activeBranchId = Array.isArray(form.targetBranch) ? form.targetBranch[0] : form.targetBranch;
  const selectedBranch = branches.find(b => b.id === activeBranchId) || branches[0];
  
  let availableYears = selectedBranch?.years || [];
  if (assignments.length > 0 && form.targetBranch) {
    const branchIds = Array.isArray(form.targetBranch) ? form.targetBranch : [form.targetBranch];
    const branchAssignments = assignments.filter(a => branchIds.includes(a.branch));
    const assignedYears = [...new Set(branchAssignments.map(a => Number(a.year)))];
    if (assignedYears.length > 0 && !assignedYears.includes(NaN)) {
      availableYears = availableYears.filter(y => assignedYears.includes(y.level));
    }
  }

  let availableSemesters = [];
  const selectedYearLevels = Array.isArray(form.targetYear) ? form.targetYear.map(Number) : (form.targetYear ? [Number(form.targetYear)] : []);
  const yearsToInspect = selectedYearLevels.length > 0 
    ? availableYears.filter(y => selectedYearLevels.includes(Number(y.level)))
    : availableYears;

  const semMap = new Map();
  yearsToInspect.forEach(y => {
    y.semesters?.forEach(s => semMap.set(s.number, { ...s, yearLevel: y.level }));
  });
  availableSemesters = Array.from(semMap.values()).sort((a, b) => a.number - b.number);

  if (user?.role === 'faculty' && assignments.length > 0 && form.targetBranch) {
    const branchIds = Array.isArray(form.targetBranch) ? form.targetBranch : [form.targetBranch];
    const yearsToCheck = selectedYearLevels.length > 0 ? selectedYearLevels : availableYears.map(y => y.level);
    const validAssignments = assignments.filter(a => branchIds.includes(a.branch) && yearsToCheck.includes(Number(a.year)));
    const assignedSems = [...new Set(validAssignments.map(a => Number(a.semester)))];
    if (assignedSems.length > 0 && !assignedSems.includes(NaN)) {
      availableSemesters = availableSemesters.filter(s => assignedSems.includes(s.number));
    }
  }

  let availableSections = [];
  let isAllSectionsAllowed = true;
  const selectedSemNumbers = Array.isArray(form.targetSemester) ? form.targetSemester.map(Number) : (form.targetSemester ? [Number(form.targetSemester)] : []);
  const semsToInspect = selectedSemNumbers.length > 0
    ? availableSemesters.filter(s => selectedSemNumbers.includes(Number(s.number)))
    : availableSemesters;

  const secSet = new Set();
  semsToInspect.forEach(s => {
    s.sections?.forEach(sec => secSet.add(sec));
  });
  availableSections = Array.from(secSet).sort();

  if (user?.role === 'faculty' && assignments.length > 0 && form.targetBranch) {
    const branchIds = Array.isArray(form.targetBranch) ? form.targetBranch : [form.targetBranch];
    const yearsToCheck = selectedYearLevels.length > 0 ? selectedYearLevels : availableYears.map(y => y.level);
    const semsToCheck = selectedSemNumbers.length > 0 ? selectedSemNumbers : availableSemesters.map(s => s.number);
    
    const validAssignments = assignments.filter(a => 
      branchIds.includes(a.branch) && 
      yearsToCheck.includes(Number(a.year)) && 
      semsToCheck.includes(Number(a.semester))
    );
    const assignedSecs = [...new Set(validAssignments.map(a => a.section))];
    if (assignedSecs.length > 0 && !assignedSecs.includes('ALL')) {
      availableSections = availableSections.filter(s => assignedSecs.includes(s));
      isAllSectionsAllowed = false;
    }
  }

  const showSubjectDropdown = true;

  const getCombinedSubjects = () => {
    const selectedBranchIds = Array.isArray(form.targetBranch) ? form.targetBranch.filter(Boolean) : [form.targetBranch].filter(Boolean);
    const selectedYearLevels = Array.isArray(form.targetYear) ? form.targetYear.filter(Boolean).map(Number) : [form.targetYear].filter(Boolean).map(Number);
    const selectedSemNumbers = Array.isArray(form.targetSemester) ? form.targetSemester.filter(Boolean).map(Number) : [form.targetSemester].filter(Boolean).map(Number);
    const selectedSections = Array.isArray(form.targetSection) ? form.targetSection.filter(Boolean) : [form.targetSection].filter(Boolean);

    const subjectMap = new Map();
    const branchesToInspect = selectedBranchIds.length > 0 ? branches.filter(b => selectedBranchIds.includes(b.id)) : branches;

    branchesToInspect.forEach(branch => {
      const branchLabel = branch.shortName || branch.name || branch.id.replace('br_', '').toUpperCase();
      branch.years?.forEach(year => {
        if (selectedYearLevels.length > 0 && !selectedYearLevels.includes(Number(year.level))) return;

        year.semesters?.forEach(sem => {
          if (selectedSemNumbers.length > 0 && !selectedSemNumbers.includes(Number(sem.number))) return;

          sem.subjects?.forEach(sub => {
            if (!form.subjectType || form.subjectType === 'tweet' || sub.type === form.subjectType) {
              
              if (user?.role === 'faculty') {
                if (assignments.length === 0) return;
                
                const matchingAssignments = assignments.filter(a => 
                  a.branch === branch.id &&
                  Number(a.year) === Number(year.level) &&
                  Number(a.semester) === Number(sem.number) &&
                  (selectedSections.length === 0 || a.section === 'ALL' || selectedSections.some(sec => sec === a.section || a.section === 'ALL'))
                );
                
                const assignedSubjectIds = matchingAssignments.map(a => a.subjectId).filter(Boolean);
                if (!assignedSubjectIds.includes(sub.id)) {
                  return;
                }
              }

              const displayName = sub.name;
              subjectMap.set(sub.id, { 
                ...sub, 
                name: displayName,
                branchName: branchLabel,
                branchId: branch.id,
                yearLevel: Number(year.level),
                semNumber: Number(sem.number)
              });
            }
          });
        });
      });
    });

    return Array.from(subjectMap.values());
  };

  const filteredSubjects = getCombinedSubjects();

  useEffect(() => {
    if (showSubjectDropdown && filteredSubjects.length === 1 && form.subjectId !== filteredSubjects[0].id) {
      setForm(prev => ({ ...prev, subjectId: filteredSubjects[0].id }));
    }
  }, [filteredSubjects, form.subjectId, showSubjectDropdown]);

  let availableSubjectFormats = [
    { val: '', label: 'Any' },
    { val: 'theory', label: 'Theory' },
    { val: 'lab', label: 'Lab' },
    { val: 'tweet', label: 'Tweet' }
  ];

  if (user?.role === 'faculty' && assignments.length > 0) {
    const assignedIds = new Set(assignments.map(a => a.subjectId).filter(Boolean));
    let hasTheory = false;
    let hasLab = false;
    branches.forEach(b => {
      b.years?.forEach(y => {
        y.semesters?.forEach(s => {
          s.subjects?.forEach(sub => {
            if (assignedIds.has(sub.id)) {
              if (sub.type === 'theory' || !sub.type) hasTheory = true;
              if (sub.type === 'lab') hasLab = true;
            }
          });
        });
      });
    });
    availableSubjectFormats = availableSubjectFormats.filter(f => {
      if (f.val === 'theory') return hasTheory;
      if (f.val === 'lab') return hasLab;
      return true;
    });
  }

  const steps = ['File', 'Target', 'Details', 'Review'];

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const fd = new FormData();
      if (file) fd.append('file', file);
      Object.entries(form).forEach(([k, v]) => { 
        if (v !== '' && v !== false) {
          if (Array.isArray(v)) {
            fd.append(k, v.join(','));
          } else if (k === 'subjectId' && v === 'none') {
            // Do not send subjectId (leave it null)
          } else {
            fd.append(k, v);
          }
        }
      });

      // Auto-fill targetYear if they only selected semesters
      if ((!form.targetYear || (Array.isArray(form.targetYear) && form.targetYear.length === 0)) && 
          (Array.isArray(form.targetSemester) && form.targetSemester.length > 0)) {
        const derivedYears = [];
        form.targetSemester.forEach(semNum => {
          const sem = availableSemesters.find(s => Number(s.number) === Number(semNum));
          if (sem && !derivedYears.includes(sem.yearLevel)) derivedYears.push(sem.yearLevel);
        });
        if (derivedYears.length > 0) fd.set('targetYear', derivedYears.join(','));
      }
      await api.post('/resources/upload', fd);
      setSuccess(true);
    } catch (err) {
      alert(err.message || 'Error uploading resource');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
        <h2 style={{ fontWeight: 800, marginBottom: '0.5rem' }}>Published Successfully!</h2>
        <p className="text-muted" style={{ marginBottom: '1.5rem' }}>Your resource is now live for students.</p>
        <button className="btn btn-primary" onClick={() => { setSuccess(false); setStep(0); setFile(null); setForm({ ...form, title: '', categoryHeading: '', startDate: '', endDate: '', linkUrl: '' }); }}>Upload Another</button>
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '15rem' }}>
      <div className="app-header"><h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Upload Resource</h1></div>

      {/* Progress */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          {steps.map((s, i) => (
            <span key={s} style={{ fontSize: '0.75rem', fontWeight: i <= step ? 700 : 400, color: i <= step ? 'var(--accent)' : 'var(--text-muted)' }}>{s}</span>
          ))}
        </div>
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${((step + 1) / 4) * 100}%` }} /></div>
      </div>

      {/* Step 0: File */}
      {step === 0 && (
        <div className="card" style={{ maxWidth: '600px' }}>
          <div onClick={() => fileRef.current?.click()} style={{
            border: '2px dashed var(--accent)', borderRadius: 'var(--radius-lg)',
            padding: '3rem 1rem', textAlign: 'center', cursor: 'pointer',
            background: file ? 'var(--accent-bg)' : 'transparent', transition: 'background 0.3s'
          }}>
            <input 
              type="file" 
              ref={fileRef} 
              onChange={e => {
                const selectedFile = e.target.files[0];
                setFile(selectedFile);
                if (selectedFile) {
                  const ext = selectedFile.name.split('.').pop()?.toLowerCase();
                  let detected = 'Notes';
                  if (ext === 'pdf') detected = 'PDF';
                  else if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) detected = 'Image';
                  else if (['mp4', 'webm', 'mov'].includes(ext)) detected = 'Video';
                  setForm(prev => ({ ...prev, type: detected, linkUrl: '' }));
                }
              }} 
              style={{ display: 'none' }} 
            />
            {file ? (
              <div>
                <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{file.name}</p>
                <p className="text-sm text-muted">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ) : (
              <div>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" style={{ marginBottom: '0.75rem' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
                <p style={{ fontWeight: 600 }}>Click or drag to upload</p>
                <p className="text-sm text-muted">PDF, Images, Docs (max 50MB)</p>
              </div>
            )}
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Or paste an external link</label>
            <input className="form-input" name="linkUrl" value={form.linkUrl} onChange={handleChange} placeholder="https://..." disabled={!!form.textContent} />
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Or type a quick announcement</label>
            <textarea 
              className="form-input" 
              name="textContent" 
              value={form.textContent} 
              onChange={handleChange} 
              placeholder="Type your message here (like a tweet or bulletin)..." 
              rows={3} 
              style={{ resize: 'vertical' }}
              disabled={!!file || !!form.linkUrl}
            />
          </div>
          {form.textContent && !file && !form.linkUrl && (
            <div className="form-group" style={{ marginTop: '1rem', background: 'var(--bg-glass)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <label className="form-label" style={{ marginBottom: '0.75rem', display: 'block' }}>Select a Badge/Pin Style:</label>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {['star', 'book_open', 'lightbulb', 'paperclip', 'pin', 'books', 'link', 'hourglass', 'target', 'megaphone', 'calendar', 'file_box', 'envelope', 'laptop', 'bookmark_tabs', 'bookmark_tag', 'journal'].map(shape => (
                  <label key={shape} style={{ 
                    display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', 
                    padding: '0.375rem 0.75rem', 
                    border: form.pinShape === shape ? '2px solid var(--accent)' : '2px solid transparent', 
                    borderRadius: 'var(--radius-md)', 
                    background: form.pinShape === shape ? 'var(--accent-bg)' : 'rgba(255,255,255,0.05)',
                    transition: 'all 0.2s ease'
                  }}>
                    <input type="radio" name="pinShape" value={shape} checked={form.pinShape === shape} onChange={handleChange} style={{ display: 'none' }} />
                    <span style={{ fontSize: '1.25rem' }}>
                      {shape === 'star' && '⭐'}
                      {shape === 'book_open' && '📖'}
                      {shape === 'lightbulb' && '💡'}
                      {shape === 'paperclip' && '📎'}
                      {shape === 'pin' && '📌'}
                      {shape === 'books' && '📚'}
                      {shape === 'link' && '🔗'}
                      {shape === 'hourglass' && '⏳'}
                      {shape === 'target' && '🎯'}
                      {shape === 'megaphone' && '📢'}
                      {shape === 'calendar' && '📅'}
                      {shape === 'file_box' && '🗃️'}
                      {shape === 'envelope' && '✉️'}
                      {shape === 'laptop' && '💻'}
                      {shape === 'bookmark_tabs' && '📑'}
                      {shape === 'bookmark_tag' && '🔖'}
                      {shape === 'journal' && '📒'}
                    </span>
                    <span style={{ textTransform: 'capitalize', fontSize: '0.85rem', fontWeight: 600 }}>{shape.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>

              <label className="form-label" style={{ marginTop: '1.25rem', marginBottom: '0.75rem', display: 'block' }}>Select Sticky Note Color:</label>
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {[
                  { id: 'yellow', bg: '#fef08a', border: '#facc15' },
                  { id: 'pink', bg: '#fbcfe8', border: '#f472b6' },
                  { id: 'blue', bg: '#bae6fd', border: '#7dd3fc' },
                  { id: 'green', bg: '#bbf7d0', border: '#86efac' },
                  { id: 'purple', bg: '#e9d5ff', border: '#d8b4fe' },
                  { id: 'white', bg: '#f8fafc', border: '#cbd5e1' },
                  { id: 'orange', bg: '#fed7aa', border: '#fdba74' },
                  { id: 'teal', bg: '#99f6e4', border: '#5eead4' },
                  { id: 'indigo', bg: '#c7d2fe', border: '#a5b4fc' },
                  { id: 'rose', bg: '#fecdd3', border: '#fda4af' },
                  { id: 'slate', bg: '#e2e8f0', border: '#cbd5e1' }
                ].map(c => (
                  <label key={c.id} style={{
                    width: '36px', height: '36px', cursor: 'pointer',
                    background: c.bg,
                    border: form.pinColor === c.id ? `2px solid var(--text-primary)` : `1px solid ${c.border}`,
                    borderRadius: '8px',
                    boxShadow: form.pinColor === c.id ? '0 0 0 2px var(--bg-primary), 0 0 0 4px var(--text-primary)' : 'none',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}>
                    <input type="radio" name="pinColor" value={c.id} checked={form.pinColor === c.id} onChange={handleChange} style={{ display: 'none' }} />
                  </label>
                ))}
              </div>
            </div>
          )}
          <button className="btn btn-primary btn-block" style={{ marginTop: '1rem' }}
            disabled={!file && !form.linkUrl && !form.textContent} onClick={() => setStep(1)}>
            Next: Select Target →
          </button>
        </div>
      )}

      {/* Step 1: Target */}
      {step === 1 && (
        <div className="card" style={{ maxWidth: '600px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Target Audience</h3>
          <div className="grid grid-2">
            {/* Branch */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Branch(es)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.5rem', padding: '0.75rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                {branches.map(b => {
                  const isChecked = Array.isArray(form.targetBranch) 
                    ? form.targetBranch.includes(b.id) 
                    : form.targetBranch === b.id;
                  return (
                    <label key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={e => handleCheckboxChange('targetBranch', b.id, e.target.checked)} 
                        style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                      />
                      {b.shortName || b.name}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Year */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Year(s)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem', padding: '0.75rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                {availableYears.map(y => {
                  const isChecked = Array.isArray(form.targetYear) 
                    ? form.targetYear.map(Number).includes(Number(y.level)) 
                    : Number(form.targetYear) === Number(y.level);
                  return (
                    <label key={y.level} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={e => handleCheckboxChange('targetYear', Number(y.level), e.target.checked)} 
                        style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                      />
                      {y.name}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Semester */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Semester(s)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem', padding: '0.75rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                {availableSemesters.map(s => {
                  const isChecked = Array.isArray(form.targetSemester) 
                    ? form.targetSemester.map(Number).includes(Number(s.number)) 
                    : Number(form.targetSemester) === Number(s.number);
                  return (
                    <label key={s.number} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={e => handleCheckboxChange('targetSemester', Number(s.number), e.target.checked)} 
                        style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                      />
                      {s.name}
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Section */}
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label className="form-label">Section(s)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.5rem', padding: '0.75rem', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                {isAllSectionsAllowed && (
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input 
                      type="checkbox" 
                      checked={Array.isArray(form.targetSection) && form.targetSection.includes('ALL')}
                      onChange={e => handleCheckboxChange('targetSection', 'ALL', e.target.checked)} 
                      style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                    />
                    ALL Sections
                  </label>
                )}
                {availableSections.map(sec => {
                  const isChecked = Array.isArray(form.targetSection) 
                    ? form.targetSection.includes(sec) 
                    : form.targetSection === sec;
                  return (
                    <label key={sec} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input 
                        type="checkbox" 
                        checked={isChecked} 
                        onChange={e => handleCheckboxChange('targetSection', sec, e.target.checked)} 
                        style={{ width: 16, height: 16, accentColor: 'var(--accent)' }}
                      />
                      Section {sec}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {showSubjectDropdown ? (
            <div className="grid grid-2" style={{ marginTop: '0.5rem' }}>
              <div className="form-group">
                <label className="form-label">Subject Format</label>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className="form-input"
                    style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onClick={() => setShowSubjectTypeDropdown(!showSubjectTypeDropdown)}
                  >
                    {availableSubjectFormats.find(f => f.val === form.subjectType)?.label || 'Any'}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                  
                  {showSubjectTypeDropdown && (
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: 0,
                      right: 0,
                      marginBottom: '0.25rem',
                      background: 'var(--bg-glass-strong)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: 'var(--radius-md)',
                      maxHeight: '180px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: 'var(--shadow-lg)'
                    }}>
                      {availableSubjectFormats.map(opt => (
                        <button
                          key={opt.val}
                          type="button"
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.75rem 1rem',
                            background: form.subjectType === opt.val ? 'var(--accent-bg)' : 'transparent',
                            color: form.subjectType === opt.val ? 'var(--accent)' : 'var(--text-primary)',
                            borderBottom: '1px solid var(--border-glass)',
                            fontSize: '0.9rem',
                            fontWeight: form.subjectType === opt.val ? 600 : 400
                          }}
                          onClick={() => {
                            setForm(prev => {
                              let newSubjectId = prev.subjectId;
                              if (opt.val === 'tweet') {
                                newSubjectId = 'none';
                              } else if ((opt.val === 'theory' || opt.val === 'lab') && prev.subjectId === 'none') {
                                newSubjectId = '';
                              }
                              return { ...prev, subjectType: opt.val, subjectId: newSubjectId };
                            });
                            setShowSubjectTypeDropdown(false);
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group" style={{ minWidth: 0 }}>
                <label className="form-label">Subject</label>
                {/* Custom Styled Select Trigger Button */}
                <div 
                  className="form-select" 
                  onClick={() => setShowSubjectModal(true)} 
                  style={{ 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    background: 'var(--bg-glass)',
                    height: '42px',
                    overflow: 'hidden',
                    gap: '0.5rem',
                    minWidth: 0
                  }}
                >
                  <span className="truncate" style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                    {(() => {
                      if (form.subjectId === 'none') return 'No Subject / Custom Label';
                      const selected = filteredSubjects.find(s => s.id === form.subjectId);
                      if (selected) {
                        const branchPref = selected.branchName ? `[${selected.branchName}] ` : '';
                        const semPref = selected.semNumber ? `S${selected.semNumber} • ` : '';
                        return `${branchPref}${semPref}${selected.name}${selected.type === 'lab' ? ' (Lab)' : ''}`;
                      }
                      return <span style={{ color: 'var(--text-muted)' }}>Select Subject...</span>;
                    })()}
                  </span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}><path d="M6 9l6 6 6-6"/></svg>
                </div>

                {/* Custom Popup Modal for Subject Picker */}
                {showSubjectModal && createPortal(
                  <div 
                    className="modal-overlay" 
                    onClick={() => setShowSubjectModal(false)}
                    style={{ zIndex: 10000, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                  >
                    <div 
                      className="modal-content" 
                      onClick={e => e.stopPropagation()}
                      style={{ 
                        maxWidth: '400px', 
                        maxHeight: '70vh', 
                        display: 'flex', 
                        flexDirection: 'column', 
                        padding: '1.25rem',
                        background: 'var(--bg-glass-strong)',
                        backdropFilter: 'blur(25px)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '0.5rem' }}>
                        <h4 style={{ fontWeight: 700, margin: 0 }}>Select Subject</h4>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          onClick={() => setShowSubjectModal(false)}
                          style={{ padding: '0.2rem 0.5rem', color: 'var(--danger)' }}
                        >
                          Close
                        </button>
                      </div>
                      
                      {/* List items wrapper */}
                      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }} className="hide-scrollbar">
                        {user?.role !== 'faculty' && (
                          <button
                            className="btn btn-outline btn-block text-left"
                            style={{ 
                              textAlign: 'left', 
                              justifyContent: 'flex-start', 
                              fontWeight: 500,
                              background: form.subjectId === 'none' ? 'var(--accent-bg)' : 'transparent',
                              borderColor: form.subjectId === 'none' ? 'var(--accent)' : 'var(--border-glass)'
                            }}
                            onClick={() => {
                              setForm(prev => ({ ...prev, subjectId: 'none' }));
                              setShowSubjectModal(false);
                            }}
                          >
                            📁 No Subject (General / Custom Label)
                          </button>
                        )}

                        {(() => {
                          // Group subjects by branch and semester
                          const groups = {};
                          filteredSubjects.forEach(s => {
                            const bKey = s.branchName || 'Subjects';
                            const semKey = s.semNumber ? `Sem ${s.semNumber}` : '';
                            const groupLabel = semKey ? `${bKey} • ${semKey}` : bKey;
                            if (!groups[groupLabel]) groups[groupLabel] = [];
                            groups[groupLabel].push(s);
                          });

                          return Object.entries(groups).map(([groupLabel, subs]) => (
                            <div key={groupLabel} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)', marginTop: '0.25rem' }}>
                                {groupLabel}
                              </div>
                              {subs.map(s => {
                                const isSelected = form.subjectId === s.id;
                                return (
                                  <button
                                    key={s.id}
                                    type="button"
                                    className="btn btn-outline btn-block"
                                    style={{
                                      textAlign: 'left',
                                      justifyContent: 'flex-start',
                                      fontWeight: 500,
                                      fontSize: '0.85rem',
                                      padding: '0.5rem 0.75rem',
                                      background: isSelected ? 'var(--accent-bg)' : 'var(--bg-glass)',
                                      borderColor: isSelected ? 'var(--accent)' : 'var(--border-glass)',
                                      color: isSelected ? 'var(--accent)' : 'var(--text-primary)',
                                      whiteSpace: 'normal',
                                      wordBreak: 'break-word'
                                    }}
                                    onClick={() => {
                                      setForm(prev => ({ ...prev, subjectId: s.id }));
                                      setShowSubjectModal(false);
                                    }}
                                  >
                                    {s.name}{s.type === 'lab' ? ' (Lab)' : ''}
                                  </button>
                                );
                              })}
                            </div>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            </div>
          ) : null}

          {(!showSubjectDropdown || form.subjectId === 'none') && (
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label">Custom Subject / Category Label (Optional)</label>
              <input 
                className="form-input" 
                name="categoryHeading" 
                value={form.categoryHeading} 
                onChange={handleChange} 
                placeholder="e.g. General, Announcement, Extra Material" 
              />
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button className="btn btn-outline" onClick={() => setStep(0)}>← Back</button>
            <button className="btn btn-primary" style={{ flex: 1 }}
              disabled={
                !(Array.isArray(form.targetBranch) ? form.targetBranch.length > 0 : !!form.targetBranch) || 
                (!(Array.isArray(form.targetYear) ? form.targetYear.length > 0 : !!form.targetYear) && !(Array.isArray(form.targetSemester) ? form.targetSemester.length > 0 : !!form.targetSemester)) || 
                !(Array.isArray(form.targetSemester) ? form.targetSemester.length > 0 : !!form.targetSemester) || 
                !(Array.isArray(form.targetSection) ? form.targetSection.length > 0 : !!form.targetSection) || 
                !form.subjectId || 
                (form.subjectId === 'none' && form.subjectType !== 'tweet' && !form.categoryHeading.trim())
              }
              onClick={() => setStep(2)}>Next: Details →</button>
          </div>
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && (
        <div className="card" style={{ maxWidth: '600px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>Resource Details</h3>
          <div className="form-group">
            <label className="form-label">{form.subjectType === 'tweet' ? 'Title (Optional)' : 'Title'}</label>
            <input className="form-input" name="title" value={form.title} onChange={handleChange} placeholder="e.g., DBMS Chapter 1 Notes" required={form.subjectType !== 'tweet'} />
          </div>
          {form.subjectType !== 'tweet' && (
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Resource Type</label>
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className="form-input"
                    style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                    onClick={() => setShowTypeDropdown(!showTypeDropdown)}
                  >
                    {form.type}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                  </button>
                  
                  {showTypeDropdown && (
                    <div style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: 0,
                      right: 0,
                      marginBottom: '0.25rem',
                      background: 'var(--bg-glass-strong)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid var(--border-glass)',
                      borderRadius: 'var(--radius-md)',
                      maxHeight: '110px',
                      overflowY: 'auto',
                      zIndex: 1000,
                      boxShadow: 'var(--shadow-lg)'
                    }}>
                      {['PDF', 'Notes', 'Assignment', 'Notice', 'Project', 'Timetable', 'Syllabus', 'Link', 'Case Study', 'Video', 'Image', 'Other'].map(t => (
                        <button
                          key={t}
                          type="button"
                          style={{
                            display: 'block',
                            width: '100%',
                            textAlign: 'left',
                            padding: '0.75rem 1rem',
                            background: form.type === t ? 'var(--accent-bg)' : 'transparent',
                            color: form.type === t ? 'var(--accent)' : 'var(--text-primary)',
                            borderBottom: '1px solid var(--border-glass)',
                            fontSize: '0.9rem',
                            fontWeight: form.type === t ? 600 : 400
                          }}
                          onClick={() => {
                            setForm(prev => ({ ...prev, type: t }));
                            setShowTypeDropdown(false);
                          }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Category Heading (optional)</label>
                <input className="form-input" name="categoryHeading" value={form.categoryHeading} onChange={handleChange} placeholder="e.g., Midterm Prep" />
              </div>
            </div>
          )}
          {(form.type === 'Assignment' || form.type === 'Project') && (
            <div className="grid grid-2">
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input className="form-input" type="date" name="startDate" value={form.startDate} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Deadline</label>
                <input className="form-input" type="date" name="endDate" value={form.endDate} onChange={handleChange} />
              </div>
            </div>
          )}
          {(form.type === 'Notice' || form.type === 'Tweet') && (
            <div className="form-group">
              <label className="form-label">Auto-Expiration Date</label>
              <input className="form-input" type="date" name="expirationDate" value={form.expirationDate} onChange={handleChange} />
            </div>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button className="btn btn-outline" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn-primary" style={{ flex: 1 }} disabled={form.subjectType !== 'tweet' && !form.title} onClick={() => {
              if (form.subjectType === 'tweet' && !form.title) {
                setForm(prev => ({ ...prev, title: 'Announcement' }));
              }
              setStep(3);
            }}>Review →</button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="card" style={{ maxWidth: '600px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '1rem' }}>📋 Review Before Publishing</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {[
              ['File', file?.name || form.linkUrl || '—'],
              ['Title', form.title],
              ['Type', form.type],
              ['Branch(es)', Array.isArray(form.targetBranch) 
                ? form.targetBranch.map(id => branches.find(b => b.id === id)?.name || id.replace('br_', '').toUpperCase()).join(', ') 
                : selectedBranch?.name],
              ['Year(s)', Array.isArray(form.targetYear) 
                ? form.targetYear.map(y => `${y} Year`).join(', ') 
                : form.targetYear ? `${form.targetYear} Year` : '—'],
              ['Semester(s)', Array.isArray(form.targetSemester) 
                ? form.targetSemester.map(s => `Sem ${s}`).join(', ') 
                : form.targetSemester ? `Sem ${form.targetSemester}` : '—'],
              ['Section(s)', Array.isArray(form.targetSection) 
                ? form.targetSection.map(s => s === 'ALL' ? 'All Sections' : `Section ${s}`).join(', ') 
                : (form.targetSection === 'ALL' ? 'All Sections' : `Section ${form.targetSection}`)],
              ['Subject Type', form.subjectType || 'Any'],
              ['Subject', form.subjectId === 'none' ? 'No Subject / General' : filteredSubjects.find(s => s.id === form.subjectId)?.name || '—'],
              ['Deadline', form.endDate || '—'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--border-glass)' }}>
                <span className="text-sm text-muted">{k}</span>
                <span className="text-sm" style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-outline" onClick={() => setStep(2)}>← Edit</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSubmit} disabled={loading}>
              {loading ? 'Publishing...' : '✓ Confirm & Publish'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacultyUpload;
