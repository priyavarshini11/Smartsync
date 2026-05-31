import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import FacultyAssignmentsModal from '../components/Admin/FacultyAssignmentsModal';
import StudentProfileEditModal from '../components/Admin/StudentProfileEditModal';

const RoleIcon = ({ role, size = 18 }) => {
  switch (role) {
    case 'admin':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="url(#goldGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}>
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffe066" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="url(#goldGrad)" fillOpacity="0.25"/>
          <polygon points="12 8 13.5 11.5 17 11.5 14 13.5 15.5 17 12 15 8.5 17 10 13.5 7 11.5 10.5 11.5" fill="url(#goldGrad)"/>
        </svg>
      );
    case 'admin_faculty':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="url(#silverGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}>
          <defs>
            <linearGradient id="silverGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#e2e8f0" />
              <stop offset="70%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" fill="url(#silverGrad)" fillOpacity="0.3"/>
          <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" fill="url(#silverGrad)" fillOpacity="0.1"/>
        </svg>
      );
    case 'faculty':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="url(#facultyBadgeGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}>
          <defs>
            <linearGradient id="facultyBadgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#a5f3fc" />
              <stop offset="40%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>
          </defs>
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" fill="url(#facultyBadgeGrad)" fillOpacity="0.3"/>
          <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" fill="url(#facultyBadgeGrad)" fillOpacity="0.1"/>
        </svg>
      );
    case 'student':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="url(#studentBadgeGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>
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
      );
    case 'cr':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="url(#crBadgeGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.25))' }}>
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
      );
    default:
      return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
  }
};

const AdminUsers = () => {
  const { user, selectedBranch: authSelectedBranch } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingAssignmentsFor, setEditingAssignmentsFor] = useState(null);
  const [editingStudentProfileFor, setEditingStudentProfileFor] = useState(null);
  const [expandedUserId, setExpandedUserId] = useState(null);

  const toggleExpand = (id) => {
    setExpandedUserId(prev => prev === id ? null : id);
  };
  
  // Faculty sees only students, HOD (admin_faculty) sees both tabs
  const isStudentOnlyView = user?.role === 'faculty';

  const getAllowedBranchIds = () => {
    const isHod = user?.role === 'admin_faculty';
    if (!isStudentOnlyView && !isHod) return null;
    let allowedIds = new Set();
    if (user?.profile?.assignments?.length > 0) {
      user.profile.assignments.forEach(a => allowedIds.add(a.branch));
    } else if (user?.profile?.branch) {
      allowedIds.add(user.profile.branch);
    }
    return allowedIds.size > 0 ? [...allowedIds] : null;
  };
  const allowedBranchIds = getAllowedBranchIds();

  const [activeTab, setActiveTab] = useState(isStudentOnlyView ? 'student' : 'faculty');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [selectedSection, setSelectedSection] = useState('ALL');

  const [facultyRoleFilter, setFacultyRoleFilter] = useState('ALL');
  const [facultyYear, setFacultyYear] = useState('ALL');
  const [facultyBranch, setFacultyBranch] = useState('ALL');
  const [facultySection, setFacultySection] = useState('ALL');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, branchesRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/taxonomy')
      ]);
      setUsers(usersRes);
      setBranches(branchesRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const handleBranchChange = async (userId, newBranch) => {
    try {
      await api.patch(`/admin/users/${userId}/branch`, { branch: newBranch });
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      fetchData();
    } catch (err) { alert(err.message); }
  };

  const roleColors = { 
    student: 'var(--success)', 
    cr: 'var(--warning)',
    faculty: 'var(--color-ds)', 
    admin_faculty: 'var(--color-aids)',
    admin: 'var(--color-aids)' 
  };
  const roleLabels = { 
    student: 'STUDENT', 
    cr: 'CR', 
    faculty: 'FACULTY', 
    admin_faculty: 'ADMIN FACULTY',
    admin: 'ADMIN'
  };

  // Filter users based on tab and selections
  const filteredUsers = users.filter(u => {
    if (activeTab === 'faculty') {
      // HOD (admin_faculty) can only see faculty in their branch, and cannot see Main Admin
      if (user?.role === 'admin_faculty') {
        if (u.role === 'admin') return false;
        const belongsToBranch = u.profile?.branch === user.profile?.branch || 
                               (u.profile?.assignments || []).some(a => a.branch === user.profile?.branch);
        if (!belongsToBranch) return false;
      }

      // 1. Role filter
      if (facultyRoleFilter === 'admin_faculty') {
        if (u.role !== 'admin_faculty') return false;
      } else if (facultyRoleFilter === 'faculty') {
        if (u.role !== 'faculty') return false;
      } else {
        // 'ALL': show faculty, admin, admin_faculty
        if (u.role !== 'faculty' && u.role !== 'admin' && u.role !== 'admin_faculty') return false;
      }

      // 2. Target filters based on assignments
      const assignments = u.profile?.assignments || [];
      const legacyBranch = assignments.length === 0 ? (u.profile?.department || u.profile?.branch || '') : '';

      if (facultyBranch !== 'ALL') {
        if (assignments.length > 0) {
          const hasBranch = assignments.some(a => a.branch === facultyBranch);
          if (!hasBranch) return false;
        } else {
          if (legacyBranch !== facultyBranch) return false;
        }
      }

      if (facultyYear !== 'ALL') {
        if (assignments.length > 0) {
          const hasYear = assignments.some(a => Number(a.year) === Number(facultyYear));
          if (!hasYear) return false;
        } else {
          return false;
        }
      }

      if (facultySection !== 'ALL') {
        if (assignments.length > 0) {
          const hasSection = assignments.some(a => a.section === 'ALL' || a.section === facultySection);
          if (!hasSection) return false;
        } else {
          return false;
        }
      }

      return true;
    } else {
      // Students tab: show student and cr accounts
      if (u.role !== 'student' && u.role !== 'cr') return false;
      
      // HOD can only see students in their department branch
      if (user?.role === 'admin_faculty') {
        if (u.profile?.branch !== user.profile?.branch) return false;
      }

      // Faculty can only see students in their assigned branches/years/sems/sections
      if (isStudentOnlyView) {
        const assignments = user?.profile?.assignments || [];
        if (assignments.length > 0) {
          // Check if student matches ANY assignment
          const matchesAssignment = assignments.some(a => 
            a.branch === u.profile?.branch &&
            (a.year === undefined || Number(a.year) === Number(u.profile?.year)) &&
            (a.semester === undefined || Number(a.semester) === Number(u.profile?.semester)) &&
            (a.section === 'ALL' || a.section === u.profile?.section)
          );
          if (!matchesAssignment) return false;
        } else if (user?.profile?.branch) {
          // Legacy fallback
          if (u.profile?.branch !== user.profile.branch) return false;
        }
      }
      
      if (selectedYear !== 'ALL' && u.profile?.year !== Number(selectedYear)) return false;
      if (selectedBranch !== 'ALL' && u.profile?.branch !== selectedBranch) return false;
      if (selectedSection !== 'ALL' && u.profile?.section !== selectedSection) return false;
      return true;
    }
  });

  // Derive unique sections from the taxonomy for the filter dropdown
  const getAvailableSections = () => {
    let sections = new Set();
    
    // Determine which branches to inspect
    let branchesToInspect = branches;
    if (selectedBranch !== 'ALL') {
      branchesToInspect = branches.filter(b => b.id === selectedBranch);
    } else if (allowedBranchIds) {
      branchesToInspect = branches.filter(b => allowedBranchIds.includes(b.id));
    }
    
    // Collect sections
    branchesToInspect.forEach(branch => {
      (branch.years || []).forEach(year => {
        if (selectedYear !== 'ALL' && year.level !== Number(selectedYear)) return;
        (year.semesters || []).forEach(semester => {
          (semester.sections || []).forEach(sec => sections.add(sec));
        });
      });
    });
    
    return [...sections].sort();
  };

  const getAvailableSectionsForFaculty = () => {
    let sections = new Set();
    let branchesToInspect = branches;
    if (facultyBranch !== 'ALL') {
      branchesToInspect = branches.filter(b => b.id === facultyBranch);
    }
    branchesToInspect.forEach(branch => {
      (branch.years || []).forEach(year => {
        if (facultyYear !== 'ALL' && year.level !== Number(facultyYear)) return;
        (year.semesters || []).forEach(semester => {
          (semester.sections || []).forEach(sec => sections.add(sec));
        });
      });
    });
    return [...sections].sort();
  };

  const availableSections = getAvailableSections();
  const availableSectionsForFaculty = getAvailableSectionsForFaculty();

  return (
    <div>
      <div className="app-header" style={{ marginBottom: isStudentOnlyView ? 0 : '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{isStudentOnlyView ? 'Students' : 'User Management'}</h1>
      </div>
      
      {!isStudentOnlyView && (
        <div className="tabs" style={{ marginBottom: '1.5rem' }}>
          <button 
            className={`tab-item ${activeTab === 'faculty' ? 'active' : ''}`} 
            onClick={() => setActiveTab('faculty')} 
            style={{ flex: 1 }}
          >
            Faculty & Admins
          </button>
          <button 
            className={`tab-item ${activeTab === 'student' ? 'active' : ''}`} 
            onClick={() => setActiveTab('student')} 
            style={{ flex: 1 }}
          >
            Students
          </button>
        </div>
      )}

      {activeTab === 'student' && (
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '130px', marginBottom: 0 }}>
            <label className="form-label text-xs">Filter by Year</label>
            <select className="form-select" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
              <option value="ALL">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
          {(!allowedBranchIds || allowedBranchIds.length > 1) && (
            <div className="form-group" style={{ flex: 1, minWidth: '130px', marginBottom: 0 }}>
              <label className="form-label text-xs">Filter by Branch</label>
              <select className="form-select" value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
                <option value="ALL">{isStudentOnlyView ? "My Assigned Branches" : "All Branches"}</option>
                {branches
                  .filter(b => !allowedBranchIds || allowedBranchIds.includes(b.id))
                  .map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="form-group" style={{ flex: 1, minWidth: '130px', marginBottom: 0 }}>
            <label className="form-label text-xs">Filter by Section</label>
            <select className="form-select" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
              <option value="ALL">All Sections</option>
              {availableSections.map(s => (
                <option key={s} value={s}>Section {s}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {activeTab === 'faculty' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {/* Role Filters */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {['ALL', 'admin_faculty', 'faculty'].map(role => (
              <button
                key={role}
                className={`btn ${facultyRoleFilter === role ? 'btn-primary' : 'btn-outline'} btn-sm`}
                onClick={() => setFacultyRoleFilter(role)}
                style={{ borderRadius: 'var(--radius-sm)' }}
              >
                {role === 'ALL' ? 'All' : role === 'admin_faculty' ? 'Admin Faculty' : 'Faculty'}
              </button>
            ))}
          </div>

          {/* Year, Branch, Section Filters */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '130px', marginBottom: 0 }}>
              <label className="form-label text-xs">Filter by Year</label>
              <select className="form-select" value={facultyYear} onChange={(e) => setFacultyYear(e.target.value)}>
                <option value="ALL">All Years</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
            {(!allowedBranchIds || allowedBranchIds.length > 1) && (
              <div className="form-group" style={{ flex: 1, minWidth: '130px', marginBottom: 0 }}>
                <label className="form-label text-xs">Filter by Branch</label>
                <select className="form-select" value={facultyBranch} onChange={(e) => setFacultyBranch(e.target.value)}>
                  <option value="ALL">All Branches</option>
                  {branches
                    .filter(b => !allowedBranchIds || allowedBranchIds.includes(b.id))
                    .map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="form-group" style={{ flex: 1, minWidth: '130px', marginBottom: 0 }}>
              <label className="form-label text-xs">Filter by Section</label>
              <select className="form-select" value={facultySection} onChange={(e) => setFacultySection(e.target.value)}>
                <option value="ALL">All Sections</option>
                {availableSectionsForFaculty.map(s => (
                  <option key={s} value={s}>Section {s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {loading ? <p className="text-muted">Loading...</p> : filteredUsers.length === 0 ? (
        <div className="empty-state card"><p>No users found for this selection.</p></div>
      ) : (
        <div className="anim-stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {filteredUsers.map(u => {
            const isExpanded = expandedUserId === u.id;
            return (
              <div key={u.id} className="card card-flat" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', cursor: 'pointer', transition: 'background 0.2s' }} onClick={() => toggleExpand(u.id)}>
                {/* Compact View */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                    <div className="profile-avatar" style={{ width: 40, height: 40, fontSize: '1.1rem' }}>
                      {(u.username || u.email || '?')[0].toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '0.01em' }}>
                        {u.username || '(no username)'}
                      </div>
                      {(u.role === 'student' || u.role === 'cr') && u.profile?.rollNo && (
                        <span style={{
                          padding: '0.1rem 0.5rem', borderRadius: '999px',
                          background: 'rgba(148, 163, 184, 0.15)', border: '1px solid var(--border-glass)',
                          fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)',
                          whiteSpace: 'nowrap'
                        }}>
                          {u.profile.rollNo}
                        </span>
                      )}
                      <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} title={roleLabels[u.role] || u.role.toUpperCase()}>
                        <RoleIcon role={u.role} size={20} />
                      </span>
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '0.75rem', marginTop: '0.25rem' }} onClick={(e) => e.stopPropagation()}>
                    {/* User Metadata */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center' }}>
                      <span className="text-sm text-muted" style={{ marginRight: '0.5rem' }}>{u.email}</span>
                      <span className="badge" style={{ background: roleColors[u.role] || 'var(--color-ds)', color: 'var(--text-primary)', padding: '0.25rem 0.6rem' }}>
                        {roleLabels[u.role] || u.role.toUpperCase()}
                      </span>
                      {u.isMainAdmin && <span className="badge" style={{ background: 'var(--warning-bg)', color: 'var(--warning)', padding: '0.25rem 0.6rem' }}>MAIN ADMIN</span>}
                      {u.role === 'admin_faculty' && u.profile?.branch && (
                        <span className="badge" style={{ background: 'var(--color-aids)', color: '#fff', padding: '0.25rem 0.6rem' }}>
                          HOD: {branches.find(b => b.id === u.profile.branch)?.shortName || u.profile.branch}
                        </span>
                      )}
                      {(u.role === 'student' || u.role === 'cr') && (
                        u.onboardingComplete ? (
                          <span className="badge" style={{ background: 'var(--success-bg)', color: 'var(--success)', padding: '0.25rem 0.6rem' }}>ACTIVE</span>
                        ) : (
                          <span className="badge" style={{ background: 'var(--warning-bg)', color: 'var(--warning)', padding: '0.25rem 0.6rem' }}>PENDING ONBOARDING</span>
                        )
                      )}
                    </div>

                    {/* Academic Profile */}
                    <div style={{ background: 'var(--bg-glass)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
                      {(u.role === 'student' || u.role === 'cr') && u.profile && (
                        <div className="text-sm">
                          Year {u.profile.year} • {branches.find(b => b.id === u.profile.branch)?.shortName || u.profile.branch} • Sec {u.profile.section}
                        </div>
                      )}
                      {(u.role === 'faculty' || u.role === 'admin_faculty') && (
                        <div className="text-sm">
                          {u.profile?.assignments?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                              <div style={{ fontWeight: 600, marginBottom: '0.125rem' }}>Assignments:</div>
                              {u.profile.assignments.map((a, i) => (
                                <div key={i} style={{ color: 'var(--text-secondary)' }}>
                                  • {branches.find(b => b.id === a.branch)?.shortName || a.branch} | Year: {a.year} | Sem: {a.semester} | Sec: {a.section}
                                  {a.subjectId && (
                                    <span> | Subject: {(() => {
                                      const sub = branches.find(b => b.id === a.branch)?.years?.find(y => y.level === Number(a.year))?.semesters?.find(s => s.number === Number(a.semester))?.subjects?.find(sub => sub.id === a.subjectId);
                                      return sub ? `${sub.name}${sub.type === 'lab' ? ' (Lab)' : ''}` : 'Unknown';
                                    })()}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : u.profile?.branch ? (
                            <span>Branch: {branches.find(b => b.id === u.profile.branch)?.shortName || u.profile.branch} (Legacy)</span>
                          ) : (
                            <span className="text-muted">No assignments yet</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Controls */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {!isStudentOnlyView && (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <select 
                            className="form-select form-select-sm" 
                            value={u.role} 
                            onChange={e => handleRoleChange(u.id, e.target.value)} 
                            style={{ flex: 1, minWidth: '130px' }}
                            disabled={u.isMainAdmin || (user?.role === 'admin_faculty' && activeTab === 'faculty')}
                          >
                            {activeTab === 'faculty' ? (
                              <>
                                <option value="faculty">Faculty</option>
                                <option value="admin_faculty">Admin Faculty</option>
                              </>
                            ) : (
                              <>
                                <option value="student">Student</option>
                                <option value="cr">CR</option>
                              </>
                            )}
                          </select>

                          {u.role === 'admin_faculty' && !u.isMainAdmin && (
                            <select
                              className="form-select form-select-sm"
                              value={u.profile?.branch || ''}
                              onChange={e => handleBranchChange(u.id, e.target.value)}
                              style={{ flex: 1, minWidth: '130px' }}
                              disabled={user?.role === 'admin_faculty'}
                            >
                              <option value="">Assign HOD...</option>
                              {branches.map(b => (
                                <option key={b.id} value={b.id}>HOD: {b.shortName || b.name}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                        {activeTab === 'student' && !isStudentOnlyView && (
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ flex: 1 }}
                            onClick={() => setEditingStudentProfileFor(u)}
                          >
                            Edit Profile
                          </button>
                        )}
                        {activeTab === 'faculty' && !isStudentOnlyView && (
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ flex: 1 }}
                            onClick={() => setEditingAssignmentsFor(u)}
                            disabled={u.isMainAdmin}
                          >
                            Assign Subjects
                          </button>
                        )}
                        {!isStudentOnlyView && (
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => handleDelete(u.id)}
                            disabled={u.isMainAdmin}
                            title={u.isMainAdmin ? "Cannot delete main admin" : "Delete User"}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {editingAssignmentsFor && (
        <FacultyAssignmentsModal
          user={editingAssignmentsFor}
          branches={user?.role === 'admin_faculty' ? branches.filter(b => b.id === (user?.profile?.branch || authSelectedBranch)) : branches}
          onClose={() => setEditingAssignmentsFor(null)}
          onSave={() => {
            setEditingAssignmentsFor(null);
            fetchData();
          }}
        />
      )}

      {editingStudentProfileFor && (
        <StudentProfileEditModal
          student={editingStudentProfileFor}
          branches={branches}
          loggedInUser={user}
          onClose={() => setEditingStudentProfileFor(null)}
          onSave={() => {
            setEditingStudentProfileFor(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default AdminUsers;
