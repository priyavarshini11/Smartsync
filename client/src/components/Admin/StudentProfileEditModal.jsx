import React, { useState } from 'react';
import api from '../../utils/api';

const StudentProfileEditModal = ({ student, branches, loggedInUser, onClose, onSave }) => {
  const isHod = loggedInUser?.role === 'admin_faculty';
  const hodBranch = loggedInUser?.profile?.branch;

  const [form, setForm] = useState({
    branch: student.profile?.branch || (isHod ? hodBranch : ''),
    year: student.profile?.year ? String(student.profile.year) : '',
    semester: student.profile?.semester ? String(student.profile.semester) : '',
    section: student.profile?.section || '',
    rollNo: student.profile?.rollNo || ''
  });
  const [loading, setLoading] = useState(false);

  const selectedBranch = branches.find(b => b.id === form.branch);
  const selectedYear = selectedBranch?.years?.find(y => y.level === Number(form.year));
  const selectedSemester = selectedYear?.semesters?.find(s => s.number === Number(form.semester));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.branch || !form.year || !form.semester || !form.section) {
      alert("All fields are required.");
      return;
    }

    setLoading(true);
    try {
      await api.patch(`/admin/users/${student.id}/student-profile`, {
        branch: form.branch,
        year: Number(form.year),
        semester: Number(form.semester),
        section: form.section,
        rollNo: form.rollNo
      });
      onSave();
      onClose();
    } catch (err) {
      alert(err.message || 'Failed to update student profile');
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
      <div className="card" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', width: '100%', padding: '2rem', animation: 'fadeSlideUp 0.3s ease-out' }}>
        <h3 style={{ fontWeight: 800, marginBottom: '1rem', fontSize: '1.25rem' }}>
          Edit Student Onboarding Profile
        </h3>
        <p className="text-xs text-muted" style={{ marginBottom: '1.5rem' }}>
          User: <strong>{student.username || student.email}</strong> ({student.email})
        </p>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label text-xs">Branch</label>
            <select
              className="form-select"
              value={form.branch}
              onChange={e => setForm({ ...form, branch: e.target.value, year: '', semester: '', section: '' })}
              disabled={isHod} // HODs cannot change a student's branch to something else
            >
              <option value="">Select Branch</option>
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label text-xs">Year</label>
            <select
              className="form-select"
              value={form.year}
              onChange={e => setForm({ ...form, year: e.target.value, semester: '', section: '' })}
              disabled={!form.branch}
            >
              <option value="">Select Year</option>
              {selectedBranch?.years?.map(y => (
                <option key={y.level} value={y.level}>{y.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label text-xs">Semester</label>
            <select
              className="form-select"
              value={form.semester}
              onChange={e => setForm({ ...form, semester: e.target.value, section: '' })}
              disabled={!form.year}
            >
              <option value="">Select Semester</option>
              {selectedYear?.semesters?.map(s => (
                <option key={s.number} value={s.number}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label text-xs">Section</label>
            <select
              className="form-select"
              value={form.section}
              onChange={e => setForm({ ...form, section: e.target.value })}
              disabled={!form.semester}
            >
              <option value="">Select Section</option>
              {selectedSemester?.sections?.map(sec => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label text-xs">Roll Number</label>
            <input
              type="text"
              className="form-input"
              value={form.rollNo}
              onChange={e => setForm({ ...form, rollNo: e.target.value })}
              placeholder="Enter Roll No"
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentProfileEditModal;
