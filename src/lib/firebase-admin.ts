import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import fs from 'fs';
import path from 'path';

let projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Check local service account file as fallback for development
if (!clientEmail || !privateKey) {
  const localSaPath = path.join(process.cwd(), 'shop-gcp-firebase-adminsdk-fbsvc-5aba76333b.json');
  if (fs.existsSync(localSaPath)) {
    try {
      const sa = JSON.parse(fs.readFileSync(localSaPath, 'utf8'));
      projectId = projectId || sa.project_id;
      clientEmail = sa.client_email;
      privateKey = sa.private_key;
    } catch {
      // ignore parsing errors
    }
  }
}

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

const databaseId = process.env.FIREBASE_DATABASE_ID || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || "shop-template-database";

export const adminDb = getFirestore(app, databaseId);
export const adminAuth = getAuth(app);
