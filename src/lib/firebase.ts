/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Setup highly robust default configuration values from our stable Firebase workspace
const defaultFirebaseConfig = {
  projectId: "gen-lang-client-0242058740",
  appId: "1:726755390769:web:a39be658babd76535cec10",
  apiKey: "AIzaSyAmol3J0XborjntV8g-axFnZzc7m63lXBA",
  authDomain: "gen-lang-client-0242058740.firebaseapp.com",
  firestoreDatabaseId: "ai-studio-940ee2eb-eba9-4b19-a623-7185c5a75909",
  storageBucket: "gen-lang-client-0242058740.firebasestorage.app",
  messagingSenderId: "726755390769",
  measurementId: ""
};

// Check environment variables first, falling back to the standard workspace configurations
const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
  appId: metaEnv.VITE_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
  firestoreDatabaseId: metaEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID || defaultFirebaseConfig.firestoreDatabaseId,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive.readonly');

export const signIn = () => signInWithPopup(auth, googleProvider);
export const signOut = () => auth.signOut();
