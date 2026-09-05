// Firebase client configuration for Google Sign-In.
// Configure via Vite env vars in client/.env:
//   VITE_FIREBASE_API_KEY=...
//   VITE_FIREBASE_AUTH_DOMAIN=yourproject.firebaseapp.com
//   VITE_FIREBASE_PROJECT_ID=yourproject
//   VITE_FIREBASE_APP_ID=...
//
// If env vars are not set, the Google Sign-In button shows a friendly
// "not configured" message instead of crashing.

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let auth = null;
let googleProvider = null;

if (firebaseEnabled) {
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
}

/**
 * Triggers the Firebase Google Sign-In popup and returns the ID token.
 * @returns {Promise<string>} Firebase ID token
 */
export async function signInWithGoogle() {
  if (!firebaseEnabled) {
    throw new Error('Google Sign-In is not configured. Ask the admin to set up Firebase credentials.');
  }
  const result = await signInWithPopup(auth, googleProvider);
  const idToken = await result.user.getIdToken();
  return idToken;
}
