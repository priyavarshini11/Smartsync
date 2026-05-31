import React, { useState } from 'react';
import Breadcrumbs from '../components/Student/Breadcrumbs';
import ResourceCard from '../components/Student/ResourceCard';

const StudentFlow = () => {
  // Placeholder mock data simulating hierarchical drill-down
  const [currentLevel, setCurrentLevel] = useState('department'); // department -> year -> semester -> subject -> resource
  const [path, setPath] = useState([{ name: 'Home', link: '/' }]);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const departments = [
    { id: 1, name: 'Computer Science (CSE)', colorHex: 'var(--color-cse)' },
    { id: 2, name: 'Electronics (ECE)', colorHex: 'var(--color-ece)' },
    { id: 3, name: 'Data Science (DS)', colorHex: 'var(--color-ds)' }
  ];

  const years = [
    { id: 1, name: 'First Year' }, { id: 2, name: 'Second Year' },
    { id: 3, name: 'Third Year' }, { id: 4, name: 'Fourth Year' }
  ];

  const semesters = [{ id: 1, name: 'Semester 1' }, { id: 2, name: 'Semester 2' }];
  
  const subjects = [{ id: 1, name: 'Data Structures' }, { id: 2, name: 'Database Management' }];

  const resources = [
    { id: 101, title: 'DBMS Full Notes Chapter 1-3', type: 'PDF', dateAdded: '2023-10-20' },
    { id: 102, title: 'Lab Assignment 4', type: 'Assignment', dateAdded: '2023-10-21', deadline: '2023-10-30', urgency: 'High' },
    { id: 103, title: 'Exam Reschedule Notice', type: 'Notice', dateAdded: '2023-10-22' }
  ];

  const handleDrillDown = (level, item) => {
    setCurrentLevel(level);
    setPath([...path, { name: item.name, link: '#' }]);
  };

  const handleBreadcrumbClick = () => {
    // Basic reset for demo purposes
    setCurrentLevel('department');
    setPath([{ name: 'Home', link: '/' }]);
  };

  return (
    <div>
      <div onClick={handleBreadcrumbClick}>
        <Breadcrumbs pathData={path} />
      </div>

      {currentLevel === 'resource' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <input 
              type="checkbox" 
              checked={showUnreadOnly} 
              onChange={(e) => setShowUnreadOnly(e.target.checked)} 
              style={{ width: '1rem', height: '1rem' }}
            />
            Show Unread Only
          </label>
        </div>
      )}

      <div className="grid-container" style={{ padding: 0 }}>
        
        {/* LEVEL 1: Departments */}
        {currentLevel === 'department' && departments.map(dept => (
          <div 
            key={dept.id} 
            className="card" 
            onClick={() => handleDrillDown('year', dept)}
            style={{ borderLeft: `4px solid ${dept.colorHex}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{dept.name}</h3>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}

        {/* LEVEL 2: Years */}
        {currentLevel === 'year' && years.map(year => (
          <div 
            key={year.id} 
            className="card" 
            onClick={() => handleDrillDown('semester', year)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{year.name}</h3>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}

        {/* LEVEL 3: Semesters */}
        {currentLevel === 'semester' && semesters.map(sem => (
          <div 
            key={sem.id} 
            className="card" 
            onClick={() => handleDrillDown('subject', sem)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{sem.name}</h3>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}

        {/* LEVEL 4: Subjects */}
        {currentLevel === 'subject' && subjects.map(sub => (
          <div 
            key={sub.id} 
            className="card" 
            onClick={() => handleDrillDown('resource', sub)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>{sub.name}</h3>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        ))}

        {/* LEVEL 5: Resources */}
        {currentLevel === 'resource' && resources.map(res => {
          // Simple client-side filtering for demo
          if (showUnreadOnly) {
            const opened = JSON.parse(localStorage.getItem('opened_resources') || '[]');
            if (opened.includes(res.id)) return null;
          }
          return <ResourceCard key={res.id} resource={res} departmentColor="var(--color-cse)" />;
        })}

      </div>
    </div>
  );
};

export default StudentFlow;
