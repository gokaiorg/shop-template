## 2024-05-24 - Authorization Bypass in Next.js Server Actions
**Vulnerability:** Critical authorization bypass in `/admin` functionalities. Server Actions defined in `src/actions/admin.ts` (`createCategory`, `createProduct`, `seedDemoData`) lacked explicit authentication/authorization checks. Although the `/admin` routes are protected by `middleware.ts`, Server Actions can be invoked directly from anywhere, allowing unauthenticated users to modify the database.
**Learning:** In Next.js App Router, `middleware.ts` protection on routes does not automatically secure Server Actions used by those routes. Server Actions are independent endpoints.
**Prevention:** Every Server Action performing sensitive operations must include direct session validation (e.g., `const session = await auth(); if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };`) regardless of the route middleware.

## 2024-05-25 - Pass-the-Hash Vulnerability in Plaintext Migration Fallback
**Vulnerability:** A "Pass-the-Hash" vulnerability existed in the credentials authorization logic (`src/auth.ts`) used to migrate plaintext passwords to bcrypt. The fallback allowed login if `user.password === credentials.password`, meaning if an attacker obtained the bcrypt hash from the database, they could supply the hash string itself as their password.
**Learning:** Fallback mechanisms intended for migration can be exploited if they don't explicitly exclude modernized/secure data formats (like bcrypt hashes).
**Prevention:** Always scope down migration fallbacks. Ensure that a plaintext fallback condition explicitly checks that the stored value is not already a hashed value (e.g., `!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')`).

## 2026-04-20 - Input Validation in Checkout Sessions
**Vulnerability:** The checkout Server Action (`src/actions/checkout.ts`) calculated total order amounts by multiplying item prices by client-provided `quantity` values, but failed to validate that `quantity` was a valid, strictly positive integer. This could allow an attacker to send negative quantities to artificially reduce the total amount of their cart, or fractional quantities to bypass business logic.
**Learning:** Server Actions must strictly validate all mathematical factors provided by the client before performing business logic calculations, even if the primary entities (like product pricing) are correctly fetched from the database.
**Prevention:** Always validate client-provided numerical inputs, such as `quantity` in checkout flows, using `Number.isInteger()` and checking for bounds (e.g., `> 0`) before processing.
