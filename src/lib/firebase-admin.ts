import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

let app: App;

if (getApps().length === 0) {
  if (!projectId || !clientEmail || !privateKey) {
    console.warn("Firebase Admin environment variables are missing.");
    app = initializeApp(); 
  } else {
    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }
} else {
  app = getApps()[0];
}

export const adminDb = getFirestore(app, "shop-template-database");
export const adminAuth = getAuth(app);
