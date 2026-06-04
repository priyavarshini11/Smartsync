const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const { readData, writeData, generateId } = require('../utils/db');
const { User, Resource, Department, AdminConfig, Subscription } = require('../models');
const { authenticate, requireRole, signToken } = require('../middleware/auth');
const { sendTargetedNotification } = require('../services/notification');

// File Upload Configuration (Vercel = memory storage, Local = disk storage)
const isVercel = !!process.env.VERCEL;
const storage = isVercel
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'uploads'));
      },
      filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        cb(null, generateId() + ext);
      }
    });
const upload = multer({ storage, limits: { fileSize: isVercel ? 4.5 * 1024 * 1024 : 50 * 1024 * 1024 } });

// ============================================================
// AUTH ROUTES
// ============================================================

// POST /api/auth/signup — Register with email + password
router.post('/auth/signup', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const userRole = (role === 'faculty') ? 'faculty' : 'student';
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      id: generateId(),
      email: email.toLowerCase(),
      username: null,
      passwordHash,
      role: userRole,
      profile: null,
      onboardingComplete: userRole === 'faculty',
      createdAt: new Date().toISOString()
    });

    const token = signToken(newUser.id);
    const userObj = newUser.toObject();
    const { passwordHash: _, ...safeUser } = userObj;
    res.status(201).json({ token, user: safeUser });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/set-username — Set username after signup
router.post('/auth/set-username', authenticate, async (req, res) => {
  try {
    const { username } = req.body;
    if (!username || username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    const existingUser = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') },
      id: { $ne: req.user.id }
    });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { id: req.user.id },
      { $set: { username } },
      { new: true }
    ).lean();

    const { passwordHash: _, ...safeUser } = updatedUser;
    res.json({ user: safeUser });
  } catch (err) {
    console.error('Set username error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/login — Login with username + password
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password, expectedRole } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') }
    }).lean();
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Role gate: block if user selected the wrong role on the auth page
    if (expectedRole) {
      // Admin gate: only 'admin' accounts can use the PIN login screen
      if (expectedRole === 'admin' && user.role !== 'admin') {
        return res.status(403).json({ error: 'This account is not registered as an Administrator.' });
      }
      
      // Lecturer gate: 'faculty' and 'admin_faculty' can use this
      if (expectedRole === 'faculty' && user.role !== 'faculty' && user.role !== 'admin_faculty') {
        return res.status(403).json({ error: 'This account is not registered as a Lecturer. Please select the correct role.' });
      }

      // Student gate: 'student' and 'cr' can use this
      if (expectedRole === 'student' && user.role !== 'student' && user.role !== 'cr') {
        return res.status(403).json({ error: 'This account is not registered as a Student. Please select the correct role.' });
      }
    }

    const token = signToken(user.id);
    const { passwordHash: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/me — Get current user
router.get('/auth/me', authenticate, async (req, res) => {
  const { passwordHash: _, ...safeUser } = req.user;
  res.json({ user: safeUser });
});

// ============================================================
// ADMIN PIN AUTH SYSTEM
// ======================================================// Helper: read admin config (returns object, not array)
async function readAdminConfig() {
  const data = await AdminConfig.findOne({}).lean();
  return data || { setupComplete: false };
}

// GET /api/admin/auth/status — Check if admin setup is complete
router.get('/admin/auth/status', async (req, res) => {
  const config = await readAdminConfig();
  res.json({ setupComplete: !!config.setupComplete });
});

// POST /api/admin/auth/setup — First-time admin setup
router.post('/admin/auth/setup', async (req, res) => {
  try {
    const config = await readAdminConfig();
    if (config.setupComplete) {
      return res.status(400).json({ error: 'Admin is already set up. Use PIN to log in.' });
    }

    const { adminId } = req.body;
    if (!adminId || adminId.length < 3) {
      return res.status(400).json({ error: 'Admin ID must be at least 3 characters.' });
    }

    // Generate secure PIN (4-6 digits)
    const crypto = require('crypto');
    const pin = String(crypto.randomInt(1000, 999999)).padStart(4, '0');

    // Generate recovery key (24-char alphanumeric)
    const recoveryKey = crypto.randomBytes(18).toString('base64url').slice(0, 24).toUpperCase();

    // Hash both for storage
    const pinHash = await bcrypt.hash(pin, 10);
    const recoveryKeyHash = await bcrypt.hash(recoveryKey, 10);

    // Create admin user record in users collection (or find existing)
    let adminUser = await User.findOne({ role: 'admin', username: adminId.toLowerCase() });

    if (!adminUser) {
      // Create new admin user
      adminUser = await User.create({
        id: generateId(),
        email: `${adminId.toLowerCase()}@admin.internal`,
        username: adminId.toLowerCase(),
        passwordHash: pinHash, // store PIN hash as password hash for compatibility
        role: 'admin',
        profile: null,
        onboardingComplete: true,
        createdAt: new Date().toISOString()
      });
    } else {
      adminUser = await User.findOneAndUpdate(
        { id: adminUser.id },
        { $set: { passwordHash: pinHash } },
        { new: true }
      );
    }

    // Save admin config
    const newConfig = {
      setupComplete: true,
      adminId: adminId.toLowerCase(),
      adminUserId: adminUser.id,
      pinHash,
      recoveryKeyHash,
      createdAt: new Date().toISOString()
    };
    await AdminConfig.replaceOne({}, newConfig, { upsert: true });

    // Return credentials (ONLY TIME they are shown)
    res.status(201).json({
      success: true,
      adminId: adminId.toLowerCase(),
      pin,
      recoveryKey,
      message: 'SAVE THESE CREDENTIALS NOW. They will never be shown again.'
    });
  } catch (err) {
    console.error('Admin setup error:', err);
    res.status(500).json({ error: 'Server error during setup.' });
  }
});

// POST /api/admin/auth/login — Admin login with ID + PIN
router.post('/admin/auth/login', async (req, res) => {
  try {
    const { adminId, pin } = req.body;
    if (!adminId || !pin) {
      return res.status(400).json({ error: 'Admin ID and PIN are required.' });
    }

    const config = await readAdminConfig();
    if (!config.setupComplete) {
      return res.status(400).json({ error: 'Admin not set up yet.' });
    }

    // Find admin user first
    const adminUser = await User.findOne({ id: config.adminUserId }).lean();

    // Verify admin ID (allow either original adminId or the currently set username)
    const submittedId = adminId.toLowerCase();
    const isValidId = submittedId === config.adminId || 
                      (adminUser && adminUser.username && submittedId === adminUser.username.toLowerCase());

    if (!isValidId) {
      return res.status(401).json({ error: 'Invalid Admin ID or PIN.' });
    }

    // Verify PIN
    const pinMatch = await bcrypt.compare(pin, config.pinHash);
    if (!pinMatch) {
      return res.status(401).json({ error: 'Invalid Admin ID or PIN.' });
    }

    if (!adminUser) {
      return res.status(500).json({ error: 'Admin user record not found.' });
    }

    const token = signToken(adminUser.id);
    const { passwordHash: _, ...safeUser } = adminUser;
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/admin/auth/reset-pin — Reset PIN using recovery key
router.post('/admin/auth/reset-pin', async (req, res) => {
  try {
    const { adminId, recoveryKey } = req.body;
    if (!adminId || !recoveryKey) {
      return res.status(400).json({ error: 'Admin ID and Recovery Key are required.' });
    }

    const config = await readAdminConfig();
    if (!config.setupComplete) {
      return res.status(400).json({ error: 'Admin not set up yet.' });
    }

    // Find admin user
    const adminUser = await User.findOne({ id: config.adminUserId }).lean();

    // Verify admin ID (allow either original adminId or current username)
    const submittedId = adminId.toLowerCase();
    const isValidId = submittedId === config.adminId || 
                      (adminUser && adminUser.username && submittedId === adminUser.username.toLowerCase());

    if (!isValidId) {
      return res.status(401).json({ error: 'Invalid Admin ID or Recovery Key.' });
    }

    // Verify recovery key
    const keyMatch = await bcrypt.compare(recoveryKey, config.recoveryKeyHash);
    if (!keyMatch) {
      return res.status(401).json({ error: 'Invalid Admin ID or Recovery Key.' });
    }

    // Generate new PIN
    const crypto = require('crypto');
    const newPin = String(crypto.randomInt(1000, 999999)).padStart(4, '0');
    const newPinHash = await bcrypt.hash(newPin, 10);

    // Generate new recovery key
    const newRecoveryKey = crypto.randomBytes(18).toString('base64url').slice(0, 24).toUpperCase();
    const newRecoveryKeyHash = await bcrypt.hash(newRecoveryKey, 10);

    // Update config
    config.pinHash = newPinHash;
    config.recoveryKeyHash = newRecoveryKeyHash;
    config.lastResetAt = new Date().toISOString();
    await AdminConfig.replaceOne({}, config, { upsert: true });

    // Update user record
    await User.updateOne(
      { id: config.adminUserId },
      { $set: { passwordHash: newPinHash } }
    );

    res.json({
      success: true,
      newPin,
      newRecoveryKey,
      message: 'PIN has been reset. SAVE THESE NEW CREDENTIALS NOW.'
    });
  } catch (err) {
    console.error('Admin PIN reset error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/auth/onboarding — Student profile setup
router.post('/auth/onboarding', authenticate, async (req, res) => {
  try {
    const { branch, year, semester, section, rollNo } = req.body;
    if (!branch || !year || !semester || !section) {
      return res.status(400).json({ error: 'All profile fields are required' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { id: req.user.id },
      {
        $set: {
          profile: { branch, year: Number(year), semester: Number(semester), section, rollNo: rollNo || '' },
          onboardingComplete: true
        }
      },
      { new: true }
    ).lean();

    const { passwordHash: _, ...safeUser } = updatedUser;
    res.json({ user: safeUser });
  } catch (err) {
    console.error('Onboarding error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/auth/student-rollno — Existing student sets Roll No
router.patch('/auth/student-rollno', authenticate, async (req, res) => {
  try {
    const { rollNo } = req.body;
    if (!rollNo || typeof rollNo !== 'string') {
      return res.status(400).json({ error: 'Roll No is required' });
    }

    const targetUser = await User.findOne({ id: req.user.id }).lean();
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    if (targetUser.role !== 'student' && targetUser.role !== 'cr') {
      return res.status(400).json({ error: 'This action is only allowed for students' });
    }

    if (targetUser.profile && targetUser.profile.rollNo) {
      return res.status(400).json({ error: 'Roll No is already set and cannot be changed' });
    }

    const updatedUser = await User.findOneAndUpdate(
      { id: req.user.id },
      { $set: { 'profile.rollNo': rollNo.trim() } },
      { new: true }
    ).lean();

    const { passwordHash: _, ...safeUser } = updatedUser;
    res.json({ user: safeUser });
  } catch (err) {
    console.error('Update roll no error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// TAXONOMY ROUTES (Public read, Admin write)
// ============================================================

// GET /api/taxonomy — Get full taxonomy tree
router.get('/taxonomy', async (req, res) => {
  const data = await Department.findOne({}).lean() || { branches: [] };
  res.json(data.branches || []);
});

// GET /api/taxonomy/:branchId — Get single branch
router.get('/taxonomy/:branchId', async (req, res) => {
  const data = await Department.findOne({}).lean() || { branches: [] };
  const branch = (data.branches || []).find(b => b.id === req.params.branchId);
  if (!branch) return res.status(404).json({ error: 'Branch not found' });
  res.json(branch);
});

// POST /api/taxonomy/branches — Add a new branch (Admin only)
router.post('/taxonomy/branches', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, shortName, colorHex } = req.body;
    if (!name) return res.status(400).json({ error: 'Branch name is required' });

    const data = await Department.findOne({}).lean() || { branches: [] };
    const branchId = 'br_' + (shortName || name).toLowerCase().replace(/\s+/g, '_');
    
    if ((data.branches || []).find(b => b.id === branchId)) {
      return res.status(400).json({ error: 'Branch already exists' });
    }

    const newBranch = {
      id: branchId,
      name,
      shortName: shortName || name,
      colorHex: colorHex || '#e0f2fe',
      colorVar: `--color-${(shortName || name).toLowerCase().replace(/\s+/g, '-')}`,
      years: [1, 2, 3, 4].map(level => ({
        id: `yr_${branchId.slice(3)}_${level}`,
        level,
        name: `${['1st', '2nd', '3rd', '4th'][level - 1]} Year`,
        semesters: [
          { id: `sem_${branchId.slice(3)}_${level}_1`, number: (level - 1) * 2 + 1, name: `Semester ${(level - 1) * 2 + 1}`, sections: ['A', 'B', 'C'], subjects: [] },
          { id: `sem_${branchId.slice(3)}_${level}_2`, number: (level - 1) * 2 + 2, name: `Semester ${(level - 1) * 2 + 2}`, sections: ['A', 'B', 'C'], subjects: [] }
        ]
      }))
    };

    if (!data.branches) data.branches = [];
    data.branches.push(newBranch);
    await Department.replaceOne({}, data, { upsert: true });
    res.status(201).json(newBranch);
  } catch (err) {
    console.error('Create branch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/taxonomy/branches/:branchId/color — Update branch color (Admin only)
router.patch('/taxonomy/branches/:branchId/color', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { colorHex } = req.body;
    if (!colorHex) return res.status(400).json({ error: 'Color hex is required' });

    const data = await Department.findOne({}).lean() || { branches: [] };
    const branch = (data.branches || []).find(b => b.id === req.params.branchId);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    branch.colorHex = colorHex;
    await Department.replaceOne({}, data, { upsert: true });
    
    res.json({ success: true, colorHex });
  } catch (err) {
    console.error('Update branch color error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/taxonomy/branches/:branchId — Delete a branch (Admin only)
router.delete('/taxonomy/branches/:branchId', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const data = await Department.findOne({}).lean() || { branches: [] };
    const index = (data.branches || []).findIndex(b => b.id === req.params.branchId);
    if (index === -1) return res.status(404).json({ error: 'Branch not found' });
    
    data.branches.splice(index, 1);
    await Department.replaceOne({}, data, { upsert: true });

    // Also delete resources targeting this branch
    await Resource.deleteMany({ targetBranch: req.params.branchId });

    res.json({ success: true });
  } catch (err) {
    console.error('Delete branch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/taxonomy/sections — Add section to a semester (Admin only)
router.post('/taxonomy/sections', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { branchId, yearLevel, semesterNumber, section } = req.body;
    if (!branchId || !yearLevel || !semesterNumber || !section) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (req.user.role === 'admin_faculty' && req.user.profile?.branch !== branchId) {
      return res.status(403).json({ error: 'Not authorized for this branch' });
    }

    const data = await Department.findOne({}).lean() || { branches: [] };
    const branch = (data.branches || []).find(b => b.id === branchId);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    const year = branch.years.find(y => y.level === Number(yearLevel));
    if (!year) return res.status(404).json({ error: 'Year not found' });

    const semester = year.semesters.find(s => s.number === Number(semesterNumber));
    if (!semester) return res.status(404).json({ error: 'Semester not found' });

    if (semester.sections.includes(section.toUpperCase())) {
      return res.status(400).json({ error: 'Section already exists' });
    }

    semester.sections.push(section.toUpperCase());
    await Department.replaceOne({}, data, { upsert: true });
    res.json({ success: true, sections: semester.sections });
  } catch (err) {
    console.error('Add section error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/taxonomy/sections — Remove section from a semester (Admin only)
router.delete('/taxonomy/sections', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { branchId, yearLevel, semesterNumber, section } = req.body;
    
    if (req.user.role === 'admin_faculty' && req.user.profile?.branch !== branchId) {
      return res.status(403).json({ error: 'Not authorized for this branch' });
    }

    const data = await Department.findOne({}).lean() || { branches: [] };
    const branch = (data.branches || []).find(b => b.id === branchId);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    const year = branch.years.find(y => y.level === Number(yearLevel));
    const semester = year?.semesters.find(s => s.number === Number(semesterNumber));
    if (!semester) return res.status(404).json({ error: 'Semester not found' });

    semester.sections = semester.sections.filter(s => s !== section.toUpperCase());
    await Department.replaceOne({}, data, { upsert: true });
    res.json({ success: true, sections: semester.sections });
  } catch (err) {
    console.error('Remove section error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/taxonomy/sections — Rename section (Admin only)
router.patch('/taxonomy/sections', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { branchId, yearLevel, semesterNumber, oldSection, newSection } = req.body;
    if (!branchId || !yearLevel || !semesterNumber || !oldSection || !newSection) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (req.user.role === 'admin_faculty' && req.user.profile?.branch !== branchId) {
      return res.status(403).json({ error: 'Not authorized for this branch' });
    }

    const data = await Department.findOne({}).lean() || { branches: [] };
    const branch = (data.branches || []).find(b => b.id === branchId);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    const year = branch.years.find(y => y.level === Number(yearLevel));
    const semester = year?.semesters.find(s => s.number === Number(semesterNumber));
    if (!semester) return res.status(404).json({ error: 'Semester not found' });

    const oldSec = oldSection.toUpperCase();
    const newSec = newSection.toUpperCase();

    if (!semester.sections.includes(oldSec)) {
      return res.status(404).json({ error: 'Section not found' });
    }
    if (semester.sections.includes(newSec)) {
      return res.status(400).json({ error: 'New section name already exists' });
    }

    semester.sections = semester.sections.map(s => s === oldSec ? newSec : s);
    await Department.replaceOne({}, data, { upsert: true });

    // Update resources targeting this section
    await Resource.updateMany(
      { targetBranch: branchId, targetYear: Number(yearLevel), targetSemester: Number(semesterNumber), targetSection: oldSec },
      { $set: { targetSection: newSec } }
    );

    // Update users targeting this section
    await User.updateMany(
      { 'profile.branch': branchId, 'profile.year': Number(yearLevel), 'profile.semester': Number(semesterNumber), 'profile.section': oldSec },
      { $set: { 'profile.section': newSec } }
    );

    res.json({ success: true, sections: semester.sections });
  } catch (err) {
    console.error('Rename section error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/taxonomy/subjects — Add subject to a semester (Admin/Faculty)
router.post('/taxonomy/subjects', authenticate, requireRole('admin', 'faculty'), async (req, res) => {
  try {
    const { branchId, yearLevel, semesterNumber, name, type } = req.body;
    if (!branchId || !yearLevel || !semesterNumber || !name || !type) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (!['theory', 'lab'].includes(type)) {
      return res.status(400).json({ error: 'Subject type must be theory or lab' });
    }

    if (req.user.role === 'admin_faculty' && req.user.profile?.branch !== branchId) {
      return res.status(403).json({ error: 'Not authorized for this branch' });
    }

    const data = await Department.findOne({}).lean() || { branches: [] };
    const branch = (data.branches || []).find(b => b.id === branchId);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });

    const year = branch.years.find(y => y.level === Number(yearLevel));
    const semester = year?.semesters.find(s => s.number === Number(semesterNumber));
    if (!semester) return res.status(404).json({ error: 'Semester not found' });

    const subjectId = 'sub_' + generateId();
    semester.subjects.push({ id: subjectId, name, type });
    await Department.replaceOne({}, data, { upsert: true });
    res.status(201).json({ id: subjectId, name, type });
  } catch (err) {
    console.error('Add subject error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/taxonomy/subjects/:subjectId — Delete subject (Admin only)
router.delete('/taxonomy/subjects/:subjectId', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const data = await Department.findOne({}).lean() || { branches: [] };
    let found = false;
    for (const branch of (data.branches || [])) {
      for (const year of branch.years) {
        for (const semester of year.semesters) {
          const idx = semester.subjects.findIndex(s => s.id === req.params.subjectId);
          if (idx !== -1) {
            if (req.user.role === 'admin_faculty' && req.user.profile?.branch !== branch.id) {
              return res.status(403).json({ error: 'Not authorized for this branch' });
            }
            semester.subjects.splice(idx, 1);
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (found) break;
    }
    if (!found) return res.status(404).json({ error: 'Subject not found' });

    await Department.replaceOne({}, data, { upsert: true });

    // Remove resources for this subject
    await Resource.deleteMany({ subjectId: req.params.subjectId });

    res.json({ success: true });
  } catch (err) {
    console.error('Delete subject error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/taxonomy/subjects/:subjectId — Update subject (Admin only)
router.patch('/taxonomy/subjects/:subjectId', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { name, type } = req.body;
    const data = await Department.findOne({}).lean() || { branches: [] };
    let subject = null;

    for (const branch of (data.branches || [])) {
      for (const year of branch.years) {
        for (const semester of year.semesters) {
          const s = semester.subjects.find(sub => sub.id === req.params.subjectId);
          if (s) {
            if (req.user.role === 'admin_faculty' && req.user.profile?.branch !== branch.id) {
              return res.status(403).json({ error: 'Not authorized for this branch' });
            }
            subject = s;
            break;
          }
        }
        if (subject) break;
      }
      if (subject) break;
    }

    if (!subject) return res.status(404).json({ error: 'Subject not found' });

    if (name) subject.name = name;
    if (type) subject.type = type;

    await Department.replaceOne({}, data, { upsert: true });
    res.json(subject);
  } catch (err) {
    console.error('Update subject error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// RESOURCE ROUTES
// ============================================================

// POST /api/resources/upload — Upload resource (Faculty/Admin)
router.post('/resources/upload', authenticate, requireRole('faculty', 'admin'), upload.single('file'), async (req, res) => {
  try {
    let { title, type, targetBranch, targetYear, targetSemester, targetSection, subjectId, subjectType, categoryHeading, startDate, endDate, expirationDate, notify, textContent, pinShape } = req.body;

    const branchIds = (targetBranch || '').split(',').filter(Boolean);
    const years = String(targetYear || '').split(',').filter(Boolean);
    const semesters = String(targetSemester || '').split(',').filter(Boolean);
    const sections = (targetSection || '').split(',').filter(Boolean);

    // Enforce branch boundaries for faculty and admin_faculty
    if (['faculty', 'admin_faculty'].includes(req.user.role) && req.user.profile?.branch) {
      if (branchIds.some(b => b.trim() !== req.user.profile.branch)) {
        return res.status(403).json({ error: 'You can only upload resources for your assigned branch' });
      }
    }

    if (!title || !type || !targetBranch || !targetYear || !targetSemester || !targetSection) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let fileUrl = '';
    if (req.file) {
      if (req.file.buffer) {
        // Vercel serverless: upload to Vercel Blob storage
        try {
          const { put } = require('@vercel/blob');
          const blob = await put(req.file.originalname, req.file.buffer, {
            access: 'public',
            contentType: req.file.mimetype
          });
          fileUrl = blob.url;
        } catch (e) {
          console.error('Vercel Blob upload failed:', e);
          return res.status(400).json({ error: `Vercel Blob upload failed: ${e.message}. Please verify BLOB_READ_WRITE_TOKEN is set.` });
        }
      } else {
        // Local dev: file saved to disk by multer
        fileUrl = `/uploads/${req.file.filename}`;
      }
    } else {
      fileUrl = req.body.linkUrl || '';
    }

    const newResources = [];
    // If subjectId is selected, lookup its precise taxonomy in departments
    let subjectTaxonomy = null;
    if (subjectId && subjectId !== 'none') {
      try {
        const depts = await Department.findOne({}).lean() || { branches: [] };
        for (const b of (depts.branches || [])) {
          for (const y of b.years) {
            for (const s of y.semesters) {
              const sub = s.subjects.find(x => x.id === subjectId);
              if (sub) {
                subjectTaxonomy = {
                  branchId: b.id,
                  yearLevel: Number(y.level),
                  semNumber: Number(s.number)
                };
                break;
              }
            }
            if (subjectTaxonomy) break;
          }
          if (subjectTaxonomy) break;
        }
      } catch (err) {
        console.error('Failed to read departments for taxonomy restriction:', err);
      }
    }

    const uploadGroupId = generateId();

    branchIds.forEach(branchId => {
      years.forEach(year => {
        semesters.forEach(sem => {
          sections.forEach(sec => {
            const bId = branchId.trim();
            const yLvl = Number(year);
            const semNum = Number(sem);

            // If a subject taxonomy exists, restrict uploads only to the branch, year, and sem it belongs to
            if (subjectTaxonomy) {
              if (subjectTaxonomy.branchId !== bId || 
                  subjectTaxonomy.yearLevel !== yLvl || 
                  subjectTaxonomy.semNumber !== semNum) {
                return; // skip mismatching combinations
              }
            }

            newResources.push({
              id: generateId(),
              uploadGroupId,
              title,
              type,
              fileUrl,
              targetBranch: bId,
              targetYear: yLvl,
              targetSemester: semNum,
              targetSection: sec.trim(),
              subjectId: (subjectId === 'none' || !subjectId) ? null : subjectId,
              subjectType: subjectType || null,
              categoryHeading: categoryHeading || '',
              textContent: textContent || null,
              pinShape: pinShape || 'pin',
              startDate: startDate || null,
              endDate: endDate || null,
              expirationDate: expirationDate || null,
              isDeleted: false,
              deletedReason: null,
              uploadedBy: req.user.id,
              uploaderName: req.user.username || req.user.email,
              createdAt: new Date().toISOString()
            });
          });
        });
      });
    });

    if (newResources.length > 0) {
      await Resource.insertMany(newResources);
    }

    // Push notification (fire and forget)
    if (notify === 'true' || notify === true) {
      try {
        let subjectName = '';
        if (subjectId && subjectId !== 'none') {
          const depts = await Department.findOne({}).lean() || { branches: [] };
          for (const b of (depts.branches || [])) {
            for (const y of b.years) {
              for (const s of y.semesters) {
                const sub = s.subjects.find(x => x.id === subjectId);
                if (sub) { subjectName = sub.name; break; }
              }
            }
          }
        }
        
        branchIds.forEach(branchId => {
          sendTargetedNotification({
            title: `New ${type}: ${title}`,
            body: subjectName ? `A new resource for ${subjectName} has been published.` : `A new resource has been published for ${targetSection} section.`
          }, {
            branch: branchId.trim(),
            year: Number(targetYear),
            semester: Number(targetSemester),
            section: targetSection
          });
        });
      } catch (e) {
        console.log('Push notification skipped:', e.message);
      }
    }

    if (newResources.length === 0) {
      return res.status(400).json({ error: 'No resources were created. The selected subject does not belong to any of the chosen branch, year, or semester targets.' });
    }

    res.status(201).json(newResources[0]);
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/resources — Get resources (filtered by user profile for students)
router.get('/resources', authenticate, async (req, res) => {
  try {
    const now = new Date();
    const query = {
      isDeleted: false,
      $or: [
        { expirationDate: null },
        { expirationDate: { $gt: now.toISOString() } }
      ]
    };

    // Students (and CR) only see resources for their profile
    const isStudentLike = req.user.role === 'student' || req.user.role === 'cr';

    if (isStudentLike && req.user.profile) {
      const p = req.user.profile;
      query.targetBranch = p.branch;
      query.targetYear = p.year;
      query.targetSemester = p.semester;
      query.targetSection = { $in: [p.section, 'ALL'] };
    }

    // Faculty & Admin Faculty (HOD) can only browse their own branch
    if (['faculty', 'admin_faculty'].includes(req.user.role) && req.user.profile?.branch) {
      query.targetBranch = req.user.profile.branch;
    }

    // Optional query filters
    if (req.query.type) {
      query.type = req.query.type;
    }
    if (req.query.subjectId) {
      query.subjectId = req.query.subjectId;
    }
    if (req.query.branch) {
      query.targetBranch = req.query.branch;
    }
    if (req.query.year) {
      query.targetYear = Number(req.query.year);
    }
    if (req.query.semester) {
      query.targetSemester = Number(req.query.semester);
    }
    if (req.query.section) {
      query.targetSection = req.query.section;
    }

    const resources = await Resource.find(query, { _id: 0, __v: 0 }).sort({ createdAt: -1 }).lean();
    res.json(resources);
  } catch (err) {
    console.error('Get resources error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/resources/:id/read — Mark resource as read for the current user
router.post('/resources/:id/read', authenticate, async (req, res) => {
  try {
    const updatedUser = await User.findOneAndUpdate(
      { id: req.user.id },
      { $addToSet: { 'profile.openedResources': req.params.id } },
      { new: true }
    ).lean();

    if (!updatedUser) return res.status(404).json({ error: 'User not found' });
    
    res.json({ success: true, openedResources: updatedUser.profile?.openedResources || [] });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/resources/analytics/bulk — Get read analytics for grouped resources
router.post('/resources/analytics/bulk', authenticate, requireRole('faculty', 'admin', 'admin_faculty'), async (req, res) => {
  try {
    const { resourceIds } = req.body;
    if (!Array.isArray(resourceIds)) {
      return res.status(400).json({ error: 'resourceIds must be an array' });
    }

    const stats = {};

    for (const id of resourceIds) {
      const resource = await Resource.findOne({ id }).lean();
      if (!resource) {
        stats[id] = { readCount: 0, targetCount: 0 };
        continue;
      }

      // Get all resources in the same group
      let groupResources = [];
      if (resource.uploadGroupId) {
        groupResources = await Resource.find({ uploadGroupId: resource.uploadGroupId }).lean();
      } else {
        const startOfDay = new Date(resource.createdAt);
        startOfDay.setHours(0,0,0,0);
        const endOfDay = new Date(resource.createdAt);
        endOfDay.setHours(23,59,59,999);
        
        groupResources = await Resource.find({
          title: resource.title,
          fileUrl: resource.fileUrl,
          uploadedBy: resource.uploadedBy,
          createdAt: { $gte: startOfDay.toISOString(), $lte: endOfDay.toISOString() }
        }).lean();
      }

      if (groupResources.length === 0) {
        groupResources = [resource];
      }

      const targetedUserIds = new Set();
      const readUserIds = new Set();

      for (const resItem of groupResources) {
        const query = { role: { $in: ['student', 'cr'] } };
        if (resItem.targetBranch) query['profile.branch'] = resItem.targetBranch;
        if (resItem.targetYear) query['profile.year'] = Number(resItem.targetYear);
        if (resItem.targetSemester) query['profile.semester'] = Number(resItem.targetSemester);
        if (resItem.targetSection && resItem.targetSection !== 'ALL') {
          query['profile.section'] = resItem.targetSection;
        }

        const targets = await User.find(query, { id: 1, 'profile.openedResources': 1 }).lean();

        targets.forEach(u => {
          targetedUserIds.add(u.id);
          if (u.profile?.openedResources?.includes(resItem.id)) {
            readUserIds.add(u.id);
          }
        });
      }

      stats[id] = { 
        readCount: readUserIds.size, 
        targetCount: targetedUserIds.size 
      };
    }

    res.json(stats);
  } catch (err) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/resources/tweets - Get all active tweets globally
router.get('/resources/tweets', authenticate, async (req, res) => {
  try {
    const tweets = await Resource.find({ type: 'Tweet', isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();
    res.json(tweets);
  } catch (err) {
    console.error('Get tweets error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/resources/faculty/stats — Faculty dashboard stats
router.get('/resources/faculty/stats', authenticate, requireRole('faculty', 'admin'), async (req, res) => {
  try {
    const myResources = await Resource.find({ uploadedBy: req.user.id, isDeleted: false }).lean();
    const activeAssignments = myResources.filter(r =>
      (r.type === 'Assignment' || r.type === 'Project') &&
      r.endDate && new Date(r.endDate) >= new Date()
    );
    const uniqueClasses = new Set(myResources.map(r => `${r.targetBranch}-${r.targetYear}-${r.targetSemester}-${r.targetSection}`));
    const recentUploads = [...myResources].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    const taxonomy = await Department.findOne({}).lean() || { branches: [] };
    const branchNames = {};
    (taxonomy.branches || []).forEach(b => { branchNames[b.id] = b.shortName || b.name; });

    // Chart Data calculations
    const uploadsByMonth = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    myResources.forEach(r => {
      const d = new Date(r.createdAt || new Date());
      const mKey = `${months[d.getMonth()]} ${d.getFullYear()}`;
      uploadsByMonth[mKey] = (uploadsByMonth[mKey] || 0) + 1;
    });

    const chartData = {
      byMonth: Object.keys(uploadsByMonth).map(k => ({ name: k, count: uploadsByMonth[k] }))
    };

    res.json({
      totalUploads: myResources.length,
      activeAssignments: activeAssignments.length,
      uniqueClasses: uniqueClasses.size,
      recentUploads: recentUploads.map(r => ({
        ...r,
        branchName: branchNames[r.targetBranch] || r.targetBranch
      })),
      uploadsByType: myResources.reduce((acc, r) => { acc[r.type] = (acc[r.type] || 0) + 1; return acc; }, {}),
      chartData
    });
  } catch (err) {
    console.error('Faculty stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/resources/faculty — Get resources uploaded by current faculty
router.get('/resources/faculty', authenticate, requireRole('faculty', 'admin'), async (req, res) => {
  try {
    const resources = await Resource.find({ uploadedBy: req.user.id, isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();
    res.json(resources);
  } catch (err) {
    console.error('Get faculty resources error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/resources/:id/delete — Soft delete
router.patch('/resources/:id/delete', authenticate, requireRole('faculty', 'admin'), async (req, res) => {
  try {
    const targetResource = await Resource.findOne({ id: req.params.id }).lean();
    if (!targetResource) return res.status(404).json({ error: 'Resource not found' });

    // Enforce HOD (admin_faculty) branch boundaries
    if (req.user.role === 'admin_faculty' && targetResource.targetBranch !== req.user.profile?.branch) {
      return res.status(403).json({ error: 'Not authorized to delete resources outside your department branch' });
    }

    // Enforce regular faculty ownership boundaries
    if (req.user.role === 'faculty' && targetResource.uploadedBy !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this resource' });
    }

    const reason = req.body.reason || 'Admin Deleted';
    const deletedAt = new Date().toISOString();

    let query = {};
    if (targetResource.uploadGroupId) {
      query = { uploadGroupId: targetResource.uploadGroupId };
    } else {
      const startOfDay = new Date(targetResource.createdAt);
      startOfDay.setHours(0,0,0,0);
      const endOfDay = new Date(targetResource.createdAt);
      endOfDay.setHours(23,59,59,999);

      query = {
        title: targetResource.title,
        fileUrl: targetResource.fileUrl,
        uploadedBy: targetResource.uploadedBy,
        createdAt: { $gte: startOfDay.toISOString(), $lte: endOfDay.toISOString() }
      };
    }

    await Resource.updateMany(query, {
      $set: {
        isDeleted: true,
        deletedReason: reason,
        deletedAt: deletedAt
      }
    });

    res.json(targetResource);
  } catch (err) {
    console.error('Soft delete error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/resources/:id — Edit resource details
router.patch('/resources/:id', authenticate, requireRole('faculty', 'admin'), async (req, res) => {
  try {
    const { title, type, subjectId, targetBranch, targetYear, targetSemester, targetSection } = req.body;
    const r = await Resource.findOne({ id: req.params.id }).lean();
    if (!r) return res.status(404).json({ error: 'Resource not found' });

    // Enforce HOD (admin_faculty) branch boundaries
    if (req.user.role === 'admin_faculty' && r.targetBranch !== req.user.profile?.branch) {
      return res.status(403).json({ error: 'Not authorized to edit resources outside your department branch' });
    }

    if (req.user.role === 'faculty' && r.uploadedBy !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to edit this resource' });
    }

    // Enforce HOD target branch assignment limits
    if (req.user.role === 'admin_faculty' && targetBranch && targetBranch !== req.user.profile?.branch) {
      return res.status(403).json({ error: 'You can only assign resources to your own department branch' });
    }

    // Enforce assignment boundaries
    if (targetBranch || targetYear || targetSemester || targetSection) {
      const checkBranch = targetBranch || r.targetBranch;
      const checkYear = targetYear || r.targetYear;
      const checkSemester = targetSemester || r.targetSemester;
      const checkSection = targetSection || r.targetSection;

      if (['faculty', 'admin_faculty'].includes(req.user.role) && req.user.profile?.assignments?.length > 0) {
        const assignments = req.user.profile.assignments;
        const isValid = assignments.some(a => {
          if (a.branch !== checkBranch) return false;
          if (a.year && Number(a.year) !== Number(checkYear)) return false;
          if (a.semester && Number(a.semester) !== Number(checkSemester)) return false;
          if (a.section && a.section !== 'ALL' && a.section !== checkSection) return false;
          return true;
        });

        if (!isValid) {
          return res.status(403).json({ error: 'You are not assigned to edit resources for this specific target' });
        }
      }
    }

    const updates = {};
    if (title) updates.title = title;
    if (type) updates.type = type;
    if (subjectId !== undefined) updates.subjectId = subjectId;
    if (targetBranch) updates.targetBranch = targetBranch;
    if (targetYear) updates.targetYear = Number(targetYear);
    if (targetSemester) updates.targetSemester = Number(targetSemester);
    if (targetSection) updates.targetSection = targetSection;

    const updated = await Resource.findOneAndUpdate(
      { id: req.params.id },
      { $set: updates },
      { new: true }
    ).lean();

    res.json(updated);
  } catch (err) {
    console.error('Edit error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/resources/:id/restore — Restore soft-deleted
router.patch('/resources/:id/restore', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const resource = await Resource.findOne({ id: req.params.id }).lean();
    if (!resource) return res.status(404).json({ error: 'Resource not found' });

    // Enforce HOD (admin_faculty) branch boundaries
    if (req.user.role === 'admin_faculty' && resource.targetBranch !== req.user.profile?.branch) {
      return res.status(403).json({ error: 'Not authorized to restore resources outside your department branch' });
    }

    const updated = await Resource.findOneAndUpdate(
      { id: req.params.id },
      { $set: { isDeleted: false, deletedReason: null, deletedAt: null } },
      { new: true }
    ).lean();

    res.json(updated);
  } catch (err) {
    console.error('Restore error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/resources/:id/permanent — Permanent delete
router.delete('/resources/:id/permanent', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const targetResource = await Resource.findOne({ id: req.params.id }).lean();
    if (!targetResource) return res.status(404).json({ error: 'Resource not found' });

    // Enforce HOD (admin_faculty) branch boundaries
    if (req.user.role === 'admin_faculty' && targetResource.targetBranch !== req.user.profile?.branch) {
      return res.status(403).json({ error: 'Not authorized to permanently delete resources outside your department branch' });
    }

    await Resource.deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    console.error('Permanent delete error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/resources/empty-recycle-bin - Empty recycle bin safely
router.delete('/resources/empty-recycle-bin', authenticate, requireRole('admin', 'faculty'), async (req, res) => {
  try {
    let query = { isDeleted: true };

    if (req.user.role === 'admin_faculty' && req.user.profile?.branch) {
      query.targetBranch = req.user.profile.branch;
    } else if (req.user.role === 'admin' || req.user.role === 'main_admin') {
      // no additional filter
    } else {
      // faculty
      query.uploadedBy = req.user.id;
    }

    const result = await Resource.deleteMany(query);
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err) {
    console.error('Empty recycle bin error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/resources/recycle-bin - Get soft-deleted resources
router.get('/resources/recycle-bin', authenticate, requireRole('admin', 'faculty'), async (req, res) => {
  try {
    const query = { isDeleted: true };

    // Enforce HOD (admin_faculty) branch boundaries
    if (req.user.role === 'admin_faculty' && req.user.profile?.branch) {
      query.targetBranch = req.user.profile.branch;
    } else if (req.user.role === 'faculty') {
      query.uploadedBy = req.user.id;
    }

    const deleted = await Resource.find(query).lean();
    res.json(deleted);
  } catch (err) {
    console.error('Recycle bin error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/resources/:id/report — Report broken link (Student)
router.post('/resources/:id/report', authenticate, async (req, res) => {
  try {
    const updated = await Resource.findOneAndUpdate(
      { id: req.params.id },
      {
        $set: {
          isDeleted: true,
          deletedReason: `Flagged by ${req.user.username || 'Student'}`,
          deletedAt: new Date().toISOString()
        }
      },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ error: 'Resource not found' });
    res.json({ success: true, message: 'Resource flagged for admin review' });
  } catch (err) {
    console.error('Report error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// SEARCH
// ============================================================
router.get('/search', authenticate, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const query = { isDeleted: false };

    // Scope to user's profile if student
    if (req.user.role === 'student' && req.user.profile) {
      const p = req.user.profile;
      query.targetBranch = p.branch;
      query.targetYear = p.year;
      query.targetSemester = p.semester;
      query.targetSection = { $in: [p.section, 'ALL'] };
    }

    const resources = await Resource.find(query).lean();
    const taxonomy = await Department.findOne({}).lean() || { branches: [] };
    res.json({ resources, branches: taxonomy.branches || [] });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ADMIN — USER MANAGEMENT
// ============================================================

// GET /api/admin/users — List all users
router.get('/admin/users', authenticate, requireRole('admin', 'faculty'), async (req, res) => {
  try {
    const config = await readAdminConfig();
    let query = {};
    
    if (req.user.role === 'faculty') {
      query.role = { $in: ['student', 'cr'] };
    }

    if (req.user.role === 'admin_faculty' && req.user.profile?.branch) {
      const HODBranch = req.user.profile.branch;
      query.$and = [
        { role: { $ne: 'admin' } },
        {
          $or: [
            { 'profile.branch': HODBranch },
            { 'profile.assignments.branch': HODBranch }
          ]
        }
      ];
    }

    const users = await User.find(query).lean();
    const safeUsers = users.map(({ passwordHash, ...rest }) => ({
      ...rest,
      isMainAdmin: config.setupComplete && rest.id === config.adminUserId
    }));
    res.json(safeUsers);
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/users/:id/role — Change user role
router.patch('/admin/users/:id/role', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['student', 'faculty', 'admin', 'admin_faculty', 'cr'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const update = { role };
    // Faculty and admins don't need student onboarding
    if (role !== 'student') {
      update.onboardingComplete = true;
    }

    const updateQuery = { $set: update };
    // Remove HOD authority if converted back to normal faculty
    if (role === 'faculty') {
      updateQuery.$unset = { 'profile.branch': 1 };
    }

    const updatedUser = await User.findOneAndUpdate(
      { id: req.params.id },
      updateQuery,
      { new: true }
    ).lean();

    if (!updatedUser) return res.status(404).json({ error: 'User not found' });

    const { passwordHash: _, ...safeUser } = updatedUser;
    res.json({ user: safeUser });
  } catch (err) {
    console.error('Change role error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/users/:id/branch — Assign branch to faculty
router.patch('/admin/users/:id/branch', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { branch } = req.body;
    const updatedUser = await User.findOneAndUpdate(
      { id: req.params.id },
      { $set: { 'profile.branch': branch, 'profile.assignments': [] } },
      { new: true }
    ).lean();

    if (!updatedUser) return res.status(404).json({ error: 'User not found' });

    const { passwordHash: _, ...safeUser } = updatedUser;
    res.json({ user: safeUser });
  } catch (err) {
    console.error('Change branch error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/users/:id/assignments - Assign multiple mappings to faculty
router.patch('/admin/users/:id/assignments', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { assignments } = req.body;
    if (!Array.isArray(assignments)) {
      return res.status(400).json({ error: 'assignments must be an array' });
    }

    const targetUser = await User.findOne({ id: req.params.id }).lean();
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // Enforce HOD (admin_faculty) branch boundaries on assignments
    if (req.user.role === 'admin_faculty') {
      const HODBranch = req.user.profile?.branch;
      
      // Target faculty must belong to the HOD's branch or be unassigned
      const userBranch = targetUser.profile?.branch;
      const userAssignments = targetUser.profile?.assignments || [];
      const isNewFaculty = !userBranch && userAssignments.length === 0;
      const belongsToBranch = userBranch === HODBranch || userAssignments.some(a => a.branch === HODBranch) || isNewFaculty;
      
      if (!belongsToBranch) {
        return res.status(403).json({ error: 'Not authorized to assign classes to faculty outside your department branch' });
      }

      // Every assignment item must be within the HOD's branch
      const invalidAssignment = assignments.some(a => a.branch !== HODBranch);
      if (invalidAssignment) {
        return res.status(403).json({ error: 'You can only assign classes within your department branch' });
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { id: req.params.id },
      { $set: { 'profile.assignments': assignments } },
      { new: true }
    ).lean();

    const { passwordHash: _, ...safeUser } = updatedUser;
    res.json({ user: safeUser });
  } catch (err) {
    console.error('Update assignments error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/admin/users/:id/student-profile - Edit student onboarding details (branch, year, semester, section)
router.patch('/admin/users/:id/student-profile', authenticate, requireRole('admin'), async (req, res) => {
  try {
    const { branch, year, semester, section, rollNo } = req.body;
    if (!branch || !year || !semester || !section) {
      return res.status(400).json({ error: 'All profile fields are required' });
    }

    const targetUser = await User.findOne({ id: req.params.id }).lean();
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    if (targetUser.role !== 'student' && targetUser.role !== 'cr') {
      return res.status(400).json({ error: 'This action is only allowed for student profiles' });
    }

    // HOD boundary checks
    if (req.user.role === 'admin_faculty') {
      if (targetUser.profile?.branch && targetUser.profile.branch !== req.user.profile?.branch) {
        return res.status(403).json({ error: 'Not authorized to manage students outside your department branch' });
      }
      if (branch !== req.user.profile?.branch) {
        return res.status(403).json({ error: 'You can only onboard students to your own department branch' });
      }
    }

    const updatedUser = await User.findOneAndUpdate(
      { id: req.params.id },
      {
        $set: {
          profile: {
            branch,
            year: Number(year),
            semester: Number(semester),
            section,
            rollNo: rollNo !== undefined ? rollNo : (targetUser.profile?.rollNo || '')
          },
          onboardingComplete: true
        }
      },
      { new: true }
    ).lean();

    const { passwordHash: _, ...safeUser } = updatedUser;
    res.json({ user: safeUser });
  } catch (err) {
    console.error('Update student profile error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/admin/users/:id - Delete a user (Admin/Faculty)
router.delete('/admin/users/:id', authenticate, requireRole('admin', 'faculty'), async (req, res) => {
  try {
    const targetId = req.params.id;

    // Prevent self-deletion
    if (targetId === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }

    const targetUser = await User.findOne({ id: targetId }).lean();
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    // If Faculty is trying to delete, ensure they only delete students
    if (req.user.role === 'faculty' && targetUser.role !== 'student') {
      return res.status(403).json({ error: 'Faculty can only delete students' });
    }

    // If HOD (admin_faculty) is trying to delete, enforce branch and role boundaries
    if (req.user.role === 'admin_faculty') {
      if (targetUser.role === 'admin' || targetUser.role === 'admin_faculty') {
        return res.status(403).json({ error: 'HODs cannot delete other administrators' });
      }
      const HODBranch = req.user.profile?.branch;
      const userBranch = targetUser.profile?.branch;
      const userAssignments = targetUser.profile?.assignments || [];
      const matchesBranch = userBranch === HODBranch || userAssignments.some(a => a.branch === HODBranch);
      if (!matchesBranch) {
        return res.status(403).json({ error: 'Not authorized to delete users outside your department branch' });
      }
    }

    // If deleting an admin, ensure safety guards
    if (targetUser.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin account' });
      }

      // Protect Main Admin (defined in admin_config.json)
      const config = await readAdminConfig();
      if (config.setupComplete && targetId === config.adminUserId) {
        return res.status(400).json({ error: 'Cannot delete the Main Admin account from here. Use Recovery Key reset if needed.' });
      }
    }

    await User.deleteOne({ id: targetId });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/admin/stats — Dashboard statistics
router.get('/admin/stats', authenticate, requireRole('admin'), async (req, res) => {
  try {
    // Determine if the user is branch-restricted (admin_faculty)
    const isAdminFaculty = req.user.role === 'admin_faculty';
    const userBranch = req.user.profile?.branch || null;

    let activeResourcesQuery = { isDeleted: false };
    let deletedResourcesQuery = { isDeleted: true };
    let usersQuery = {};

    // Branch-scope filtering for admin_faculty
    if (isAdminFaculty && userBranch) {
      activeResourcesQuery.targetBranch = userBranch;
      deletedResourcesQuery.targetBranch = userBranch;
      usersQuery = {
        $and: [
          { role: { $in: ['student', 'cr', 'faculty', 'admin_faculty'] } },
          { 'profile.branch': userBranch }
        ]
      };
    }

    const filteredUsers = await User.find(usersQuery).lean();
    const activeResources = await Resource.find(activeResourcesQuery).lean();
    const deletedCount = await Resource.countDocuments(deletedResourcesQuery);
    const taxonomy = await Department.findOne({}).lean() || { branches: [] };

    const branchNames = {};
    (taxonomy.branches || []).forEach(b => { branchNames[b.id] = b.shortName || b.name; });

    // Chart Data calculations
    const uploadsByBranch = {};
    const uploadsByMonth = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    activeResources.forEach(r => {
      // By branch
      const bName = branchNames[r.targetBranch] || r.targetBranch;
      uploadsByBranch[bName] = (uploadsByBranch[bName] || 0) + 1;
      
      // By month
      const d = new Date(r.createdAt || new Date());
      const mKey = `${months[d.getMonth()]} ${d.getFullYear()}`;
      uploadsByMonth[mKey] = (uploadsByMonth[mKey] || 0) + 1;
    });

    const chartData = {
      byBranch: Object.keys(uploadsByBranch).map(k => ({ name: k, count: uploadsByBranch[k] })),
      byMonth: Object.keys(uploadsByMonth).map(k => ({ name: k, count: uploadsByMonth[k] }))
    };
    
    res.json({
      totalUsers: filteredUsers.length,
      students: filteredUsers.filter(u => u.role === 'student' || u.role === 'cr').length,
      facultys: filteredUsers.filter(u => u.role === 'faculty' || u.role === 'admin_faculty').length,
      admins: filteredUsers.filter(u => u.role === 'admin').length,
      totalResources: activeResources.length,
      deletedResources: deletedCount,
      totalBranches: isAdminFaculty ? 1 : (taxonomy.branches || []).length,
      recentResources: activeResources.slice(-5).reverse(),
      chartData
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// PUSH NOTIFICATION SUBSCRIPTION
// ============================================================
router.post('/subscribe', authenticate, async (req, res) => {
  try {
    await Subscription.create({
      ...req.body,
      userId: req.user.id,
      userProfile: req.user.profile,
      createdAt: new Date().toISOString()
    });
    res.status(201).json({ success: true });
  } catch (err) {
    console.error('Subscribe error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/student/faculty - Get all faculty members that teach the current student
router.get('/student/faculty', authenticate, requireRole('student', 'cr'), async (req, res) => {
  try {
    const studentProfile = req.user.profile || {};
    
    // Create a subject map for quick lookup
    const subjectMap = {};
    const taxonomy = await Department.findOne({}).lean() || { branches: [] };
    const branches = Array.isArray(taxonomy) ? taxonomy : (taxonomy.branches || []);
    branches.forEach(branch => {
      branch.years?.forEach(year => {
        year.semesters?.forEach(sem => {
          sem.subjects?.forEach(sub => {
            subjectMap[sub.id] = sub.name + (sub.type === 'lab' ? ' (Lab)' : '');
          });
        });
      });
    });
    
    // Filter users who are faculty or admin_faculty
    const faculties = await User.find({ role: { $in: ['faculty', 'admin_faculty'] } }).lean();
    
    // Query resources matching this student
    const resources = await Resource.find({
      isDeleted: false,
      targetBranch: studentProfile.branch,
      targetYear: studentProfile.year,
      targetSemester: studentProfile.semester,
      targetSection: { $in: [studentProfile.section, 'ALL'] }
    }).lean();

    // Find those who teach this student OR have uploaded a resource for this student
    const myFaculties = faculties.filter(f => {
      const assignments = f.profile?.assignments || [];
      let isAssigned = false;
      
      // Check explicit assignment
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
      
      // If not assigned explicitly, check if they uploaded ANY resource targeting this student
      if (!isAssigned) {
        isAssigned = resources.some(r => r.uploadedBy === f.id);
      }
      
      return isAssigned;
    });
    
    // Return safe data and recent post
    const safeFaculties = myFaculties.map(f => {
      // Find resources uploaded by this faculty for this student
      const fResources = resources.filter(r => r.uploadedBy === f.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      const recentResource = fResources.length > 0 ? fResources[0] : null;

      // Find the specific assignment that matched this student
      const assignments = f.profile?.assignments || [];
      let explicitSubjectName = null;
      
      const matchedAssignment = assignments.find(a => 
        a.branch === studentProfile.branch &&
        a.year === studentProfile.year &&
        a.semester === studentProfile.semester &&
        (a.section === 'ALL' || a.section === studentProfile.section)
      );

      if (matchedAssignment && matchedAssignment.subjectId) {
        explicitSubjectName = subjectMap[matchedAssignment.subjectId] || null;
      }

      return {
        id: f.id,
        name: f.name || f.username || 'Faculty',
        username: f.username,
        role: f.role,
        profile: {
          department: studentProfile.branch || f.profile?.department || f.profile?.branch || ''
        },
        explicitSubjectName,
        recentPost: recentResource ? {
          id: recentResource.id,
          title: recentResource.title,
          type: recentResource.type,
          subjectName: subjectMap[recentResource.subjectId] || 'General Subject',
          createdAt: recentResource.createdAt
        } : null
      };
    });
    
    res.json(safeFaculties);
  } catch (err) {
    console.error('Get student faculty error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
