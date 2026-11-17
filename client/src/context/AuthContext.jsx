import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth } from '../firebase.js';
import { staffApi } from '../lib/services.js';
import { ApiError } from '../lib/api.js';

const AuthContext = createContext(null);

// Friendly text for the Firebase error codes a user can actually hit
function loginErrorMessage(err) {
  switch (err?.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
    case 'auth/invalid-email':
      return 'Email or password is incorrect.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a few minutes and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection.';
    default:
      return err?.message || 'Login failed. Please try again.';
  }
}

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [me, setMe] = useState(null); // staff profile + permissions from the API
  const [meError, setMeError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return undefined;
    }
    return onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      if (user) {
        try {
          setMe(await staffApi.me());
          setMeError('');
        } catch (err) {
          setMe(null);
          setMeError(err instanceof ApiError ? err.message : 'Could not load your account.');
        }
      } else {
        setMe(null);
        setMeError('');
      }
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (email, password) => {
    if (!auth) throw new Error('Firebase is not configured. Add the VITE_FIREBASE_* values to client/.env.');
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (err) {
      throw new Error(loginErrorMessage(err));
    }
    try {
      const profile = await staffApi.me();
      setMe(profile);
      setMeError('');
      return profile;
    } catch (err) {
      // Signed in to Firebase, but this email is not a staff member in our database
      await signOut(auth);
      throw new Error(err instanceof ApiError && err.status === 403
        ? 'This account does not have admin access.'
        : err.message || 'Could not verify your account.');
    }
  }, []);

  const logout = useCallback(() => (auth ? signOut(auth) : Promise.resolve()), []);

  // Re-read the staff profile after the user changes their own details
  const refreshMe = useCallback(async () => {
    setMe(await staffApi.me());
  }, []);

  const resetPassword = useCallback((email) => {
    if (!auth) throw new Error('Firebase is not configured yet.');
    return sendPasswordResetEmail(auth, email.trim());
  }, []);

  const value = useMemo(() => ({
    firebaseUser,
    me,
    meError,
    loading,
    isStaff: Boolean(me),
    can: (permission) => Boolean(me?.permissions?.[permission]),
    login,
    logout,
    resetPassword,
    refreshMe,
  }), [firebaseUser, me, meError, loading, login, logout, resetPassword, refreshMe]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
