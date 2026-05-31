import React from 'react';
import { Link } from 'react-router-dom';

const Breadcrumbs = ({ pathData }) => {
  // pathData is an array of objects: [{ name: 'Home', link: '/' }, { name: 'CSE', link: '/department/cse' }, ...]
  
  return (
    <nav style={{ 
      display: 'flex', 
      alignItems: 'center', 
      padding: '0.75rem 1.5rem', 
      marginBottom: '2rem',
      backgroundColor: 'var(--bg-glass)',
      backdropFilter: 'blur(12px)',
      border: '1px solid var(--border-glass)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-glass)'
    }}>
      {pathData.map((crumb, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span style={{ margin: '0 0.5rem', color: 'var(--text-secondary)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </span>
          )}
          {index === pathData.length - 1 ? (
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{crumb.name}</span>
          ) : (
            <Link 
              to={crumb.link} 
              style={{ 
                color: 'var(--text-secondary)', 
                transition: 'color 0.2s ease',
                textDecoration: 'none'
              }}
              onMouseOver={(e) => e.target.style.color = 'var(--accent-color)'}
              onMouseOut={(e) => e.target.style.color = 'var(--text-secondary)'}
            >
              {crumb.name}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
