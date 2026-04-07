## 2024-05-24 - Authorization Bypass in Next.js Server Actions
**Vulnerability:** Critical authorization bypass in `/admin` functionalities. Server Actions defined in `src/actions/admin.ts` (`createCategory`, `createProduct`, `seedDemoData`) lacked explicit authentication/authorization checks. Although the `/admin` routes are protected by `middleware.ts`, Server Actions can be invoked directly from anywhere, allowing unauthenticated users to modify the database.
**Learning:** In Next.js App Router, `middleware.ts` protection on routes does not automatically secure Server Actions used by those routes. Server Actions are independent endpoints.
**Prevention:** Every Server Action performing sensitive operations must include direct session validation (e.g., `const session = await auth(); if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };`) regardless of the route middleware.

## 2024-05-18 - Pass-the-Hash in Password Migration Fallbacks
**Vulnerability:** When implementing a fallback for migrating plaintext passwords (checking `user.password === credentials.password`), an attacker can pass the database's stored bcrypt hash as their plaintext password input to bypass authentication.
**Learning:** This "Pass-the-Hash" vulnerability occurs when the fallback string match succeeds against the raw hash.
**Prevention:** Always ensure type safety (`typeof user.password === 'string'`) and explicitly check that the stored string does not start with bcrypt prefixes (e.g., `!user.password.startsWith('$2a$')` and `!user.password.startsWith('$2b$')`) before doing direct string matching in legacy migration fallbacks.
