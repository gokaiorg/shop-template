# Shop Template — Multi-Brand Architecture & Deployment Guide

This repository hosts a Next.js e-commerce application designed to manage multiple brands (like Shop Template) from a single codebase. The behavior, design, and infrastructure of each brand are isolated via environment files and driven by *Feature Flags*.

## 1. Architecture and Feature Flags

The application adapts its features based on the loaded `.env` file (e.g., `.env.st`).

* **Brand Identifier:** `NEXT_PUBLIC_BRAND` (e.g., `shop-template`) defines the active context for the design and seed scripts.
* **Optional Cart System:** The `NEXT_PUBLIC_ENABLE_CART` variable (true/false) allows enabling or completely hiding the cart interface and "Add to cart" buttons, while keeping the price display intact.
* **Dynamic Multilingualism (i18n):** The language system is driven by `NEXT_PUBLIC_SUPPORTED_LOCALES` (e.g., `en,fr` or `en`) and `NEXT_PUBLIC_DEFAULT_LOCALE`. If a single language is configured, the routing ignores URL language prefixes, and the back-office automatically hides unnecessary translation input fields.
* **Multiple Categorization:** The product architecture uses a `categoryIds` array (instead of a strict one-to-one relationship), allowing a product to be assigned to multiple categories simultaneously from a `MultiSelect` interface in the admin panel.

---

## 2. Creating a New Brand from Scratch (GCP & Firebase)

Setting up a new brand requires creating an isolated infrastructure to ensure data and billing separation.

### Step A: Firebase & Google Cloud Infrastructure

1. From the [Firebase Console](https://console.firebase.google.com/), create a new project (e.g., `shop-template-database`). This automatically generates an associated Google Cloud Platform (GCP) project.
2. Add a **Web App** (`</>`) in the project settings to generate the `firebaseConfig` object.
3. In the **Build** menu, enable **Firestore Database** and choose the hosting region.
4. In the **Build** menu, enable **Storage** for hosting product images.
5. Go to **Project settings > Service accounts** and generate a new private key to obtain the server admin credentials (`client_email` and `private_key`).

### Step B: Local Environment Configuration

1. Duplicate the `.env.example` file to `.env.[brand-identifier]`.
2. Fill in the Firebase client variables (`NEXT_PUBLIC_FIREBASE_API_KEY`, `PROJECT_ID`, `STORAGE_BUCKET`, etc.) with the Web App keys.
3. Fill in the admin variables (`FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY`) with the Service Account keys to allow the use of the Firebase Admin SDK (essential for SSR rendering).
4. Generate a new NextAuth secret using the command `npx auth secret` and add it to `AUTH_SECRET`.

### Step C: Storage Configuration (CORS & Security)

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


2. Apply the rule via the terminal by targeting the exact bucket:
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
      allow write: if request.auth != null; 
    }
  }
}

```



---

## 3. Production Deployment (Google Cloud Run)

The deployment relies on the code hosted on GitHub and is managed by Google Cloud's CI/CD tools.

1. **Enable APIs:** On the brand's GCP project, enable the **Cloud Build** and **Cloud Run** APIs.
2. **Create Service:** In Cloud Run, create a new service and select the **Continuously deploy from a repository** option.
3. **GitHub Connection:** Link the GitHub repository and target the appropriate production branch (e.g., `main` for Shop Template, `release/shop-template` for Shop Template).
4. **Container Configuration:** In the *Variables & Secrets* tab, manually enter all the variables defined in the local `.env.[brand]` file. **This is a critical step for Next.js to compile with the correct context.**
5. **Public Access:** Check the "Allow unauthenticated invocations" option to make the site accessible to customers.
6. Pushing the final code to the targeted branch will automatically trigger the build and deployment via Google Cloud Build.

---

## 4. Administration Features

The back-office includes a secure workflow for full data lifecycle management.

* **End-to-End Deletion:** Entities (Products, Categories) integrate a destructive delete button with a confirmation dialog (`AlertDialog`).
* **Automatic Cleanup:** Deleting a product in Firestore automatically triggers a call to Firebase Storage to delete the associated physical image (`imageUrl`), preventing the accumulation of orphaned files.