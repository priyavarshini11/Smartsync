const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'smart-campus-secret-key-change-in-production';

/**
 * Verify JWT token and attach user to request.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ id: decoded.userId }, { passwordHash: 0, __v: 0 }).lean();
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

/**
 * Require a specific role (use after authenticate middleware).
 * admin_faculty is treated as 'admin' for all permission checks.
 * cr is treated as 'student' for all permission checks.
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    // Role aliasing: admin_faculty has full admin rights, cr has student rights
    const effectiveRole = req.user.role === 'admin_faculty' ? 'admin'
                        : req.user.role === 'cr'            ? 'student'
                        : req.user.role;
    if (!roles.includes(effectiveRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

/**
 * Sign a JWT token for a user.
 */
function signToken(userId) {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

module.exports = { authenticate, requireRole, signToken, JWT_SECRET };
