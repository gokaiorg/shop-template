# Shop Template

The ultimate full-stack boilerplate for launching premium e-commerce brands or robust digital agencies. Started as a secure, fully localized, and beautifully designed architecture.

## 🚀 The Stack

This project is built using modern, production-ready technologies:

- **Stack**: Next.js 14+ (App Router), Tailwind CSS, TypeScript, pnpm.
- **Backend**: Firebase (Auth, Firestore, Storage).
- **Payments**: Stripe.
- **Infrastructure**: Google Cloud Platform (Cloud Run, Cloud Build via Developer Connect).

## 🚀 Agency Workflow: How to clone for a new project

1. **Repository Setup**:
   - Create a new empty repository on GitHub.
   - `git clone` this template.
   - `git remote add template [URL-ST]` and `git remote set-url origin [URL-NEW-REPO]`.
2. **Project Identity**: 
   - Update `package.json` name and metadata in `src/app/layout.tsx`.
3. **GCP Deployment**:
   - Create a new GCP Project.
   - Connect GitHub via "Developer Connect" (don't forget to authorize the new repo).
   - Create a Cloud Build Trigger for the `dev` branch.
   - Allow public access, Container port 3000, Memory 2GiB, CPU 2, Request timeout 3600s.
   - Add IAM role "Developer Connect Read-only Access" to the Cloud Build Service Account.
4. **Environment Variables**: 
   - Use `.env.example` as a reference to populate Cloud Run variables (Firebase & Stripe).

## 🌍 Features
* **Full i18n Localization**: Built-in multi-language support (English and French included by default).
* **Role-Based Access Control**: Protected Admin vs. User routes.
* **Dark Mode**: Flawless integration with System, Dark, and Light themes.
* **Modern Admin Dashboard**: Ready-to-go interface to manage your catalog, orders, and users.

---

&copy; 2026. Made with AI by [Gokai Labs](https://gokai.org).
