import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

export interface BrandFirebaseConfig {
  projectId: string;
  apiKey: string;
  authDomain: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  databaseId?: string;
}

export const BRAND_FIREBASE_FALLBACKS: Record<string, BrandFirebaseConfig> = {
  "green-ghost": {
    projectId: "green-ghost-shop",
    apiKey: "AIzaSyDg70sN0KqCUcJ5FJ5kyTprkqLX4wMiGD4",
    authDomain: "green-ghost-shop.firebaseapp.com",
    storageBucket: "green-ghost-shop.firebasestorage.app",
    messagingSenderId: "708169983463",
    appId: "1:708169983463:web:42f199339b93431013c942",
    databaseId: "(default)",
  },
  "art-fate": {
    projectId: "art-fate-database",
    apiKey: "AIzaSyBrj75bA4p69BkWBPvf0LVHet4lUlnIksQ",
    authDomain: "art-fate-database.firebaseapp.com",
    storageBucket: "art-fate-database.firebasestorage.app",
    messagingSenderId: "1096001162659",
    appId: "1:1096001162659:web:16e25799e29eecb7a19e16",
    databaseId: "(default)",
  },
  "gokai-labs": {
    projectId: "gokai-labs",
    apiKey: "AIzaSyA-2smj-SzlYnAVATvhV1CHp4oGsd_Yk9Q",
    authDomain: "gokai-labs.firebaseapp.com",
    storageBucket: "gokai-labs.firebasestorage.app",
    messagingSenderId: "854258707755",
    appId: "1:854258707755:web:c67a8029361495330ce96e",
    databaseId: "(default)",
  },
  "shop-template": {
    projectId: "shop-gcp",
    apiKey: "AIzaSyCpVhQhTrsa1a_ceNjLLKIgVRzKkzUZc5Y",
    authDomain: "shop-gcp.firebaseapp.com",
    storageBucket: "shop-gcp.firebasestorage.app",
    messagingSenderId: "405562610523",
    appId: "1:405562610523:web:9600d452a0867f80ee807e",
    databaseId: "shop-template-database",
  },
};

function resolveBrandFallback(): BrandFirebaseConfig | null {
  // 1. Try detecting brand from process.env.NEXT_PUBLIC_BRAND
  const brandEnv = process.env.NEXT_PUBLIC_BRAND?.trim().toLowerCase();
  if (brandEnv && BRAND_FIREBASE_FALLBACKS[brandEnv]) {
    return BRAND_FIREBASE_FALLBACKS[brandEnv];
  }

  // 2. Try detecting from process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const pidEnv = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim().toLowerCase();
  if (pidEnv) {
    if (pidEnv.includes("green-ghost")) return BRAND_FIREBASE_FALLBACKS["green-ghost"];
    if (pidEnv.includes("art-fate")) return BRAND_FIREBASE_FALLBACKS["art-fate"];
    if (pidEnv.includes("gokai-labs")) return BRAND_FIREBASE_FALLBACKS["gokai-labs"];
    if (pidEnv.includes("shop-gcp") || pidEnv.includes("shop-template")) return BRAND_FIREBASE_FALLBACKS["shop-template"];
  }

  // 3. In the browser, detect from window.location.hostname
  if (typeof window !== "undefined") {
    const host = window.location.hostname.toLowerCase();
    if (host.includes("green-ghost")) return BRAND_FIREBASE_FALLBACKS["green-ghost"];
    if (host.includes("art-fate")) return BRAND_FIREBASE_FALLBACKS["art-fate"];
    if (host.includes("gokai-labs")) return BRAND_FIREBASE_FALLBACKS["gokai-labs"];
  }

  return BRAND_FIREBASE_FALLBACKS["shop-template"];
}

const fallback = resolveBrandFallback();

const envPid = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim();
const pid = envPid && envPid !== "" ? envPid : fallback?.projectId;

const envApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim();
const apiKey = envApiKey && envApiKey !== "" ? envApiKey : fallback?.apiKey;

const envDbId = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID?.trim();
const dbId = envDbId && envDbId !== "" ? envDbId : fallback?.databaseId;

const envStorageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim();
const storageBucket = envStorageBucket && envStorageBucket !== "" ? envStorageBucket : fallback?.storageBucket;

const envAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim();
const authDomain = envAuthDomain && envAuthDomain !== ""
  ? envAuthDomain
  : (fallback?.authDomain || (pid ? `${pid}.firebaseapp.com` : undefined));

const envSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim();
const messagingSenderId = envSenderId && envSenderId !== "" ? envSenderId : fallback?.messagingSenderId;

const envAppId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim();
const appId = envAppId && envAppId !== "" ? envAppId : fallback?.appId;

export const firebaseConfig = {
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: pid,
  storageBucket: storageBucket || (pid ? `${pid}.firebasestorage.app` : undefined),
  messagingSenderId: messagingSenderId,
  appId: appId,
};

// Guard initialization: prevent invalid client crash if apiKey is missing
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
