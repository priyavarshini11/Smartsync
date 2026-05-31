import React, { useState, useEffect, useContext } from 'react';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';

const ResourceEditModal = ({ resource, onClose, onSave }) => {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({
    title: resource.title || '',
    type: resource.type || '',
    targetBranch: resource.targetBranch || '',
    targetYear: resource.targetYear || '',
    targetSemester: resource.targetSemester || '',
    targetSection: resource.targetSection || ''
  });
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);

  const isStrictBranch = user?.role === 'faculty' || user?.role === 'admin_faculty';
  const assignments = isStrictBranch ? user?.profile?.assignments || [] : [];
  const legacyBranch = isStrictBranch && assignments.length === 0 ? user?.profile?.branch : null;

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
  }, [user]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const selectedBranch = branches.find(b => b.id === form.targetBranch);
  
  let availableYears = selectedBranch?.years || [];
  if (assignments.length > 0 && form.targetBranch) {
    const branchAssignments = assignments.filter(a => a.branch === form.targetBranch);
    const assignedYears = [...new Set(branchAssignments.map(a => Number(a.year)))];
    if (assignedYears.length > 0 && !assignedYears.includes(NaN)) {
      availableYears = availableYears.filter(y => assignedYears.includes(y.level));
    }
  }
  const selectedYear = availableYears.find(y => y.level === Number(form.targetYear));

  let availableSemesters = selectedYear?.semesters || [];
  if (assignments.length > 0 && form.targetBranch && form.targetYear) {
    const branchYearAssignments = assignments.filter(a => a.branch === form.targetBranch && Number(a.year) === Number(form.targetYear));
    const assignedSems = [...new Set(branchYearAssignments.map(a => Number(a.semester)))];
    if (assignedSems.length > 0 && !assignedSems.includes(NaN)) {
      availableSemesters = availableSemesters.filter(s => assignedSems.includes(s.number));
    }
  }
  const selectedSem = availableSemesters.find(s => s.number === Number(form.targetSemester));

  let availableSections = selectedSem?.sections || [];
  let isAllSectionsAllowed = true;
  if (assignments.length > 0 && form.targetBranch && form.targetYear && form.targetSemester) {
    const currentAssignments = assignments.filter(a => 
      a.branch === form.targetBranch && 
      Number(a.year) === Number(form.targetYear) && 
      Number(a.semester) === Number(form.targetSemester)
    );
    const assignedSecs = [...new Set(currentAssignments.map(a => a.section))];
    if (assignedSecs.length > 0 && !assignedSecs.includes('ALL')) {
      availableSections = availableSections.filter(s => assignedSecs.includes(s));
      isAllSectionsAllowed = false;
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.patch(`/resources/${resource.id}`, form);
      onSave();
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(15, 23, 42, 0.8)',
      backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: '1rem'
    }}>
      <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '2rem', animation: 'fadeSlideUp 0.3s ease-out' }}>
        <h3 style={{ fontWeight: 800, marginBottom: '1.5rem', fontSize: '1.25rem' }}>Edit Resource</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Title</label>
            <input 
              className="form-input" 
              name="title" 
              value={form.title} 
              onChange={handleChange} 
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">Resource Type</label>
            <select className="form-select" name="type" value={form.type} onChange={handleChange} required>
              {['PDF', 'Notes', 'Case Study', 'Timetable', 'Notice', 'Image', 'Video', 'Link', 'Assignment', 'Project', 'Other'].map(t =>
                <option key={t} value={t}>{t}</option>
              )}
            </select>
          </div>

          <div className="grid grid-2" style={{ gap: '0.75rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label text-xs">Branch</label>
              <select className="form-select" name="targetBranch" value={form.targetBranch} onChange={handleChange} required disabled={!!legacyBranch && assignments.length === 0}>
                <option value="">Select...</option>
                {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label text-xs">Year</label>
              <select className="form-select" name="targetYear" value={form.targetYear} onChange={handleChange} required>
                <option value="">Select...</option>
                {availableYears.map(y => <option key={y.id || y.level} value={y.level}>{y.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label text-xs">Semester</label>
              <select className="form-select" name="targetSemester" value={form.targetSemester} onChange={handleChange} required>
                <option value="">Select...</option>
                {availableSemesters.map(s => <option key={s.id || s.number} value={s.number}>{s.name}</option>)}
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label text-xs">Section</label>
              <select className="form-select" name="targetSection" value={form.targetSection} onChange={handleChange} required>
                <option value="">Select...</option>
                {isAllSectionsAllowed && <option value="ALL">ALL Sections</option>}
                {availableSections.map(s => <option key={s} value={s}>Section {s}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourceEditModal;
