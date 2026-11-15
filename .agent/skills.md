# 🛠️ Agent Skills

This document summarizes the custom skills installed to enhance the development and deployment workflow of the Shop Template.

## 📦 Installed Skills

### 1. **git-ops-workflows**
- **Purpose**: Standard opérationnel principal pour les tâches Git (`ST-Sync`, `ST-Upgrade`, `Deploy-[Brand]`, `Run-[Brand]`), la synchronisation Firestore (`Sync-[Brand]` / `Sync-Firestore`) et les règles de gouvernance des branches.
- **Location**: `.agent/skills/git-ops-workflows/SKILL.md`
- **Key Capability**: Automated Git/Ops Workflows (`ST-Sync`, `ST-Upgrade`), Firestore Sync (`Sync-[Brand]`), Branch Governance & Zero Browser Rule.

### 2. **multi-brand-config**
- **Purpose**: Gérer les 4 marques actives (`shop-template`, `art-fate`, `gokai-labs`, `green-ghost`), leurs fichiers `.env.[brand]`, les scripts `@package.json` (`dev:*`, `build:*`, `db:index:*`, `deploy:proxy:*`), les Feature Flags (`NEXT_PUBLIC_ENABLE_CART`, `NEXT_PUBLIC_SUPPORTED_LOCALES`, `NEXT_PUBLIC_DEFAULT_LOCALE`, `NEXT_PUBLIC_FIREBASE_DATABASE_ID`) et le proxy Firebase Hosting vers Cloud Run (`europe-west1`).
- **Location**: `.agent/skills/multi-brand-config/SKILL.md`
- **Trigger**: Création/modification de configuration de marque, ajout de variables d'environnement ou Feature Flags, exécution de builds/déploiements par marque ou configuration du proxy Firebase Hosting.

### 3. **firestore-schema-i18n**
- **Purpose**: Garantir l'accès Firestore exclusivement côté serveur via `firebase-admin`, la gestion bilingue `{ en, fr }` + rétrocompatibilité legacy via `getLocalizedField()`, la validation stricte Zod (`@src/schemas/admin.ts`, `@src/schemas/settings.ts`), le support multi-catégories (`categoryIds: string[]`), le nettoyage Storage (`products/`, `branding/`) et la déclaration des index composés dans `firestore.indexes.json`.
- **Location**: `.agent/skills/firestore-schema-i18n/SKILL.md`
- **Trigger**: Modification de schémas Zod, requêtes/mutations Firestore, gestion des champs traduits i18n, suppression d'entités avec médias Firebase Storage ou ajout d'index Firestore.

### 4. **stripe-checkout-security**
- **Purpose**: Appliquer la sécurité Anti-IDOR lors du checkout (`@src/actions/checkout.ts`, `POST /api/checkout`), la conversion monétaire via `toStripeUnitAmount()`, la validation stricte `Stripe-Signature` dans `@src/app/api/webhooks/stripe/route.ts` pour le passage au statut `PAID`, et l'invalidation ISR via `/api/revalidate` (`REVALIDATION_SECRET`).
- **Location**: `.agent/skills/stripe-checkout-security/SKILL.md`
- **Trigger**: Intervention sur le panier, la Server Action de checkout, les routes API Stripe/webhooks, le calcul des prix/devises ou la revalidation du cache ISR.

### 5. **firebase-admin**
- **Purpose**: Manage Firestore/Auth/Backups.
- **Location**: `.agent/skills/firebase-admin/`
- **Key Capability**: Firestore Syncing & Auth Management.

### 6. **gcp-cloud-run**
- **Purpose**: Automate GCP Deployments.
- **Location**: `.agent/skills/gcp-cloud-run/`
- **Key Capability**: Cloud Build Triggers & Env Management.

### 7. **seo-fundamentals**
- **Purpose**: Optimize for Search & SEO.
- **Location**: `.agent/skills/seo-fundamentals/`
- **Key Capability**: Metadata Validation & Sitemap Automation.

### 8. **nextjs-best-practices**
- **Purpose**: Maintain High Code Standards.
- **Location**: `.agent/skills/nextjs-best-practices/`
- **Key Capability**: Next.js 14+ Architecture & App Router usage.

---
*Last Updated: 2026-11-15*
