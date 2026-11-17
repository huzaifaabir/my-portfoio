import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// Values come from client/.env. Nothing is hardcoded here.
const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// The app still builds and the public site still works when these are empty.
// Only the admin login needs them.
export const firebaseReady = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);

export const app = firebaseReady ? (getApps()[0] || initializeApp(config)) : null;
export const auth = app ? getAuth(app) : null;
