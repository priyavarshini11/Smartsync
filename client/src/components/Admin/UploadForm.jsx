import React, { useState, useRef } from 'react';

const UploadForm = () => {
  const fileInputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    department: '',
    year: '',
    semester: '',
    subject: '',
    customSubject: '',
    type: 'PDF',
    customHeading: '',
    startDate: '',
    endDate: '',
    expirationDate: '',
    notify: false
  });

  const handleFileClick = () => {
    // Triggers native file picker
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file to upload.');
      return;
    }
    
    // In a real scenario, this would construct a FormData object and POST to /api/upload
    console.log('Publishing:', { file: file.name, ...formData });
    alert('Resource Published Successfully!');
    
    // Reset
    setFile(null);
    setFormData({ ...formData, customHeading: '', startDate: '', endDate: '', expirationDate: '', notify: false });
  };

  const inputStyle = {
    width: '100%', padding: '0.75rem', borderRadius: 'var(--radius-lg)', 
    border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-primary)', 
    color: 'var(--text-primary)', marginBottom: '1rem'
  };

  return (
    <div className="card" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '8rem' }}>
      <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Upload Resource</h3>
      
      <form onSubmit={handleSubmit}>
        
        {/* 1. Native File Picker Area */}
        <div 
          onClick={handleFileClick}
          style={{
            border: '2px dashed var(--accent-color)', borderRadius: 'var(--radius-lg)',
            padding: '3rem 1rem', textAlign: 'center', cursor: 'pointer',
            backgroundColor: file ? 'var(--color-cse)' : 'transparent',
            marginBottom: '2rem', transition: 'background-color 0.3s'
          }}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            style={{ display: 'none' }} 
          />
          {file ? (
            <div>
              <p style={{ fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{file.name}</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <div>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--accent-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '1rem' }}>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <p style={{ margin: 0, fontWeight: 500 }}>Click to open native file picker</p>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0 }}>Supports PDFs, Images, Docs</p>
            </div>
          )}
        </div>

        {/* 2. Categorization Hierarchy */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Department</label>
            <select name="department" value={formData.department} onChange={handleChange} style={inputStyle} required>
              <option value="">Select Dept</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="AI">AI & ML</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Year</label>
            <select name="year" value={formData.year} onChange={handleChange} style={inputStyle} required>
              <option value="">Select Year</option>
              <option value="1">First Year</option>
              <option value="2">Second Year</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Semester</label>
            <select name="semester" value={formData.semester} onChange={handleChange} style={inputStyle} required>
              <option value="">Select Sem</option>
              <option value="1">First Sem</option>
              <option value="2">Second Sem</option>
            </select>
          </div>
        </div>

        {/* 3. Subject & Type */}
        <div className="grid grid-2">
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Subject (Select or Type New)</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <select name="subject" value={formData.subject} onChange={handleChange} style={{...inputStyle, flex: 1}}>
                <option value="">Existing Subjects...</option>
                <option value="DBMS">DBMS</option>
              </select>
              <input type="text" name="customSubject" value={formData.customSubject} onChange={handleChange} placeholder="Or type new..." style={{...inputStyle, flex: 1}} />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Resource Type</label>
            <select name="type" value={formData.type} onChange={handleChange} style={inputStyle}>
              <option value="PDF">PDF Document</option>
              <option value="Notice">Notice / Alert</option>
              <option value="Assignment">Assignment</option>
              <option value="Project">Project</option>
            </select>
          </div>
        </div>

        {/* 4. Advanced Options */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
          <h4 style={{ marginBottom: '1rem' }}>Advanced Options</h4>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Custom Category Heading (Optional)</label>
            <input type="text" name="customHeading" value={formData.customHeading} onChange={handleChange} placeholder="e.g., 'Midterm Prep Materials'" style={inputStyle} />
          </div>

          {(formData.type === 'Assignment' || formData.type === 'Project') && (
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Start Date</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Deadline</label>
                <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} style={inputStyle} />
              </div>
            </div>
          )}

          {formData.type === 'Notice' && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>Auto-Expiration Date</label>
              <input type="date" name="expirationDate" value={formData.expirationDate} onChange={handleChange} style={inputStyle} />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '-0.5rem' }}>Notice will be moved to Archive after this date.</p>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--color-cse)', borderRadius: 'var(--radius-lg)' }}>
            <input type="checkbox" id="notify" name="notify" checked={formData.notify} onChange={handleChange} style={{ width: '1.2rem', height: '1.2rem' }} />
            <label htmlFor="notify" style={{ fontWeight: 500, color: '#0c4a6e', cursor: 'pointer' }}>Trigger Web Push Notification to Students</label>
          </div>
        </div>

        <button type="submit" style={{ width: '100%', padding: '1rem', backgroundColor: 'var(--accent-color)', color: 'white', borderRadius: 'var(--radius-lg)', fontWeight: 600, fontSize: '1rem' }}>
          Publish Resource
        </button>
      </form>
    </div>
  );
};

export default UploadForm;
