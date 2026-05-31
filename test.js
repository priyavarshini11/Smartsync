const fs = require('fs');
const users = JSON.parse(fs.readFileSync('server/data/users.json'));
const resources = JSON.parse(fs.readFileSync('server/data/resources.json'));

const studentProfile = { branch: 'br_cse', year: 2, semester: 4, section: 'B' };
const faculties = users.filter(u => u.role === 'faculty' || u.role === 'admin_faculty');

const myFaculties = faculties.filter(f => {
  const assignments = f.profile?.assignments || [];
  let isAssigned = false;
  
  if (assignments.length > 0) {
    isAssigned = assignments.some(a => 
      a.branch === studentProfile.branch &&
      a.year === studentProfile.year &&
      a.semester === studentProfile.semester &&
      (a.section === 'ALL' || a.section === studentProfile.section)
    );
  } else if (f.profile?.branch === studentProfile.branch) {
    isAssigned = true;
  }
  
  if (!isAssigned) {
    isAssigned = resources.some(r => 
      r.uploadedBy === f.id &&
      !r.isDeleted &&
      r.targetBranch === studentProfile.branch &&
      r.targetYear === studentProfile.year &&
      r.targetSemester === studentProfile.semester &&
      (r.targetSection === 'ALL' || r.targetSection === studentProfile.section)
    );
  }
  
  return isAssigned;
});

const safeFaculties = myFaculties.map(f => {
  const fResources = resources.filter(r => 
    r.uploadedBy === f.id &&
    !r.isDeleted &&
    r.targetBranch === studentProfile.branch &&
    r.targetYear === studentProfile.year &&
    r.targetSemester === studentProfile.semester &&
    (r.targetSection === 'ALL' || r.targetSection === studentProfile.section)
  ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const recentResource = fResources.length > 0 ? fResources[0] : null;

  return {
    id: f.id,
    name: f.name || f.username || 'Faculty',
    username: f.username,
    role: f.role,
    recentPost: recentResource ? {
      title: recentResource.title
    } : null
  };
});

console.log(JSON.stringify(safeFaculties, null, 2));