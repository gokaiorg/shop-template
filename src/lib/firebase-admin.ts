import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { getStorage } from 'firebase-admin/storage';
import fs from 'fs';
import path from 'path';

let projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Local service account fallback for local development
if (!clientEmail || !privateKey || !projectId) {
  try {
    const cwd = process.cwd();
    const files = fs.readdirSync(cwd);
    const saFiles = files.filter(f => f.includes('firebase-adminsdk') && f.endsWith('.json'));

    let targetSaFile = saFiles.find(f => projectId && f.startsWith(projectId));
    if (!targetSaFile && saFiles.length > 0) {
      targetSaFile = saFiles[0];
    }

    if (targetSaFile) {
      const saPath = path.join(cwd, targetSaFile);
      const sa = JSON.parse(fs.readFileSync(saPath, 'utf8'));
      projectId = projectId || sa.project_id || sa.projectId;
      clientEmail = clientEmail || sa.client_email || sa.clientEmail;
      if (!privateKey && (sa.private_key || sa.privateKey)) {
        privateKey = (sa.private_key || sa.privateKey)?.replace(/\\n/g, '\n');
      }
    }
  } catch {
    // ignore
  }
}

let app: App;

if (getApps().length === 0) {
  const hasCompleteCredentials = Boolean(
    projectId &&
    clientEmail &&
    privateKey &&
    projectId.trim() !== '' &&
    clientEmail.trim() !== '' &&
    privateKey.trim() !== ''
  );

  if (hasCompleteCredentials) {
    app = initializeApp({
      projectId,
      credential: cert({
        projectId: projectId!,
        clientEmail: clientEmail!,
        privateKey: privateKey!,
      }),
    });
  } else if (projectId && projectId.trim() !== '') {
    app = initializeApp({
      projectId,
    });
  } else {
    app = initializeApp();
  }
} else {
  app = getApps()[0];
}

const brand = (process.env.BRAND || process.env.NEXT_PUBLIC_BRAND || "").toLowerCase().trim();
const defaultDbForProject = 
  projectId === "shop-gcp" || brand === "shop-template" ? "shop-template-database" :
  projectId === "green-ghost-gcp" || brand === "green-ghost" ? "green-ghost-database" :
  projectId === "gokai-labs-gcp" || brand === "gokai-labs" ? "gokai-labs-database" :
  undefined;

const rawDbId = process.env.FIREBASE_DATABASE_ID || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID || defaultDbForProject;
export const adminDb = !rawDbId || rawDbId === "(default)" || rawDbId.trim() === ""
  ? getFirestore(app)
  : getFirestore(app, rawDbId);

export const adminAuth = getAuth(app);
export const adminStorage = getStorage(app);
