# Shop Template — Multi-Brand Architecture & Deployment Guide

This repository hosts a Next.js e-commerce application designed to manage multiple brands (like Shop Template, Art Fate, Gokai Labs) from a single codebase. The behavior, design, and infrastructure of each brand are isolated via environment files and driven by *Feature Flags*.

## 1. Architecture and Feature Flags

The application adapts its features based on the loaded `.env` file (e.g., `.env.st` or `.env.gl`).

* **Brand Identifier:** `NEXT_PUBLIC_BRAND` (e.g., `shop-template`) defines the active context for the design and seed scripts.
* **Optional Cart System:** The `NEXT_PUBLIC_ENABLE_CART` variable (true/false) allows enabling or completely hiding the cart interface and "Add to cart" buttons, while keeping the price display intact.
* **Dynamic Multilingualism (i18n):** The language system is driven by `NEXT_PUBLIC_SUPPORTED_LOCALES` (e.g., `en,fr` or `en`) and `NEXT_PUBLIC_DEFAULT_LOCALE`. If a single language is configured, the routing ignores URL language prefixes, and the back-office automatically hides unnecessary translation input fields.
* **Multiple Categorization:** The product architecture uses a `categoryIds` array (instead of a strict one-to-one relationship), allowing a product to be assigned to multiple categories simultaneously from a `MultiSelect` interface in the admin panel.

---

## 2. Creating a New Brand from Scratch (GCP & Firebase)

Setting up a new brand requires creating an isolated infrastructure to ensure data and billing separation.

### Step A: Firebase & Google Cloud Infrastructure

1. From the [Firebase Console](https://console.firebase.google.com/), create a new project (e.g., `gokai-labs`). This automatically generates an associated Google Cloud Platform (GCP) project.
2. Add a **Web App** (`</>`) in the project settings to generate the `firebaseConfig` object.
3. In the **Build** menu, navigate to **Firestore Database** and explicitly click **Create Database**. Choose your hosting region (e.g., `europe-west1`) and start in Production Mode. *(Note: Failing to explicitly create the database will result in a `5 NOT_FOUND` server error).*
4. In the **Build** menu, enable **Storage** for hosting product images.
5. Go to **Project settings > Service accounts** and generate a new private key to obtain the server admin credentials (`client_email` and `private_key`).

### Step B: Local Environment Configuration

1. Duplicate the `.env.example` file to `.env.[brand-identifier]`.
2. Fill in the Firebase client variables (`NEXT_PUBLIC_FIREBASE_API_KEY`, `PROJECT_ID`, `STORAGE_BUCKET`, etc.) with the Web App keys.
3. Fill in the admin variables (`FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`) with the Service Account keys to allow the use of the Firebase Admin SDK (essential for SSR rendering).
   * ⚠️ **CRITICAL:** The `FIREBASE_PRIVATE_KEY` must be wrapped in **double quotes** to correctly parse the `\n` line breaks (e.g., `FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"`). If improperly formatted, the server will throw a `16 UNAUTHENTICATED` error.
4. Generate a new NextAuth secret using the command `npx auth secret` and add it to `AUTH_SECRET`.

### Step C: Firestore Rules, Indexes & Cache Cleanup

Because the application is strictly secured against client-side writes, you must deploy the security rules and indexes to your newly created Firestore database.

1. **Authenticate the CLI (without global install):**
   ```bash
   npx firebase-tools login
   ```

2. **Deploy Rules and Indexes:**
   ```bash
   npx firebase-tools deploy --only firestore --project [YOUR_PROJECT_ID]
   ```

3. **Clear Next.js Cache (If necessary):**
   If your development server was running before the Firestore database was created, it might cache a broken gRPC connection and keep throwing a `5 NOT_FOUND` error. To fix this:
   * Stop the server (Ctrl+C).
   * Run `rm -rf .next` in your terminal to delete the build cache.
   * Restart the server (`pnpm dev:[brand]`).

### Step D: Storage Configuration (CORS & Security)

By default, Firebase Storage blocks direct requests from a web browser (localhost) and secures read/write access.

1. **CORS Rules:** Create a `cors.json` file at the root of the project:
```json
[
  {
    "origin": ["*"],
    "method": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "maxAgeSeconds": 3600,
    "responseHeader": ["Content-Type", "Authorization", "Content-Length", "User-Agent", "x-goog-resumable"]
  }
]
```

2. **Apply the rule via the terminal** by targeting the exact bucket:
```bash
gcloud storage buckets update gs://[YOUR_BUCKET_ID].firebasestorage.app --cors-file=cors.json
```

3. **Security Rules:** In the Firebase console (Storage > Rules), apply permissions to allow public reading and restrict writing to authenticated administrators:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if true;
      allow write: if true; 
    }
  }
}
```

---

## 3. Production Deployment (Google Cloud Run)

The deployment relies on the code hosted on GitHub and is managed by Google Cloud's CI/CD tools.

1. **Enable APIs:** On the brand's GCP project, enable the **Cloud Build** and **Cloud Run** APIs.
2. **Create Service:** In Cloud Run, create a new service and select the **Continuously deploy from a repository** option.
3. **GitHub Connection:** Link the GitHub repository and target the appropriate production branch (e.g., `main` for Shop Template, `release/art-fate` for Art Fate).
4. **Container Configuration:** In the *Variables & Secrets* tab, manually enter all the variables defined in the local `.env.[brand]` file. **This is a critical step for Next.js to compile with the correct context.**
5. **Public Access:** Check the "Allow unauthenticated invocations" option to make the site accessible to customers.
6. Pushing the final code to the targeted branch will automatically trigger the build and deployment via Google Cloud Build.

---

## 4. Multi-Brand Reverse Proxy & CDN (Firebase Hosting to Cloud Run)

Firebase Hosting acts as a global CDN and managed SSL reverse proxy in front of Google Cloud Run services (`gokai-labs-main` and `art-fate-main` in `europe-west1`).

### Step A: Initial Target Setup (`target:apply`)

Before deploying the hosting proxy for the first time, link each logical target defined in `firebase.json` (`gokai-labs`, `art-fate`) to its actual Firebase Hosting site:

```bash
# Authenticate CLI (if not already logged in)
npx firebase-tools login

# 1. Link Gokai Labs target
npx firebase-tools target:apply hosting gokai-labs [GOKAI_LABS_SITE_ID] --project gokai-labs

# 2. Link Art Fate target
npx firebase-tools target:apply hosting art-fate [ART_FATE_SITE_ID] --project art-fate-database
```
> **Tip:** `[SITE_ID]` is your Firebase Hosting site name as shown in the Firebase Console (often identical to the project ID, e.g. `gokai-labs` or `art-fate-database`).

### Step B: Deploying the Hosting Proxy Layer

Once the targets are linked, deploy the reverse proxy layer independently using the package scripts:

```bash
# Deploy Gokai Labs CDN/Proxy:
npm run deploy:proxy:gl

# Deploy Art Fate CDN/Proxy:
npm run deploy:proxy:af
```

---

## 5. Administration Features

The back-office includes a secure workflow for full data lifecycle management.

* **End-to-End Deletion:** Entities (Products, Categories) integrate a destructive delete button with a confirmation dialog (`AlertDialog`).
* **Automatic Cleanup:** Deleting a product in Firestore automatically triggers a call to Firebase Storage to delete the associated physical image (`imageUrl`), preventing the accumulation of orphaned files.