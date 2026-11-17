// Makes sure the permanent Super Admin exists in MongoDB. The Firebase account must already exist.
const { getAuth } = require('firebase-admin/auth');
const { getFirebaseApp, isFirebaseConfigured } = require('../config/firebase');
const User = require('../models/User');

async function ensureSuperAdmin() {
  const email = (process.env.SUPER_ADMIN_EMAIL || '').trim().toLowerCase();
  if (!email) {
    console.warn('SUPER_ADMIN_EMAIL is not set in server/.env. Skipping Super Admin setup.');
    return null;
  }
  if (!isFirebaseConfigured()) {
    console.warn('Firebase is not configured yet. Super Admin will be set up after you add Firebase credentials.');
    return null;
  }

  let fbUser;
  try {
    fbUser = await getAuth(getFirebaseApp()).getUserByEmail(email);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.warn(`No Firebase user found for ${email}. Create it in Firebase Console > Authentication first, then restart the server.`);
      return null;
    }
    throw err;
  }

  const user = await User.findOneAndUpdate(
    { firebaseUid: fbUser.uid },
    {
      $set: { email, role: 'superadmin', status: 'active', name: fbUser.displayName || 'Super Admin' },
      $setOnInsert: { firebaseUid: fbUser.uid, invitedBy: 'system' },
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  console.log(`Super Admin ready: ${user.email}`);
  return user;
}

module.exports = { ensureSuperAdmin };
