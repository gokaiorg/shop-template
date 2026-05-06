import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!projectId || !clientEmail || !privateKey) {
  console.error("Firebase Admin environment variables are missing.");
  process.exit(1);
}

const app = initializeApp({
  credential: cert({
    projectId,
    clientEmail,
    privateKey,
  }),
});

const db = getFirestore(app, "shop-template-database");

const pages = [
  {
    slug: 'about',
    title_en: 'About Us',
    title_fr: 'À propos de nous',
    content_en: '<h2>Our Story</h2><p>Welcome to our store. We provide the best products with <strong>premium quality</strong>.</p><ul><li>Quality first</li><li>Customer satisfaction</li></ul>',
    content_fr: '<h2>Notre Histoire</h2><p>Bienvenue dans notre boutique. Nous fournissons les meilleurs produits avec une <strong>qualité premium</strong>.</p><ul><li>La qualité avant tout</li><li>Satisfaction client</li></ul>',
    meta_title_en: 'About Us - Shop Template',
    meta_title_fr: 'À propos de nous - Shop Template',
    meta_description_en: 'Learn more about our mission and values.',
    meta_description_fr: 'Apprenez-en plus sur notre mission et nos valeurs.',
  },
  {
    slug: 'contact',
    title_en: 'Contact Us',
    title_fr: 'Contactez-nous',
    content_en: '<h2>Get in Touch</h2><p>If you have any questions, please feel free to <a href="mailto:support@example.com">email us</a>.</p>',
    content_fr: '<h2>Contactez-nous</h2><p>Si vous avez des questions, n\'hésitez pas à nous <a href="mailto:support@example.com">envoyer un email</a>.</p>',
    meta_title_en: 'Contact Us - Shop Template',
    meta_title_fr: 'Contactez-nous - Shop Template',
    meta_description_en: 'Get in touch with our support team.',
    meta_description_fr: 'Contactez notre équipe de support.',
  },
  {
    slug: 'mentions-legales',
    title_en: 'Legal Mentions',
    title_fr: 'Mentions Légales',
    content_en: '<h2>Legal Information</h2><p>This website is operated by Example Corp.</p>',
    content_fr: '<h2>Informations Légales</h2><p>Ce site est opéré par Example Corp.</p>',
    meta_title_en: 'Legal Mentions - Shop Template',
    meta_title_fr: 'Mentions Légales - Shop Template',
    meta_description_en: 'Legal information about our website.',
    meta_description_fr: 'Informations légales sur notre site.',
  },
  {
    slug: 'cgv',
    title_en: 'Terms & Conditions',
    title_fr: 'Conditions Générales de Vente',
    content_en: '<h2>Terms of Service</h2><p>By using our site, you agree to the following terms...</p>',
    content_fr: '<h2>Conditions Générales de Vente</h2><p>En utilisant notre site, vous acceptez les conditions suivantes...</p>',
    meta_title_en: 'Terms & Conditions - Shop Template',
    meta_title_fr: 'CGV - Shop Template',
    meta_description_en: 'Read our terms and conditions.',
    meta_description_fr: 'Lisez nos conditions générales de vente.',
  },
  {
    slug: 'privacy-policy',
    title_en: 'Privacy Policy',
    title_fr: 'Politique de Confidentialité',
    content_en: '<h2>Privacy</h2><p>We value your privacy. We do not sell your data.</p>',
    content_fr: '<h2>Confidentialité</h2><p>Nous respectons votre vie privée. Nous ne vendons pas vos données.</p>',
    meta_title_en: 'Privacy Policy - Shop Template',
    meta_title_fr: 'Politique de Confidentialité - Shop Template',
    meta_description_en: 'How we handle your data.',
    meta_description_fr: 'Comment nous traitons vos données.',
  },
  {
    slug: 'returns',
    title_en: 'Returns & Refunds',
    title_fr: 'Retours & Remboursements',
    content_en: '<h2>Returns</h2><p>You have 30 days to return your product.</p>',
    content_fr: '<h2>Retours</h2><p>Vous avez 30 jours pour retourner votre produit.</p>',
    meta_title_en: 'Returns & Refunds - Shop Template',
    meta_title_fr: 'Retours & Remboursements - Shop Template',
    meta_description_en: 'Our return policy.',
    meta_description_fr: 'Notre politique de retour.',
  },
];

async function seed() {
  console.log('Seeding pages...');
  const collectionRef = db.collection('pages');
  
  for (const page of pages) {
    const { slug, ...data } = page;
    await collectionRef.doc(slug).set({
      ...data,
      updatedAt: new Date(),
    });
    console.log(`Seeded page: ${slug}`);
  }
  
  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
