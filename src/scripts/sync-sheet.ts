/**
 * src/scripts/sync-sheet.ts
 *
 * Script de synchronisation du catalogue produits depuis Google Sheets vers Firestore.
 * Conçu pour Green Ghost (green-ghost-shop) avec compatibilité multi-marques.
 *
 * Usage :
 *   pnpm tsx --env-file=.env.gg src/scripts/sync-sheet.ts --dry-run
 *   pnpm tsx --env-file=.env.gg src/scripts/sync-sheet.ts
 */

import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// ============================================================================
// 1. Configuration & Chargement des Variables d'Environnement
// ============================================================================

// Si les variables ne sont pas déjà injectées (ex: via CLI), charger depuis .env.gg ou .env.local
if (!process.env.FIREBASE_CLIENT_EMAIL || !process.env.FIREBASE_PRIVATE_KEY) {
  const envFile = process.env.ENV_FILE || (fs.existsSync('.env.gg') ? '.env.gg' : '.env.local');
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: path.resolve(process.cwd(), envFile) });
  }
}

const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;
const privateKey = rawPrivateKey?.replace(/\\n/g, '\n');
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'green-ghost-shop';
const rawDbId = process.env.FIREBASE_DATABASE_ID || process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID;
const sheetId = process.env.GOOGLE_SHEET_ID;
const sheetName = process.env.GOOGLE_SHEET_NAME || 'products';

// Arguments CLI
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run') || args.includes('-d');

if (!clientEmail || !privateKey) {
  console.error('❌ Erreur : FIREBASE_CLIENT_EMAIL et FIREBASE_PRIVATE_KEY doivent être définis.');
  process.exit(1);
}

if (!sheetId) {
  console.error('❌ Erreur : La variable GOOGLE_SHEET_ID est manquante dans l\'environnement.');
  process.exit(1);
}

// ============================================================================
// 2. Initialisation Unifiée (firebase-admin + google.auth.JWT)
// ============================================================================

// A. Initialisation Firebase Admin SDK
const app = getApps().length === 0
  ? initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    })
  : getApps()[0];

const db = !rawDbId || rawDbId === '(default)' || rawDbId.trim() === ''
  ? getFirestore(app)
  : getFirestore(app, rawDbId);

// B. Client JWT Google Sheets API
const auth = new google.auth.JWT({
  email: clientEmail,
  key: privateKey,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

// ============================================================================
// 3. Utilitaires de Slugification et Normalisation
// ============================================================================

/**
 * Génère un slug normalisé (identique à src/lib/slug.ts)
 */
function slugify(text?: string | null): string {
  if (!text) return '';
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

/**
 * Convertit une valeur de stock en nombre flottant (accepte décimales ex: 49.7, virgules)
 */
function parseStock(raw: unknown): number {
  if (typeof raw === 'number' && !isNaN(raw)) {
    return Math.max(0, raw);
  }
  const str = String(raw || '0').trim().replace(',', '.');
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

/**
 * Convertit une valeur de prix en nombre flottant
 */
function parsePrice(raw: unknown): number {
  if (typeof raw === 'number' && !isNaN(raw)) {
    return Math.max(0, raw);
  }
  const str = String(raw || '0').trim().replace(',', '.');
  const parsed = parseFloat(str);
  return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

// Colonnes internes obsolètes à ne pas enregistrer dans metadata
const OBSOLETE_COLS = new Set([
  'originaltype',
  'karon_stock',
  'karon_entry',
  'wsp',
  'rawai_entry',
  'rawai_stock',
]);

// Colonnes traitées au premier niveau
const ROOT_COLS = new Set([
  'product',
  'name',
  'slug',
  'price',
  'stock',
  'rawai_stock',
  'status',
  'description_en',
  'description_fr',
  'seo_en',
  'seo_fr',
  'intro_en',
  'intro_fr',
  'effects_en',
  'effects_fr',
  'relieves_en',
  'relieves_fr',
  'thc',
  'cbd',
  'dominance',
  'type',
]);

// ============================================================================
// 4. Exécution Principale
// ============================================================================

async function main() {
  console.log('================================================================');
  console.log('🚀 Synchronisation Google Sheets -> Firestore');
  console.log(`📋 Google Sheet ID : ${sheetId}`);
  console.log(`📑 Feuille         : ${sheetName}`);
  console.log(`🔥 Projet Firebase : ${projectId}`);
  console.log(`⚙️  Mode            : ${isDryRun ? '🟡 DRY-RUN (Simulation)' : '🟢 LIVE (Écriture Firestore)'}`);
  console.log('================================================================\n');

  // 1. Lecture du Google Sheet
  console.log(`Début de la lecture du tableur (onglet "${sheetName}")...`);
  let sheetData;
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!A1:ZZ`,
    });
    sheetData = res.data.values;
  } catch (error: any) {
    console.error(`❌ Échec de lecture du Google Sheet :`, error?.message || error);
    process.exit(1);
  }

  if (!sheetData || sheetData.length < 2) {
    console.warn('⚠️ Aucun produit trouvé dans le tableur.');
    process.exit(0);
  }

  const rawHeaders = sheetData[0];
  const headers = rawHeaders.map((h: string) => (h || '').trim().toLowerCase());
  const rows = sheetData.slice(1);

  console.log(`✅ ${rows.length} lignes de données lues dans le Google Sheet.\n`);

  // 2. Indexation des produits existants dans Firestore (pour éviter les doublons d'IDs)
  console.log('⏳ Analyse des produits existants dans Firestore...');
  const productsSnap = await db.collection('products').get();
  
  const existingDocsByName = new Map<string, string>();
  const existingDocsBySlug = new Map<string, string>();
  const existingDocIds = new Set<string>();

  productsSnap.forEach(doc => {
    existingDocIds.add(doc.id);
    const data = doc.data();
    if (data.name?.en) existingDocsByName.set(data.name.en.toLowerCase().trim(), doc.id);
    if (data.nameEn) existingDocsByName.set(data.nameEn.toLowerCase().trim(), doc.id);
    if (data.slug?.en) existingDocsBySlug.set(data.slug.en.toLowerCase().trim(), doc.id);
    existingDocsBySlug.set(doc.id.toLowerCase().trim(), doc.id);
  });

  console.log(`ℹ️  ${productsSnap.size} produits déjà présents dans Firestore.\n`);

  // 3. Récupération des catégories pour assignation automatique aux nouveaux produits
  const categoriesSnap = await db.collection('categories').get();
  const categoryMapBySlug = new Map<string, string>();

  categoriesSnap.forEach(doc => {
    const catData = doc.data();
    const slugEn = catData.slug?.en || catData.slugEn || doc.id;
    categoryMapBySlug.set(slugEn.toLowerCase(), doc.id);
  });

  // 4. Transformation des Données (Mapping)
  console.log('🔄 Transformation des données en cours...');
  const preparedProducts: { docId: string; data: Record<string, any>; isNew: boolean }[] = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const rowValues = rows[idx];
    const row: Record<string, string> = {};
    headers.forEach((header: string, i: number) => {
      row[header] = (rowValues[i] !== undefined ? String(rowValues[i]) : '').trim();
    });

    const productName = row.product || row.name || row.name_en || '';
    if (!productName) continue; // Ignorer les lignes sans nom de produit

    // Résolution de l'ID du document (Slug)
    const baseSlug = slugify(row.slug || productName);
    const cleanName = productName.toLowerCase().trim();
    const matchedDocId = existingDocsByName.get(cleanName) || existingDocsBySlug.get(baseSlug);
    const docId = matchedDocId || baseSlug;
    const isNew = !existingDocIds.has(docId);

    // Localisation : Objets imbriqués { en: "...", fr: "..." }
    const name = {
      en: productName,
      fr: row.product_fr || row.name_fr || productName,
    };

    const slug = {
      en: docId,
      fr: row.slug_fr || docId,
    };

    const description = {
      en: row.description_en || row.description || '',
      fr: row.description_fr || row.description_en || row.description || '',
    };

    const seo = {
      en: row.seo_en || row.seo || '',
      fr: row.seo_fr || row.seo_en || row.seo || '',
    };

    const intro = {
      en: row.intro_en || row.intro || seo.en,
      fr: row.intro_fr || row.intro || seo.fr,
    };

    // Chiffres et Inventaire
    const price = parsePrice(row.price);
    const rawStockVal = row.rawai_stock !== undefined && row.rawai_stock !== ''
      ? row.rawai_stock
      : (row.stock !== undefined && row.stock !== '' ? row.stock : '0');
    const stock = parseStock(rawStockVal);

    // Statut
    const rawStatus = (row.status || '').toLowerCase();
    const isSoldOut = rawStatus.includes('sold out') || stock <= 0;
    const statusVal = isSoldOut ? 'draft' : 'published';
    const status = {
      en: statusVal,
      fr: statusVal,
    };

    // Métadonnées (effects, relieves, thc, cbd, dominance, type, etc.)
    const metadata: Record<string, any> = {};

    if (row.effects_en || row.effects_fr || row.effects) {
      metadata.effects = {
        en: row.effects_en || row.effects || '',
        fr: row.effects_fr || row.effects_en || row.effects || '',
      };
    }

    if (row.relieves_en || row.relieves_fr || row.relieves) {
      metadata.relieves = {
        en: row.relieves_en || row.relieves || '',
        fr: row.relieves_fr || row.relieves_en || row.relieves || '',
      };
    }

    if (row.thc !== undefined && row.thc !== '') {
      const parsedThc = parseFloat(row.thc.replace(',', '.'));
      metadata.thc = isNaN(parsedThc) ? row.thc : parsedThc;
    }

    if (row.cbd !== undefined && row.cbd !== '') {
      const parsedCbd = parseFloat(row.cbd.replace(',', '.'));
      metadata.cbd = isNaN(parsedCbd) ? row.cbd : parsedCbd;
    }

    if (row.dominance) {
      metadata.dominance = row.dominance;
    }

    if (row.type) {
      metadata.type = row.type;
    }

    // Capture des colonnes personnalisées supplémentaires éventuelles
    for (const [key, val] of Object.entries(row)) {
      const lowerKey = key.toLowerCase();
      if (!ROOT_COLS.has(lowerKey) && !OBSOLETE_COLS.has(lowerKey) && val !== '') {
        const numVal = parseFloat(val.replace(',', '.'));
        metadata[key] = !isNaN(numVal) && String(numVal) === val ? numVal : val;
      }
    }

    // Construction du document produit pour Firestore
    const data: Record<string, any> = {
      id: docId,
      name,
      slug,
      description,
      intro,
      seo,
      price,
      stock,
      status,
      metadata,
      // Champs plats hérités pour compatibilité ascendante
      nameEn: name.en,
      nameFr: name.fr,
      slugEn: slug.en,
      slugFr: slug.fr,
      descriptionEn: description.en,
      descriptionFr: description.fr,
      introEn: intro.en,
      introFr: intro.fr,
      statusEn: status.en,
      statusFr: status.fr,
      updatedAt: new Date(),
    };

    // Pour les NOUVEAUX produits uniquement : initialiser les champs gérés par l'admin
    if (isNew) {
      data.images = [];
      data.createdAt = new Date();
      data.hidePrice = false;
      data.order = Date.now() + idx;

      // Assignation intelligente de catégorie selon le 'type' du tableur
      let targetCategoryId = '';
      const typeLower = (row.type || '').toLowerCase();
      if (typeLower === 'strain') {
        targetCategoryId = categoryMapBySlug.get('buds') || '';
      } else if (typeLower === 'concentrate') {
        targetCategoryId = categoryMapBySlug.get('concentrates') || '';
      } else if (typeLower === 'gadget') {
        targetCategoryId = categoryMapBySlug.get('gadgets') || '';
      } else if (typeLower === 'edible' || typeLower === 'drink') {
        targetCategoryId = categoryMapBySlug.get('edibles') || '';
      }

      data.categoryIds = targetCategoryId ? [targetCategoryId] : [];
      if (targetCategoryId) {
        data.categoryId = targetCategoryId;
      }
    }

    preparedProducts.push({ docId, data, isNew });
  }

  console.log(`📦 ${preparedProducts.length} produits transformés avec succès.`);
  const newCount = preparedProducts.filter(p => p.isNew).length;
  const updateCount = preparedProducts.length - newCount;
  console.log(`   - Produits existants à mettre à jour : ${updateCount}`);
  console.log(`   - Nouveaux produits à créer         : ${newCount}\n`);

  // 5. Mode Dry-Run (Simulation)
  if (isDryRun) {
    console.log('================================================================');
    console.log('🟡 MODE DRY-RUN ACTIF : Aucune écriture n\'est effectuée dans Firestore.');
    console.log('================================================================\n');

    if (preparedProducts.length > 0) {
      console.log('Exemple de produit transformé (1er élément de la feuille) :');
      console.log(JSON.stringify(preparedProducts[0], null, 2));
      console.log('\n----------------------------------------------------------------');

      const sampleExisting = preparedProducts.find(p => !p.isNew);
      if (sampleExisting) {
        console.log('Exemple de produit EXISTANT mis à jour (champs admin préservés) :');
        console.log(JSON.stringify(sampleExisting, null, 2));
        console.log('----------------------------------------------------------------\n');
      }

      const sampleNew = preparedProducts.find(p => p.isNew);
      if (sampleNew) {
        console.log('Exemple de NOUVEAU produit à créer (avec defaults admin) :');
        console.log(JSON.stringify(sampleNew, null, 2));
        console.log('----------------------------------------------------------------\n');
      }
    }

    console.log(`Simulation terminée avec succès pour ${preparedProducts.length} produits.`);
    process.exit(0);
  }

  // 6. Opérations Firestore par Lots (WriteBatch avec pagination de 400 docs)
  const BATCH_SIZE = 400; // Limite Firestore : max 500 opérations par batch
  const totalBatches = Math.ceil(preparedProducts.length / BATCH_SIZE);

  console.log(`⏳ Début des écritures Firestore (${totalBatches} lot(s) à exécuter)...`);

  for (let i = 0; i < preparedProducts.length; i += BATCH_SIZE) {
    const chunk = preparedProducts.slice(i, i + BATCH_SIZE);
    const batch = db.batch();

    for (const item of chunk) {
      const docRef = db.collection('products').doc(item.docId);
      // Utilisation stricte de merge: true pour préserver les champs admin existants
      batch.set(docRef, item.data, { merge: true });
    }

    await batch.commit();
    const currentBatchNum = Math.floor(i / BATCH_SIZE) + 1;
    console.log(`  ✓ Lot ${currentBatchNum}/${totalBatches} validé (${chunk.length} produits)`);
  }

  console.log('\n================================================================');
  console.log(`🎉 Succès : ${preparedProducts.length} produits synchronisés avec succès dans Firestore !`);
  console.log('================================================================');

  // 7. Déclenchement de la Revalidation Next.js (On-demand ISR via layout)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://127.0.0.1:3000';
  const revalidateSecret = process.env.REVALIDATION_SECRET;

  const paths = ['/en/menu', '/fr/menu'];
  console.log(`\n🔄 Déclenchement de la revalidation du cache Next.js par layout (${paths.join(', ')})...`);

  if (!revalidateSecret) {
    console.warn('⚠️ Variable REVALIDATION_SECRET absente. Revalidation ignorée.');
  } else {
    try {
      const revalidateUrl = `${baseUrl.replace(/\/+$/, '')}/api/revalidate?secret=${encodeURIComponent(revalidateSecret)}`;
      const response = await fetch(revalidateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths }),
      });

      if (response.ok) {
        const resData = await response.json();
        console.log(`✅ Webhook de revalidation exécuté avec succès (layout purgé pour : ${paths.join(', ')}).`);
      } else {
        const errorText = await response.text();
        console.warn(`⚠️ Échec du webhook de revalidation (Statut ${response.status}) : ${errorText}`);
      }
    } catch (error: any) {
      console.warn(`⚠️ Impossible de joindre le serveur pour la revalidation : ${error?.message || error}`);
      console.log(`   (Note : Le serveur Next.js doit être démarré sur ${baseUrl} pour recevoir les requêtes de revalidation)`);
    }
  }

  console.log('\nOpération terminée avec succès.');
  process.exit(0);
}

main().catch((error) => {
  console.error('\n❌ Erreur fatale durant la synchronisation :', error);
  process.exit(1);
});
