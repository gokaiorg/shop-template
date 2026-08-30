import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';

const targetProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
let projectId = targetProjectId;
let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Check local service account file as fallback for development
if (!clientEmail || !privateKey) {
  try {
    const cwd = process.cwd();
    const files = fs.readdirSync(cwd);
    const saFiles = files.filter(f => f.includes('firebase-adminsdk') && f.endsWith('.json'));

    // Prefer service account file matching active projectId
    let targetSaFile = saFiles.find(f => targetProjectId && f.startsWith(targetProjectId));
    if (!targetSaFile && saFiles.length > 0) {
      targetSaFile = saFiles[0];
    }

    if (targetSaFile) {
      const saPath = path.join(cwd, targetSaFile);
      const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
      projectId = targetProjectId || sa.project_id;
      clientEmail = sa.client_email;
      privateKey = sa.private_key ? sa.private_key.replace(/\\n/g, '\n') : sa.private_key;
    }
  } catch {
    // ignore
  }
}

let app: App;

if (getApps().length === 0) {
  if (clientEmail && privateKey) {
    app = initializeApp({
      projectId: targetProjectId || projectId,
      credential: cert({
        projectId: targetProjectId || projectId,
        clientEmail,
        privateKey,
      }),
    });
  } else if (targetProjectId) {
    console.warn("Firebase Admin service account credentials missing, initializing with target projectId:", targetProjectId);
    app = initializeApp({
      projectId: targetProjectId,
    });
  } else {
    console.warn("Firebase Admin environment variables are missing.");
    app = initializeApp();
  }
} else {
  app = getApps()[0];
}

const rawDbId = process.env.FIREBASE_DATABASE_ID || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID;
export const adminDb = rawDbId && rawDbId !== "(default)" ? getFirestore(app, rawDbId) : getFirestore(app);
export const adminAuth = getAuth(app);
export const adminStorage = getStorage(app);
