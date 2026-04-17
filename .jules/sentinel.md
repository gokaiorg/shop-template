## 2024-05-24 - Authorization Bypass in Next.js Server Actions
**Vulnerability:** Critical authorization bypass in `/admin` functionalities. Server Actions defined in `src/actions/admin.ts` (`createCategory`, `createProduct`, `seedDemoData`) lacked explicit authentication/authorization checks. Although the `/admin` routes are protected by `middleware.ts`, Server Actions can be invoked directly from anywhere, allowing unauthenticated users to modify the database.
**Learning:** In Next.js App Router, `middleware.ts` protection on routes does not automatically secure Server Actions used by those routes. Server Actions are independent endpoints.
**Prevention:** Every Server Action performing sensitive operations must include direct session validation (e.g., `const session = await auth(); if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };`) regardless of the route middleware.

## 2024-05-24 - Pass-the-Hash Vulnerability in Authentication Migration
**Vulnerability:** A Pass-the-Hash vulnerability existed in `src/auth.ts` where a user could potentially log in by supplying the hashed password instead of the plain-text password, if the stored password was already a hash and the fallback matched them directly.
**Learning:** During plaintext password migration, comparing a user's input directly against the database stored password without verifying if the stored password is a plain-text password or a hash creates an authorization bypass.
**Prevention:** Always verify type safety (e.g. `typeof user.password === 'string'`) and ensure the string is not already a hash (e.g. checking that it doesn't start with bcrypt prefixes like `$2a$`, `$2b$`, or `$2y$`) before comparing the input as a plaintext fallback.
