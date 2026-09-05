import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "shop-gcp";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyFakeKeyForLocalDevPlaceholders",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || `${projectId}.firebaseapp.com`,
  projectId: projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abcdef",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const brand = (process.env.NEXT_PUBLIC_BRAND || "").toLowerCase().trim();
const defaultDbForProject = 
  projectId === "shop-gcp" || brand === "shop-template" ? "shop-template-database" :
  projectId === "green-ghost-gcp" || brand === "green-ghost" ? "green-ghost-database" :
  projectId === "gokai-labs-gcp" || brand === "gokai-labs" ? "gokai-labs-database" :
  undefined;

const dbId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || defaultDbForProject;

export const auth = getAuth(app);
export const db = (dbId && dbId !== "(default)" && dbId !== "") 
  ? getFirestore(app, dbId) 
  : getFirestore(app);
export const storage = getStorage(app);
export default app;
