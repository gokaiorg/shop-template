---
name: multi-brand-config
description: Manage multi-brand configurations (shop-template, art-fate, gokai-labs, green-ghost), environment files (.env.[brand]), feature flags, package.json scripts, and Firebase Hosting to Cloud Run proxy rules.
---

## Overview
Defines the multi-brand architecture, environment isolation, build/dev scripts, feature flags, and Firebase Hosting proxy routing to Cloud Run (`europe-west1`).

## Active Brands & Environment Files
| Brand Key | Brand ID | Environment File | Dev Script | Build Script |
| :--- | :--- | :--- | :--- | :--- |
| `st` | `shop-template` | `.env.st` | `pnpm dev:st` | `pnpm build:st` |
| `af` | `art-fate` | `.env.af` | `pnpm dev:af` | `pnpm build:af` |
| `gl` | `gokai-labs` | `.env.gl` | `pnpm dev:gl` | `pnpm build:gl` |
| `gg` | `green-ghost` | `.env.gg` | `pnpm dev:gg` | `pnpm build:gg` |

## Package.json Operational Commands
- **Local Development (`127.0.0.1`)**:
  - `pnpm dev:st` (`env-cmd -f .env.st next dev -H 127.0.0.1`)
  - `pnpm dev:af` (`env-cmd -f .env.af next dev -H 127.0.0.1`)
  - `pnpm dev:gl` (`env-cmd -f .env.gl next dev -H 127.0.0.1`)
  - `pnpm dev:gg` (`env-cmd -f .env.gg next dev -H 127.0.0.1`)
- **Production Builds (`--max-old-space-size=4096`)**:
  - `pnpm build:st`
  - `pnpm build:af`
  - `pnpm build:gl`
  - `pnpm build:gg`
- **Firestore Index Deployment**:
  - `pnpm db:index:st` (`npx firebase-tools deploy --only firestore:shop-template-database --project shop-gcp`)
  - `pnpm db:index:af` (`npx firebase-tools deploy --only "firestore:(default)" --project art-fate-database`)
- **Firebase Hosting Proxy Deployment**:
  - `pnpm deploy:proxy:gl` (`firebase deploy --only hosting:gokai-labs --project gokai-labs`)
  - `pnpm deploy:proxy:af` (`firebase deploy --only hosting:art-fate --project art-fate-database`)
- **Google Sheet to Firestore Sync**:
  - `pnpm sync` / `pnpm sync:sheet:gg` (`tsx src/scripts/sync-sheet.ts`)
  - `pnpm sync:sheet:gg:dry` (`tsx src/scripts/sync-sheet.ts --dry-run`)

## Feature Flags & Environment Rules
- `NEXT_PUBLIC_ENABLE_CART`: Controls e-commerce cart, checkout (`src/actions/checkout.ts`), and Stripe webhook (`src/app/api/webhooks/stripe/route.ts`) availability via `getIsCartEnabled()`. When disabled, the instance runs in showcase/catalog mode (`cartEnabled?: boolean` in `StoreSettings` / `BrandConfig.features.cart`).
- `NEXT_PUBLIC_SUPPORTED_LOCALES`: Defines enabled locales for the brand instance (`supportedLocales?: string[]` in `BrandConfig`, e.g., `en,fr`).
- `NEXT_PUBLIC_DEFAULT_LOCALE`: Sets the fallback/default locale (`defaultLocale?: string` in `BrandConfig`).
- `NEXT_PUBLIC_FIREBASE_DATABASE_ID`: Selects the target Firestore database instance (e.g., `(default)` or named database `shop-template-database`).

## Brand Configuration Contract (`src/config/types.ts`)
Each brand conforms to `BrandConfig`:
- `identity` (`BrandIdentity`), `assets` (`BrandAssets` with fallback `DEFAULT_BRAND_ASSETS`), `theme` (`BrandTheme` with `productImageRatio: 'default' | 'square' | 'portrait'`).
- `navigation` (`BrandNavigation`), `seo` (`BrandSEO`), `contact` (`BrandContact`), `features` (`cart`, `search`, `reviews`), and `seedData` (`BrandSeedData`).

## Firebase Hosting Proxy to Cloud Run
- Firebase Hosting acts as a reverse proxy rewriting requests to the corresponding Cloud Run service deployed in `europe-west1`.
- Use `pnpm deploy:proxy:gl` or `pnpm deploy:proxy:af` when updating hosting proxy rules for `gokai-labs` or `art-fate`.
