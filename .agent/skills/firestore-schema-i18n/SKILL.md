---
name: firestore-schema-i18n
description: Enforce Firestore server-only access via firebase-admin, bilingual data structures ({ en, fr } + legacy fallbacks), Zod validation schemas, multi-category product arrays, Storage cleanup, and composite indexes.
---

## Overview
Governs Firestore data access, bilingual (`i18n`) field resolution, Zod schema validation, Firebase Storage lifecycle cleanup, and composite index declarations.

## Server-Only Firestore Access
- Client-side Firestore access is strictly locked down in `firestore.rules`.
- All reads and mutations MUST execute server-side (Server Components, Server Actions, Route Handlers, or CLI scripts) using `adminDb` from `@/lib/firebase-admin` (`firebase-admin` SDK).

## Bilingual Data Model & Legacy Compatibility
- Localized fields in `src/types/database.ts`, `src/schemas/admin.ts`, and `src/schemas/settings.ts` use `Record<string, string>` maps (`{ en: string, fr: string }`).
- Always resolve localized values using `getLocalizedField()` from `@/lib/i18n` with fallback support for legacy flat fields:
  - **Products & Categories (`Product`, `Category`)**: `name`, `slug`, `description`, `intro`, `status` + legacy `nameEn`/`nameFr`, `slugEn`/`slugFr`, `descriptionEn`/`descriptionFr`, `introEn`/`introFr`, `statusEn`/`statusFr`.
  - **CMS Pages (`Page`, `pageSchema`)**: `slug`, `title`, `subtitle`, `content`, `metaTitle`, `metaDescription` + legacy `slug_en`/`slug_fr`, `title_en`/`title_fr`, `subtitle_en`/`subtitle_fr`, `content_en`/`content_fr`, `meta_title_en`/`meta_title_fr`, `meta_description_en`/`meta_description_fr`.

## Strict Zod Validation (`src/schemas/admin.ts` & `src/schemas/settings.ts`)
- Validate all inputs with Zod before writing to Firestore:
  - `categorySchema`: Validates `name`, `slug`, `intro`, `description`, `status` (`"draft" | "published"`), `imageUrl`, `order`, `showInHeader`, `enableProductZoom`, `hideSoldOutByDefault`.
  - `productSchema`: Enforces multi-category assignment via `categoryIds: z.array(z.string()).min(1)` (with optional legacy `categoryId`), `price`, `hidePrice`, `stock`, `images`, `order`, and flexible `metadata: z.record(z.string(), customFieldValueSchema)`.
  - `pageSchema`: Enforces non-empty `slug` and `title` in at least one locale, `activeBlocks`, cover/banner images, and legacy field compatibility.
  - `storeSettingsSchema` (`globalSettingsSchema.merge(catalogSettingsSchema)`): Validates global branding, localized hero/catalog/footer strings, `primaryColor` hex format, `borderStyle`, `productImageRatio`, and section blocks (`aboutSectionSchema`, `contactSectionSchema`, `faqSectionSchema`, `reviewSectionSchema`).
  - `contactMessageSchema`: Validates contact submissions including anti-spam honeypot fields (`website_url`, `confirm_email`, `honeypot`, `timestamp`).

## Firebase Storage Cleanup Rule
- When deleting entities (Products, Categories, Pages, or Branding assets) in Server Actions, automatically delete associated files stored in Firebase Storage under `products/` and `branding/` to prevent orphaned assets.

## Composite Indexes (`firestore.indexes.json`)
- Every new Firestore query combining `where()` / `array-contains` filters with `orderBy()` MUST have its corresponding composite index declared in `firestore.indexes.json` and deployed via `pnpm db:index:st` or `pnpm db:index:af`.
