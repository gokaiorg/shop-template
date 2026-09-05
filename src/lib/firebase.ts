import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const getClientFirebaseConfig = () => {
  let pid = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  let apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  let dbId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID;

  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    if (host.includes("art-fate")) {
      pid = pid || "art-fate-database";
      apiKey = apiKey || "AIzaSyBrj75bA4p69BkWBPvf0LVHet4lUlnIksQ";
      dbId = dbId || "(default)";
    } else if (host.includes("green-ghost")) {
      pid = pid || "green-ghost-gcp";
      dbId = dbId || "green-ghost-database";
    } else if (host.includes("gokai-labs")) {
      pid = pid || "gokai-labs-gcp";
      dbId = dbId || "gokai-labs-database";
    }
  }

  const finalProjectId = pid || "shop-gcp";
  const finalDbId = dbId || (finalProjectId === "shop-gcp" ? "shop-template-database" : undefined);

  return {
    firebaseConfig: {
      apiKey: apiKey || "AIzaSyFakeKeyForLocalDevPlaceholders",
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${finalProjectId}.firebaseapp.com`,
      projectId: finalProjectId,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef",
    },
    dbId: finalDbId,
  };
};

const { firebaseConfig, dbId } = getClientFirebaseConfig();

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = (dbId && dbId !== "(default)" && dbId !== "") 
  ? getFirestore(app, dbId) 
  : getFirestore(app);
export const storage = getStorage(app);
export default app;
