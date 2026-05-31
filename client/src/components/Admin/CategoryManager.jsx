import React, { useState } from 'react';

const CategoryManager = () => {
  // Placeholder state to represent the database
  const [departments, setDepartments] = useState([
    { id: 1, name: 'Cyber Security', colorHex: '#f1f5f9' },
    { id: 2, name: 'CSE', colorHex: '#e0f2fe' },
    { id: 3, name: 'ECE', colorHex: '#ffedd5' }
  ]);

  const [newDept, setNewDept] = useState({ name: '', colorHex: '#e0f2fe' });

  const handleAddDept = (e) => {
    e.preventDefault();
    if (!newDept.name) return;
    setDepartments([...departments, { id: Date.now(), ...newDept }]);
    setNewDept({ name: '', colorHex: '#e0f2fe' });
  };

  const handleDelete = (id) => {
    if(window.confirm('WARNING: Deleting a department will cascade and delete all Years, Semesters, Subjects, and Resources inside it. Proceed?')) {
      setDepartments(departments.filter(d => d.id !== id));
    }
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Add New Department</h3>
        <form onSubmit={handleAddDept} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
          <div style={{ flex: 2 }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Department Name</label>
            <input 
              type="text" 
              value={newDept.name} 
              onChange={e => setNewDept({...newDept, name: e.target.value})} 
              placeholder="e.g., Data Science" 
              style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Pastel Color Theme</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <input 
                type="color" 
                value={newDept.colorHex} 
                onChange={e => setNewDept({...newDept, colorHex: e.target.value})} 
                style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{newDept.colorHex}</span>
            </div>
          </div>
          <button type="submit" style={{ padding: '0.75rem 1.5rem', backgroundColor: 'var(--accent-color)', color: 'white', borderRadius: 'var(--radius-lg)', fontWeight: 600 }}>
            Add
          </button>
        </form>
      </div>

      <h3 style={{ marginBottom: '1rem' }}>Current Departments</h3>
      <div className="grid-container" style={{ padding: 0 }}>
        {departments.map(dept => (
          <div key={dept.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: `4px solid ${dept.colorHex}` }}>
            <div>
              <h4 style={{ margin: 0 }}>{dept.name}</h4>
              <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Hex: {dept.colorHex}</p>
            </div>
            <button 
              onClick={() => handleDelete(dept.id)}
              style={{ padding: '0.5rem', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: 'var(--radius-lg)' }}
              title="Delete Structure"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryManager;
