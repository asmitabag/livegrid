import { initializeApp, getApp, getApps, type FirebaseApp } from "firebase/app";

type FirebasePublicConfig = Readonly<{
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  storageBucket?: string;
  messagingSenderId?: string;
}>;

function getFirebasePublicConfig(): FirebasePublicConfig {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

  if (!apiKey || !authDomain || !projectId || !appId) {
    throw new Error(
      "Missing Firebase env vars. Set NEXT_PUBLIC_FIREBASE_* in .env.local."
    );
  }

  return {
    apiKey,
    authDomain,
    projectId,
    appId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
  };
}

/**
 * Client-safe Firebase app getter.
 * Call this from client components or client-only modules.
 */
export function getFirebaseApp(): FirebaseApp {
  const config = getFirebasePublicConfig();
  if (getApps().length > 0) return getApp();
  return initializeApp(config);
}