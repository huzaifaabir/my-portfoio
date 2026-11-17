const { initializeApp, getApps, cert } = require('firebase-admin/app');

// Builds credentials from env. Supports a full JSON string or the three individual values.
function credentialFromEnv() {
  const json = (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '').trim();
  if (json) {
    const account = JSON.parse(json);
    if (account.private_key) account.private_key = account.private_key.replace(/\\n/g, '\n');
    return cert(account);
  }
  const projectId = (process.env.FIREBASE_PROJECT_ID || '').trim();
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || '').trim();
  const privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim();
  if (!projectId || !clientEmail || !privateKey) return null;
  return cert({ projectId, clientEmail, privateKey });
}

function isFirebaseConfigured() {
  return Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.FIREBASE_PRIVATE_KEY) &&
    Boolean((process.env.FIREBASE_STORAGE_BUCKET || '').trim());
}

function getFirebaseApp() {
  if (getApps().length) return getApps()[0];
  const credential = credentialFromEnv();
  if (!credential) {
    throw Object.assign(new Error('Firebase Admin credentials are missing in server/.env'), { code: 'FIREBASE_CONFIG' });
  }
  return initializeApp({
    credential,
    storageBucket: (process.env.FIREBASE_STORAGE_BUCKET || '').trim() || undefined,
  });
}

module.exports = { getFirebaseApp, isFirebaseConfigured };
