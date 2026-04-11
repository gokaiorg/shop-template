## 2024-05-24 - Authorization Bypass in Next.js Server Actions
**Vulnerability:** Critical authorization bypass in `/admin` functionalities. Server Actions defined in `src/actions/admin.ts` (`createCategory`, `createProduct`, `seedDemoData`) lacked explicit authentication/authorization checks. Although the `/admin` routes are protected by `middleware.ts`, Server Actions can be invoked directly from anywhere, allowing unauthenticated users to modify the database.
**Learning:** In Next.js App Router, `middleware.ts` protection on routes does not automatically secure Server Actions used by those routes. Server Actions are independent endpoints.
**Prevention:** Every Server Action performing sensitive operations must include direct session validation (e.g., `const session = await auth(); if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };`) regardless of the route middleware.

## 2024-05-25 - Pass-the-Hash in Plaintext Password Migration
**Vulnerability:** A "Pass-the-Hash" bypass vulnerability existed in `src/auth.ts`. The authentication fallback logic for migrating legacy plaintext passwords directly compared the user-provided password with the stored password (`user.password === credentials.password`). This allowed an attacker to bypass authentication by passing a known bcrypt hash directly, as the direct equality check would succeed.
**Learning:** When falling back to direct string comparisons for legacy password support, you must ensure the stored password is not already a hash before comparing it to the input.
**Prevention:** Explicitly check that the stored password does not start with a hashing prefix (like `$2a$`, `$2b$`, or `$2y$` for bcrypt) before performing a plaintext equality check.
