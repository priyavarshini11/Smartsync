import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import ResourceCard from '../components/Student/ResourceCard';
import SearchBar from '../components/UI/SearchBar';
import EditNameButton from '../components/UI/EditNameButton';

const StudentDashboard = () => {
  const { user, refreshUser } = useContext(AuthContext);
  const [resources, setResources] = useState([]);
  const [taxonomy, setTaxonomy] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const filter = searchParams.get('filter') || 'ALL';
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const [rollNoInput, setRollNoInput] = useState('');
  const [savingRollNo, setSavingRollNo] = useState(false);

  const handleSaveRollNo = async () => {
    if (!rollNoInput.trim()) return;
    setSavingRollNo(true);
    try {
      await api.patch('/auth/student-rollno', { rollNo: rollNoInput });
      await refreshUser();
    } catch (err) {
      alert(err.message || 'Failed to save Roll No');
    }
    setSavingRollNo(false);
  };

  const p = user?.profile;
  const filters = ['ALL', 'PDF', 'Notes', 'Assignment', 'Notice', 'Project', 'Timetable', 'Syllabus', 'Link', 'Case Study', 'Video', 'Image'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resData, taxData] = await Promise.all([
          api.get('/resources' + (filter !== 'ALL' ? `?type=${filter}` : '')),
          api.get('/taxonomy')
        ]);
        setResources(resData);
        setTaxonomy(taxData || []);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, [filter]);

  const branchColors = {
    br_cse: 'var(--color-cse)', br_ece: 'var(--color-ece)', br_aiml: 'var(--color-aiml)',
    br_cyber: 'var(--color-cyber)', br_ds: 'var(--color-ds)', br_aids: 'var(--color-aids)',
    br_mech: 'var(--color-mech)', br_civil: 'var(--color-civil)',
  };

  const branchLabels = {
    br_cse: 'CSE', br_ece: 'ECE', br_aiml: 'AIML', br_cyber: 'Cyber Security',
    br_ds: 'Data Science', br_aids: 'AIDS', br_mech: 'Mechanical', br_civil: 'Civil',
  };

  // Build subject map for the student's branch/year/sem
  let subjectsMap = {};
  if (p) {
    const branch = taxonomy.find(b => b.id === p.branch);
    if (branch) {
      const year = branch.years?.find(y => y.level === p.year);
      if (year) {
        const sem = year.semesters?.find(s => s.number === p.semester);
        if (sem && sem.subjects) {
          sem.subjects.forEach(sub => {
            subjectsMap[sub.id] = sub;
          });
        }
      }
    }
  }

  const displayResources = showUnreadOnly
    ? resources.filter(r => {
        const opened = user?.profile?.openedResources || [];
        return !opened.includes(r.id);
      })
    : resources;

  const announcements = [];
  const standardResources = [];
  displayResources.forEach(r => {
    // Tweets (new) or legacy text-only Notices go to announcements (sticky notes)
    if (r.type === 'Tweet' || (r.type === 'Notice' && r.textContent && !r.fileUrl && !r.linkUrl)) {
      announcements.push(r);
    } else {
      standardResources.push(r);
    }
  });

  // Group resources by subject
  const groupedResources = standardResources.reduce((acc, r) => {
    const key = r.subjectId && subjectsMap[r.subjectId] ? r.subjectId : 'general';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const subjectColorPalette = [
    '#14b8a6', // Mint
    '#f97316', // Peach / Orange
    '#8b5cf6', // Lavender
    '#0ea5e9', // Sky Blue
    '#d946ef', // Fuchsia / Pink
    '#d4a373', // Nude Beige
    '#e07a5f', // Nude Terracotta
  ];

  const getSubjectColor = (index) => subjectColorPalette[index % subjectColorPalette.length];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = user?.username || 'Student';

  const getFilterCount = (f) => {
    if (f === 'ALL') return resources.length;
    return resources.filter(r => r.type === f).length;
  };

  return (
    <div>
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-light) 100%)',
        borderRadius: 'var(--radius-lg)', padding: '1.5rem 1rem', marginBottom: '1.5rem',
        color: '#fff', position: 'relative', overflow: 'hidden',
        animation: 'fadeSlideUp 0.35s ease-out both'
      }}>
        <div style={{
          position: 'absolute', top: '-40%', right: '-5%', width: '180px', height: '180px',
          borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute', bottom: '-50%', right: '20%', width: '120px', height: '120px',
          borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none'
        }} />
        <p style={{ fontSize: '0.85rem', opacity: 0.85, marginBottom: '0.25rem' }}>{getGreeting()},</p>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ minWidth: 0, flex: 1, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem', wordBreak: 'normal', overflowWrap: 'break-word' }}>
            <span>{user?.role === 'cr' ? 'Class Rep' : 'Student'} {user?.username ? `(${user.username})` : ''}</span>
            {user?.role === 'cr' ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="url(#crBadgeGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginLeft: '0.5rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))', flexShrink: 0 }} title="Class Representative">
                <defs>
                  <linearGradient id="crBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#fde047" />
                    <stop offset="50%" stopColor="#fbbf24" />
                    <stop offset="100%" stopColor="#d97706" />
                  </linearGradient>
                </defs>
                <circle cx="12" cy="8" r="6" fill="url(#crBadgeGrad)" fillOpacity="0.3"/>
                <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" fill="url(#crBadgeGrad)" fillOpacity="0.3"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="url(#studentBadgeGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginLeft: '0.5rem', filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.2))', flexShrink: 0 }} title="Student">
                <defs>
                  <linearGradient id="studentBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#4ade80" />
                    <stop offset="50%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#38bdf8" />
                  </linearGradient>
                </defs>
                <circle cx="12" cy="8" r="6" fill="url(#studentBadgeGrad)" fillOpacity="0.25"/>
                <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" fill="url(#studentBadgeGrad)" fillOpacity="0.25"/>
              </svg>
            )}
          </span>
          <EditNameButton />
        </h1>


        {p && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', opacity: 0.9, fontSize: '0.9rem' }}>
            <span style={{
              padding: '0.2rem 0.6rem', borderRadius: '999px',
              background: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', fontWeight: 600
            }}>
              {branchLabels[p.branch] || p.branch.replace('br_', '').toUpperCase()}
            </span>
            <span>•</span>
            <span>Year {p.year}</span>
            <span>•</span>
            <span>Sem {p.semester}</span>
            <span>•</span>
            <span>Section {p.section}</span>
            <span>•</span>
            {p.rollNo ? (
              <span style={{
                padding: '0.2rem 0.6rem', borderRadius: '999px',
                background: 'rgba(255,255,255,0.2)', fontSize: '0.8rem', fontWeight: 600
              }}>
                {p.rollNo}
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input 
                  type="text" 
                  placeholder="Enter Roll No" 
                  value={rollNoInput} 
                  onChange={e => setRollNoInput(e.target.value)}
                  style={{ padding: '0.1rem 0.4rem', borderRadius: '4px', border: 'none', fontSize: '0.8rem', color: '#000', width: '110px' }}
                />
                <button 
                  onClick={handleSaveRollNo} 
                  disabled={savingRollNo}
                  style={{ padding: '0.1rem 0.4rem', borderRadius: '4px', border: 'none', background: 'rgba(255,255,255,0.3)', color: '#fff', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  {savingRollNo ? '...' : 'Save'}
                </button>
              </span>
            )}
          </div>
        )}
        {!loading && (
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', opacity: 0.75 }}>
            {resources.length > 0
              ? `You have ${resources.length} resource${resources.length !== 1 ? 's' : ''} available.`
              : 'No resources available yet. Check back soon!'}
          </p>
        )}
      </div>

      <SearchBar />

      {/* Filters Row */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', maxWidth: '100%'
      }}>

        <label style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer',
          fontSize: '0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap',
          padding: '0.375rem 0.75rem', borderRadius: 'var(--radius-sm)',
          background: showUnreadOnly ? 'var(--accent-bg)' : 'transparent',
          border: `1px solid ${showUnreadOnly ? 'var(--accent)' : 'transparent'}`,
          transition: 'all 0.2s ease', flexShrink: 0
        }}>
          <input type="checkbox" checked={showUnreadOnly} onChange={e => setShowUnreadOnly(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: 'var(--accent)' }} />
          Unread only
        </label>
      </div>

      {/* Subject-Wise Resources Grid */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card" style={{
              height: '120px', background: 'var(--bg-glass)',
              animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s`
            }} />
          ))}
        </div>
      ) : displayResources.length === 0 ? (
        <div className="empty-state" style={{ paddingTop: '4rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem', opacity: 0.5 }}>📭</div>
          <p style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
            {showUnreadOnly ? 'All caught up!' : 'No resources found'}
          </p>
          <p className="text-sm" style={{ maxWidth: '360px', margin: '0 auto' }}>
            {showUnreadOnly
              ? 'You\'ve reviewed all available resources. Great job! 🎉'
              : 'Resources uploaded by your faculty will appear here. Stay tuned!'}
          </p>
          {showUnreadOnly && (
            <button className="btn btn-outline" style={{ marginTop: '1rem' }}
              onClick={() => setShowUnreadOnly(false)}>
              Show all resources
            </button>
          )}
        </div>
      ) : (
        <div className="anim-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {/* Important Announcements Sticky Notes */}
          {announcements.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: '#eab308' }}>📌</span> Important Announcements
              </h3>
              <div className="hide-scrollbar" style={{ display: 'flex', flexWrap: 'nowrap', gap: '1.5rem', overflowX: 'auto', padding: '0.5rem 0.5rem 1.5rem 0.5rem', margin: '-0.5rem' }}>
                {announcements.map((ann, idx) => {
                  const rot = idx % 2 === 0 ? '-1.5deg' : '1.5deg';
                  const defaultBgColors = ['#fef08a', '#fbcfe8', '#bae6fd'];
                  const defaultBorderColors = ['#facc15', '#f472b6', '#7dd3fc'];
                  
                  const STICKY_COLORS = {
                    yellow: { bg: '#fef08a', border: '#facc15' },
                    pink:   { bg: '#fbcfe8', border: '#f472b6' },
                    blue:   { bg: '#bae6fd', border: '#7dd3fc' },
                    green:  { bg: '#bbf7d0', border: '#86efac' },
                    purple: { bg: '#e9d5ff', border: '#d8b4fe' },
                    white:  { bg: '#f8fafc', border: '#cbd5e1' }
                  };
                  
                  const chosenColor = ann.pinColor && STICKY_COLORS[ann.pinColor] ? STICKY_COLORS[ann.pinColor] : null;
                  const bgColor = chosenColor ? chosenColor.bg : defaultBgColors[idx % defaultBgColors.length];
                  const borderColor = chosenColor ? chosenColor.border : defaultBorderColors[idx % defaultBorderColors.length];
                  
                  return (
                    <ResourceCard 
                      key={ann.id} 
                      resource={ann} 
                      variant="sticky"
                      bgColor={bgColor}
                      borderColor={borderColor}
                      rotation={rot}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* General Resources */}
          {groupedResources['general'] && (
            <div style={{ marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ color: 'var(--accent)' }}>📚</span> General & Other Resources
              </h3>
              <div className="grid grid-2">
                {groupedResources['general'].map(res => (
                  <ResourceCard key={res.id} resource={res} color={branchColors[res.targetBranch]} />
                ))}
              </div>
            </div>
          )}

          {/* Subject Specific Resources */}
          {Object.keys(groupedResources)
            .filter(key => key !== 'general')
            .sort((a, b) => subjectsMap[a].name.localeCompare(subjectsMap[b].name))
            .map((subjectId, index) => {
              const subjectColor = getSubjectColor(index);
              return (
              <div key={subjectId} style={{ marginBottom: '1rem' }}>
                <div style={{ 
                  marginBottom: '1rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  gap: '0.5rem', 
                  flexWrap: 'wrap',
                  borderBottom: `2px solid ${subjectColor}40`,
                  paddingBottom: '0.5rem'
                }}>
                  <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: subjectColor }}>
                    {subjectsMap[subjectId].name}{subjectsMap[subjectId].type === 'lab' ? ' (Lab)' : ''}
                  </h3>
                  <span className={`badge ${subjectsMap[subjectId].type === 'lab' ? 'badge-lab' : 'badge-theory'}`} style={{ border: `1px solid ${subjectColor}60`, color: subjectColor }}>
                    {subjectsMap[subjectId].type}
                  </span>
                </div>
                <div className="grid grid-2">
                  {groupedResources[subjectId].map(res => (
                    <ResourceCard key={res.id} resource={res} color={subjectColor} />
                  ))}
                </div>
              </div>
            )})}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
