import React, { useState } from 'react';
import api from '../../utils/api';

const FacultyAssignmentsModal = ({ user, branches, onClose, onSave }) => {
  const [assignments, setAssignments] = useState(user.profile?.assignments || []);
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    branch: branches.length === 1 ? branches[0].id : '',
    year: '',
    semester: '',
    section: 'ALL',
    subjectId: ''
  });

  const [subjectDropdownOpen, setSubjectDropdownOpen] = useState(false);
  const subjectDropdownRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(e.target)) {
        setSubjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedBranch = branches.find(b => b.id === form.branch);
  const selectedYear = selectedBranch?.years?.find(y => y.level === Number(form.year));
  const selectedSemester = selectedYear?.semesters?.find(s => s.number === Number(form.semester));

  const handleAdd = () => {
    if (!form.branch || !form.year || !form.semester || !form.section) return;
    
    // Check for duplicates
    const isDuplicate = assignments.some(a => 
      a.branch === form.branch && 
      Number(a.year) === Number(form.year) && 
      Number(a.semester) === Number(form.semester) && 
      a.section === form.section &&
      a.subjectId === form.subjectId
    );

    if (isDuplicate) {
      alert("This assignment already exists.");
      return;
    }

    setAssignments([...assignments, {
      branch: form.branch,
      year: Number(form.year),
      semester: Number(form.semester),
      section: form.section,
      subjectId: form.subjectId
    }]);

    setForm({ branch: '', year: '', semester: '', section: 'ALL', subjectId: '' });
  };

  const handleRemove = (index) => {
    setAssignments(assignments.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    let finalAssignments = [...assignments];
    
    // Auto-add pending assignment if the form is fully filled out
    if (form.branch && form.year && form.semester && form.section) {
      const isDuplicate = assignments.some(a => 
        a.branch === form.branch && 
        Number(a.year) === Number(form.year) && 
        Number(a.semester) === Number(form.semester) && 
        a.section === form.section &&
        a.subjectId === form.subjectId
      );
      if (!isDuplicate) {
        finalAssignments.push({
          branch: form.branch,
          year: Number(form.year),
          semester: Number(form.semester),
          section: form.section,
          subjectId: form.subjectId
        });
      }
    } else if (form.branch || form.year || form.semester) {
      // Form is partially filled, warn them
      if (!window.confirm("You have partially filled out a new assignment but didn't finish adding it. Do you want to save anyway and ignore the incomplete assignment?")) {
        return;
      }
    }

    setLoading(true);
    try {
      await api.patch(`/admin/users/${user.id}/assignments`, { assignments: finalAssignments });
      onSave(); // Refreshes users list
      onClose();
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '1rem'
    }}>
      <div className="card" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '100%', padding: '2rem', animation: 'fadeSlideUp 0.3s ease-out', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ fontWeight: 800, marginBottom: '1.5rem', fontSize: '1.25rem' }}>
          Manage Assignments: {user.username}
        </h3>
        
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Current Assignments</h4>
          {assignments.length === 0 ? (
            <p className="text-muted text-sm">No specific assignments. (Faculty may be restricted.)</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {assignments.map((a, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)' }}>
                  <span className="text-sm">
                    <strong>Branch:</strong> {branches.find(b => b.id === a.branch)?.shortName || a.branch} | 
                    <strong> Year:</strong> {a.year} | 
                    <strong> Sem:</strong> {a.semester} | 
                    <strong> Section:</strong> {a.section}
                    {a.subjectId && (
                      <span> | <strong>Subject:</strong> {(() => {
                        const sub = branches.find(b => b.id === a.branch)?.years?.find(y => y.level === Number(a.year))?.semesters?.find(s => s.number === Number(a.semester))?.subjects?.find(sub => sub.id === a.subjectId);
                        return sub ? `${sub.name}${sub.type === 'lab' ? ' (Lab)' : ''}` : 'Unknown';
                      })()}</span>
                    )}
                  </span>
                  <button className="btn btn-sm btn-ghost" style={{ color: 'var(--danger)', padding: '0.25rem' }} onClick={() => handleRemove(i)}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', marginBottom: '1.5rem' }}>
          <h4 style={{ fontWeight: 600, marginBottom: '1rem' }}>Add New Assignment</h4>
          <div className="grid grid-2" style={{ gap: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label text-xs">Branch</label>
              <select className="form-select" value={form.branch} onChange={e => setForm({...form, branch: e.target.value, year: '', semester: '', section: 'ALL'})}>
                <option value="">Select Branch</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label text-xs">Year</label>
              <select className="form-select" value={form.year} onChange={e => setForm({...form, year: e.target.value, semester: '', section: 'ALL'})} disabled={!form.branch}>
                <option value="">Select Year</option>
                {selectedBranch?.years?.map(y => <option key={y.level} value={y.level}>{y.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label text-xs">Semester</label>
              <select className="form-select" value={form.semester} onChange={e => setForm({...form, semester: e.target.value, section: 'ALL'})} disabled={!form.year}>
                <option value="">Select Semester</option>
                {selectedYear?.semesters?.map(s => <option key={s.number} value={s.number}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label text-xs">Section</label>
              <select className="form-select" value={form.section} onChange={e => setForm({...form, section: e.target.value})} disabled={!form.semester}>
                <option value="ALL">ALL Sections</option>
                {selectedSemester?.sections?.map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0, gridColumn: 'span 2', position: 'relative', zIndex: 100 }} ref={subjectDropdownRef}>
              <label className="form-label text-xs">Subject</label>
              <div 
                className={`form-select ${!form.semester ? 'disabled' : ''}`}
                style={{ 
                  cursor: form.semester ? 'pointer' : 'not-allowed', 
                  opacity: form.semester ? 1 : 0.6,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  height: '38px', backgroundColor: 'var(--bg-input)'
                }}
                onClick={() => {
                  if (form.semester) setSubjectDropdownOpen(!subjectDropdownOpen);
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 'calc(100% - 20px)' }}>
                  {form.subjectId 
                    ? (() => {
                        const s = selectedSemester?.subjects?.find(sub => sub.id === form.subjectId);
                        return s ? `${s.name}${s.type === 'lab' ? ' (Lab)' : ''}` : 'Select Subject (Optional)';
                      })()
                    : 'Select Subject (Optional)'}
                </span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: subjectDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </div>

              {subjectDropdownOpen && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '4px',
                  backgroundColor: '#1a1f36', border: '1px solid var(--border-glass)',
                  borderRadius: 'var(--radius-md)', boxShadow: '0 4px 20px rgba(0,0,0,0.8)',
                  maxHeight: '220px', overflowY: 'auto', zIndex: 1000
                }}>
                  <div 
                    style={{ 
                      padding: '0.6rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-glass)',
                      backgroundColor: !form.subjectId ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                      wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: '1.4', fontSize: '0.875rem'
                    }}
                    onClick={() => { setForm({...form, subjectId: ''}); setSubjectDropdownOpen(false); }}
                  >
                    Select Subject (Optional)
                  </div>
                  {selectedSemester?.subjects?.map(s => (
                    <div 
                      key={s.id}
                      style={{ 
                        padding: '0.6rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border-glass)',
                        backgroundColor: form.subjectId === s.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                        wordBreak: 'break-word', whiteSpace: 'normal', lineHeight: '1.4', fontSize: '0.875rem'
                      }}
                      onClick={() => { setForm({...form, subjectId: s.id}); setSubjectDropdownOpen(false); }}
                    >
                      {s.name}{s.type === 'lab' ? ' (Lab)' : ''}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button className="btn btn-outline btn-sm" style={{ marginTop: '1rem', width: '100%' }} onClick={handleAdd} disabled={!form.branch || !form.year || !form.semester || !form.section}>
            + Add Assignment
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave} disabled={loading}>
            {loading ? 'Saving...' : 'Save All Assignments'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FacultyAssignmentsModal;
