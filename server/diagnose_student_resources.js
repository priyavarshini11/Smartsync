const fs = require('fs');

const users = JSON.parse(fs.readFileSync('data/users.json'));
const resources = JSON.parse(fs.readFileSync('data/resources.json')).filter(r => !r.isDeleted);

console.log('=== RESOURCE VISIBILITY DIAGNOSTIC ===\n');
console.log(`Total active resources in database: ${resources.length}`);

// Print all active resources target mappings
console.log('\nActive resources target branches and details:');
resources.forEach(r => {
  console.log(`- Title: "${r.title}" | Branch: ${r.targetBranch} | Year: ${r.targetYear} | Sem: ${r.targetSemester} | Sec: ${r.targetSection} | Uploader: ${r.uploaderName || r.uploadedBy}`);
});

console.log('\nAnalyzing students (including CRs):');
users.forEach(u => {
  if (u.role === 'student' || u.role === 'cr') {
    const p = u.profile;
    if (!p) {
      console.log(`- User: ${u.username} (${u.email}) | Role: ${u.role} | ⚠️ NO PROFILE (Pending onboarding) | Sees 0 resources.`);
      return;
    }

    // Filter resources exactly like the API
    const visible = resources.filter(r =>
      r.targetBranch === p.branch &&
      Number(r.targetYear) === Number(p.year) &&
      Number(r.targetSemester) === Number(p.semester) &&
      (r.targetSection === p.section || r.targetSection === 'ALL')
    );

    console.log(`- User: ${u.username} (${u.email}) | Role: ${u.role} | Profile: Branch=${p.branch}, Year=${p.year}, Sem=${p.semester}, Sec=${p.section} | Sees ${visible.length} resources.`);
    if (visible.length === 0) {
      console.log(`  ⚠️ WARNING: This student cannot see any resources!`);
    }
  }
});
