## 2024-05-24 - Authorization Bypass in Next.js Server Actions
**Vulnerability:** Critical authorization bypass in `/admin` functionalities. Server Actions defined in `src/actions/admin.ts` (`createCategory`, `createProduct`, `seedDemoData`) lacked explicit authentication/authorization checks. Although the `/admin` routes are protected by `middleware.ts`, Server Actions can be invoked directly from anywhere, allowing unauthenticated users to modify the database.
**Learning:** In Next.js App Router, `middleware.ts` protection on routes does not automatically secure Server Actions used by those routes. Server Actions are independent endpoints.
**Prevention:** Every Server Action performing sensitive operations must include direct session validation (e.g., `const session = await auth(); if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };`) regardless of the route middleware.

## 2024-05-25 - Pass-the-Hash Bypass in Authentication Migration
**Vulnerability:** Critical Pass-the-Hash vulnerability in `/src/auth.ts`. The authentication fallback logic for migrating plaintext passwords allowed users to authenticate by supplying the stored bcrypt hash as their password input if they obtained it, effectively bypassing password checks.
**Learning:** When implementing fallback authentication checks (like comparing `user.password === credentials.password` for older plaintext passwords), directly checking strings without ensuring the stored password is not already a hash creates a vulnerability where hashes act as passwords.
**Prevention:** Always verify that a stored password string doesn't match the standard bcrypt format/prefixes (e.g., `$2a$`, `$2b$`, `$2y$`) before doing direct plaintext comparisons.
