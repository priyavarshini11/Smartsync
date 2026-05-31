import React, { useState, useEffect } from 'react';

const GoToTop = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
      setVisible(scrolled > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <button 
      onClick={scrollToTop}
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '20px',
        width: '44px',
        height: '44px',
        borderRadius: '50%',
        background: 'var(--accent)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-lg)',
        zIndex: 1000,
        cursor: 'pointer',
        border: 'none',
        transition: 'all 0.3s ease',
        opacity: 0.9
      }}
      title="Go to Top"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7"/>
      </svg>
    </button>
  );
};

export default GoToTop;
