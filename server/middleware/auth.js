// Verifies the Firebase ID token, loads the matching User from MongoDB, and checks roles.
const { getAuth } = require('firebase-admin/auth');
const { getFirebaseApp, isFirebaseConfigured } = require('../config/firebase');
const User = require('../models/User');

// Higher number = more power. A user can only manage people with a LOWER rank than their own.
const RANK = { editor: 1, admin: 2, superadmin: 3 };

async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
    if (!token) return res.status(401).json({ message: 'Please log in to continue.' });

    if (!isFirebaseConfigured()) {
      return res.status(503).json({ message: 'Server authentication is not configured yet.' });
    }

    let decoded;
    try {
      decoded = await getAuth(getFirebaseApp()).verifyIdToken(token);
    } catch {
      return res.status(401).json({ message: 'Your session has expired. Please log in again.' });
    }

    const user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) return res.status(403).json({ message: 'This account does not have admin access.' });
    if (user.status !== 'active') return res.status(403).json({ message: 'This account has been disabled.' });

    req.user = user;
    req.firebase = decoded;
    next();
  } catch (err) {
    next(err);
  }
}

// Usage: requireRole('editor') allows editor, admin and superadmin
function requireRole(minRole) {
  return [
    requireAuth,
    (req, res, next) => {
      if (RANK[req.user.role] >= RANK[minRole]) return next();
      return res.status(403).json({ message: 'You do not have permission to do this.' });
    },
  ];
}

function hasRole(role, minRole) {
  return RANK[role] >= RANK[minRole];
}

module.exports = { requireAuth, requireRole, hasRole, RANK };
