import React, { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const BRANCH_COLORS = {
  br_cse: { bg: 'var(--color-cse)', label: 'CSE (Core)' },
  br_ece: { bg: 'var(--color-ece)', label: 'ECE' },
  br_aiml: { bg: 'var(--color-aiml)', label: 'AIML' },
  br_cyber: { bg: 'var(--color-cyber)', label: 'Cyber Security' },
  br_ds: { bg: 'var(--color-ds)', label: 'DS' },
  br_aids: { bg: 'var(--color-aids)', label: 'AIDS' },
  br_mech: { bg: 'var(--color-mech)', label: 'Mechanical' },
  br_civil: { bg: 'var(--color-civil)', label: 'Civil' },
};

const OnboardingPage = () => {
  const [step, setStep] = useState(0); // 0=branch, 1=year, 2=semester, 3=section
  const [branches, setBranches] = useState([]);
  const [selection, setSelection] = useState({ branch: '', year: '', semester: '', section: '', rollNo: '' });
  const [loading, setLoading] = useState(false);
  const { completeOnboarding } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/taxonomy').then(data => setBranches(data)).catch(() => {});
  }, []);

  const selectedBranch = branches.find(b => b.id === selection.branch);
  const selectedYear = selectedBranch?.years?.find(y => y.level === Number(selection.year));
  const selectedSem = selectedYear?.semesters?.find(s => s.number === Number(selection.semester));

  const steps = ['Branch', 'Year', 'Semester', 'Section'];

  const handleFinish = async () => {
    setLoading(true);
    try {
      await completeOnboarding(selection);
      navigate('/student');
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  const cardStyle = (isSelected) => ({
    cursor: 'pointer', padding: '1.25rem', display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', transition: 'all 0.2s ease',
    border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border-glass)',
    background: isSelected ? 'var(--accent-bg)' : 'var(--bg-glass)',
  });

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ maxWidth: '600px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem', animation: 'fadeSlideUp 0.3s ease-out' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Welcome to Smart Sync!</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Let's personalize your experience. Tell us about yourself.</p>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            {steps.map((s, i) => (
              <span key={s} style={{ fontSize: '0.75rem', fontWeight: i <= step ? 700 : 400, color: i <= step ? 'var(--accent)' : 'var(--text-muted)' }}>{s}</span>
            ))}
          </div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${((step + 1) / 4) * 100}%` }} />
          </div>
        </div>

        {/* Step 0: Branch */}
        {step === 0 && (
          <div className="grid grid-2 anim-stagger">
            {branches.map(b => (
              <div key={b.id} className="card" style={{ ...cardStyle(selection.branch === b.id), borderLeft: `4px solid ${BRANCH_COLORS[b.id]?.bg || 'var(--accent)'}` }}
                onClick={() => { setSelection({ ...selection, branch: b.id, year: '', semester: '', section: '' }); setStep(1); }}>
                <span style={{ fontWeight: 600 }}>{b.name}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            ))}
          </div>
        )}

        {/* Step 1: Year */}
        {step === 1 && selectedBranch && (
          <div className="grid grid-2 anim-stagger">
            {selectedBranch.years.map(y => (
              <div key={y.id} className="card" style={cardStyle(selection.year === String(y.level))}
                onClick={() => { setSelection({ ...selection, year: String(y.level), semester: '', section: '' }); setStep(2); }}>
                <span style={{ fontWeight: 600 }}>{y.name}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Semester */}
        {step === 2 && selectedYear && (
          <div className="grid grid-2 anim-stagger">
            {selectedYear.semesters.map(s => (
              <div key={s.id} className="card" style={cardStyle(selection.semester === String(s.number))}
                onClick={() => { setSelection({ ...selection, semester: String(s.number), section: '' }); setStep(3); }}>
                <span style={{ fontWeight: 600 }}>{s.name}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            ))}
          </div>
        )}

        {/* Step 3: Section and Roll No */}
        {step === 3 && selectedSem && (
          <div className="anim-stagger">
            <div className="grid grid-3" style={{ marginBottom: '1.5rem' }}>
              {selectedSem.sections.map(sec => (
                <div key={sec} className="card" style={{ ...cardStyle(selection.section === sec), textAlign: 'center', justifyContent: 'center' }}
                  onClick={() => setSelection({ ...selection, section: sec })}>
                  <span style={{ fontWeight: 700, fontSize: '1.25rem' }}>Section {sec}</span>
                </div>
              ))}
            </div>
            
            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
              <label className="form-label">Roll Number (Optional)</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter your Roll No"
                value={selection.rollNo}
                onChange={(e) => setSelection({ ...selection, rollNo: e.target.value })}
              />
            </div>

            {selection.section && (
              <button className="btn btn-primary btn-block" onClick={handleFinish} disabled={loading} style={{ padding: '1rem', fontSize: '1rem' }}>
                {loading ? 'Saving...' : 'Complete Setup →'}
              </button>
            )}
          </div>
        )}

        {/* Back Button */}
        {step > 0 && (
          <button className="btn btn-ghost" onClick={() => setStep(step - 1)} style={{ marginTop: '1rem' }}>
            ← Back to {steps[step - 1]}
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
