const http = require('http');
const fs = require('fs');

function apiCall(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: 'localhost', port: 5000, path, method,
      headers: { 'Content-Type': 'application/json', ...(global.token ? { Authorization: `Bearer ${global.token}` } : {}) }
    }, res => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => { try { resolve(JSON.parse(buf)); } catch { resolve(buf); } });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  fs.writeFileSync('server/data/users.json', '[]');
  fs.writeFileSync('server/data/resources.json', '[]');
  await new Promise(r => setTimeout(r, 1500));

  // 1. Create teacher account
  let r = await apiCall('POST', '/api/auth/signup', { email: 'prof@campus.edu', password: 'prof123', role: 'teacher' });
  global.token = r.token;
  console.log('Teacher signup:', r.user?.role);

  r = await apiCall('POST', '/api/auth/set-username', { username: 'prof_kumar' });
  console.log('Teacher username:', r.user?.username, '| onboarding:', r.user?.onboardingComplete);

  // Upload resources
  const uploads = [
    { title: 'Engineering Math I - Unit 1 Notes', type: 'PDF', targetBranch: 'br_cse', targetYear: 1, targetSemester: 1, targetSection: 'A', linkUrl: 'https://example.com/math1.pdf' },
    { title: 'Assignment 1: Limits & Derivatives', type: 'Assignment', targetBranch: 'br_cse', targetYear: 1, targetSemester: 1, targetSection: 'A', linkUrl: 'https://example.com/hw1.pdf', endDate: '2026-05-25' },
    { title: 'C Programming Lab Manual', type: 'PDF', targetBranch: 'br_cse', targetYear: 1, targetSemester: 1, targetSection: 'A', subjectType: 'lab', linkUrl: 'https://example.com/clab.pdf' },
    { title: 'Mid-Sem Exam Timetable', type: 'Notice', targetBranch: 'br_cse', targetYear: 1, targetSemester: 1, targetSection: 'ALL', linkUrl: 'https://example.com/timetable.pdf' },
    { title: 'Physics Lab Record Format', type: 'PDF', targetBranch: 'br_cse', targetYear: 1, targetSemester: 1, targetSection: 'B', linkUrl: 'https://example.com/physics.pdf' },
    { title: 'ECE Circuit Theory Notes', type: 'PDF', targetBranch: 'br_ece', targetYear: 1, targetSemester: 1, targetSection: 'A', linkUrl: 'https://example.com/circuits.pdf' },
  ];
  for (const u of uploads) {
    r = await apiCall('POST', '/api/resources/upload', u);
    console.log(`  Upload "${u.title}":`, r.id ? 'OK' : r.error);
  }

  // 2. Create student account (CSE/Y1/S1/A)
  global.token = null;
  r = await apiCall('POST', '/api/auth/signup', { email: 'ravi@campus.edu', password: 'ravi123', role: 'student' });
  global.token = r.token;
  console.log('\nStudent signup:', r.user?.role);

  r = await apiCall('POST', '/api/auth/set-username', { username: 'ravi' });
  r = await apiCall('POST', '/api/auth/onboarding', { branch: 'br_cse', year: 1, semester: 1, section: 'A' });
  console.log('Student onboarded:', r.user?.profile);

  // Verify filtering
  r = await apiCall('GET', '/api/resources');
  console.log(`\nStudent sees ${r.length} resources:`);
  r.forEach(res => console.log(`  ✓ ${res.title} (${res.type}, target: ${res.targetSection})`));

  console.log('\n✅ Seed complete!');
  console.log('   Login credentials:');
  console.log('   Teacher: prof_kumar / prof123');
  console.log('   Student: ravi / ravi123');
}

main().catch(console.error);
