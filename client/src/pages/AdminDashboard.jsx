import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import UploadForm from '../components/Admin/UploadForm';
import CategoryManager from '../components/Admin/CategoryManager';
import RecycleBin from '../components/Admin/RecycleBin';
import ResourceCard from '../components/Student/ResourceCard';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const navigate = useNavigate();

  useEffect(() => {
    // Basic auth check
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/admin/login');
    } else {
      // Removed announcements fetch for Admin Faculty dashboard
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const handleStudentViewToggle = () => {
    // Open student view in a new tab to preserve dashboard state
    window.open('/', '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      
      {/* Dashboard Header */}
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.875rem' }}>Manage Smart Sync ecosystem</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={handleStudentViewToggle}
            style={{ padding: '0.5rem 1rem', border: '1px solid var(--accent-color)', color: 'var(--accent-color)', borderRadius: 'var(--radius-lg)', fontWeight: 500 }}
          >
            Preview Student View
          </button>
          <button 
            onClick={handleLogout}
            style={{ padding: '0.5rem 1rem', backgroundColor: '#fee2e2', color: '#b91c1c', border: 'none', borderRadius: 'var(--radius-lg)', fontWeight: 500 }}
          >
            Logout
          </button>
        </div>
      </div>



      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        {['overview', 'upload', 'categories', 'recycle-bin'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '0.5rem 1rem',
              borderBottom: activeTab === tab ? '2px solid var(--accent-color)' : '2px solid transparent',
              color: activeTab === tab ? 'var(--accent-color)' : 'var(--text-secondary)',
              fontWeight: activeTab === tab ? 600 : 400,
              textTransform: 'capitalize',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.replace('-', ' ')}
          </button>
        ))}
      </div>

      {/* Tab Content Area */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="grid-container" style={{ padding: 0 }}>
            <div className="card" style={{ borderLeft: '4px solid var(--color-cse)' }}>
              <h3>Total Groups</h3>
              <p style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0 0 0' }}>12</p>
            </div>
            <div className="card" style={{ borderLeft: '4px solid var(--color-ds)' }}>
              <h3>Total Resources</h3>
              <p style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0 0 0' }}>145</p>
            </div>
            <div className="card" style={{ borderLeft: '4px solid var(--color-civil)' }}>
              <h3>Active Notices</h3>
              <p style={{ fontSize: '2rem', fontWeight: 700, margin: '0.5rem 0 0 0' }}>8</p>
            </div>
          </div>
        )}

        {activeTab === 'upload' && <UploadForm />}
        {activeTab === 'categories' && <CategoryManager />}
        {activeTab === 'recycle-bin' && <RecycleBin />}
      </div>

    </div>
  );
};

export default AdminDashboard;
