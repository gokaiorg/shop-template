import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

const pid = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const dbId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID;
const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;

export const firebaseConfig = {
  apiKey: apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || (pid ? `${pid}.firebaseapp.com` : undefined),
  projectId: pid,
  storageBucket: storageBucket || (pid ? `${pid}.firebasestorage.app` : undefined),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Guard initialization: prevent invalid client crash if NEXT_PUBLIC_FIREBASE_API_KEY is missing
const isConfigured = Boolean(apiKey && apiKey.trim() !== "");

let appInstance: FirebaseApp | null = null;
if (getApps().length > 0) {
  appInstance = getApp();
} else if (isConfigured) {
  appInstance = initializeApp(firebaseConfig);
}

export const auth: Auth | null = appInstance && isConfigured ? getAuth(appInstance) : null;
export const db: Firestore | null = appInstance
  ? ((dbId && dbId !== "(default)" && dbId !== "") ? getFirestore(appInstance, dbId) : getFirestore(appInstance))
  : null;
export const storage: FirebaseStorage | null = appInstance
  ? getStorage(
      appInstance, 
      storageBucket ? (storageBucket.startsWith("gs://") ? storageBucket : `gs://${storageBucket}`) : undefined
    )
  : null;

export default appInstance;
