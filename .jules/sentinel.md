## 2024-05-24 - Authorization Bypass in Next.js Server Actions
**Vulnerability:** Critical authorization bypass in `/admin` functionalities. Server Actions defined in `src/actions/admin.ts` (`createCategory`, `createProduct`, `seedDemoData`) lacked explicit authentication/authorization checks. Although the `/admin` routes are protected by `middleware.ts`, Server Actions can be invoked directly from anywhere, allowing unauthenticated users to modify the database.
**Learning:** In Next.js App Router, `middleware.ts` protection on routes does not automatically secure Server Actions used by those routes. Server Actions are independent endpoints.
**Prevention:** Every Server Action performing sensitive operations must include direct session validation (e.g., `const session = await auth(); if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };`) regardless of the route middleware.

## 2024-05-25 - Pass-the-Hash Vulnerability in Plaintext Migration Fallback
**Vulnerability:** A "Pass-the-Hash" vulnerability existed in the credentials authorization logic (`src/auth.ts`) used to migrate plaintext passwords to bcrypt. The fallback allowed login if `user.password === credentials.password`, meaning if an attacker obtained the bcrypt hash from the database, they could supply the hash string itself as their password.
**Learning:** Fallback mechanisms intended for migration can be exploited if they don't explicitly exclude modernized/secure data formats (like bcrypt hashes).
**Prevention:** Always scope down migration fallbacks. Ensure that a plaintext fallback condition explicitly checks that the stored value is not already a hashed value (e.g., `!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')`).

## 2024-05-26 - Missing Input Validation in Checkout
**Vulnerability:** Missing server-side validation for numerical inputs (specifically `quantity`) in the `createCheckoutSession` Server Action (`src/actions/checkout.ts`). Clients could potentially send negative or non-integer quantities, leading to negative order totals or unexpected errors.
**Learning:** TypeScript types (e.g., `quantity: number`) only provide compile-time safety. Server Actions receive raw JSON payloads from the client, bypassing TypeScript's checks at runtime.
**Prevention:** Always perform robust runtime validation on client-provided numerical inputs, especially in sensitive operations like checkout. Use `Number.isInteger()` and range checks (e.g., `> 0`) to ensure values are strictly valid, non-negative integers.
