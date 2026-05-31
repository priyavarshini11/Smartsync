import React, { useEffect, useState } from 'react';
import './SplashScreen.css';

const SplashScreen = ({ onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [fadeout, setFadeout] = useState(false);

  useEffect(() => {
    // Premium 5-second logo reveal animation timeline
    const timer = setTimeout(() => {
      setFadeout(true);
      setTimeout(() => {
        setIsVisible(false);
        if (onComplete) onComplete();
      }, 500); // 500ms fadeout
    }, 5000); // 5000ms duration

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  return (
    <div className={`splash-container ${fadeout ? 'fade-out' : ''}`}>
      <div className="splash-glow-bg"></div>
      <div className="splash-brand-wrapper">
        <div className="splash-logo-container">
          <div className="splash-light-trails"></div>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" className="splash-logo-svg">
            <defs>
              <linearGradient id="splashGrad1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#4F46E5" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
              <linearGradient id="splashGrad2" x1="1" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#06B6D4" />
                <stop offset="100%" stopColor="#3B82F6" />
              </linearGradient>
            </defs>
            <rect x="4" y="4" width="11" height="11" rx="3.5" fill="url(#splashGrad1)" fillOpacity="0.95" />
            <rect x="9" y="9" width="11" height="11" rx="3.5" fill="url(#splashGrad2)" fillOpacity="0.95" />
          </svg>
        </div>
        <div className="splash-text-container">
          <h1 className="splash-title">Smart Sync</h1>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
