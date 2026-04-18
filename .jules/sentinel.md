## 2024-05-24 - Authorization Bypass in Next.js Server Actions
**Vulnerability:** Critical authorization bypass in `/admin` functionalities. Server Actions defined in `src/actions/admin.ts` (`createCategory`, `createProduct`, `seedDemoData`) lacked explicit authentication/authorization checks. Although the `/admin` routes are protected by `middleware.ts`, Server Actions can be invoked directly from anywhere, allowing unauthenticated users to modify the database.
**Learning:** In Next.js App Router, `middleware.ts` protection on routes does not automatically secure Server Actions used by those routes. Server Actions are independent endpoints.
**Prevention:** Every Server Action performing sensitive operations must include direct session validation (e.g., `const session = await auth(); if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };`) regardless of the route middleware.

## 2024-05-25 - Pass-the-Hash Vulnerability in Plaintext Migration Fallback
**Vulnerability:** A "Pass-the-Hash" vulnerability existed in the credentials authorization logic (`src/auth.ts`) used to migrate plaintext passwords to bcrypt. The fallback allowed login if `user.password === credentials.password`, meaning if an attacker obtained the bcrypt hash from the database, they could supply the hash string itself as their password.
**Learning:** Fallback mechanisms intended for migration can be exploited if they don't explicitly exclude modernized/secure data formats (like bcrypt hashes).
**Prevention:** Always scope down migration fallbacks. Ensure that a plaintext fallback condition explicitly checks that the stored value is not already a hashed value (e.g., `!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')`).
## 2025-02-25 - [Missing Quantity Validation in Checkout]
**Vulnerability:** The `createCheckoutSession` server action in `src/actions/checkout.ts` trusted client-provided `quantity` values in the payload without strictly validating that they were positive integers.
**Learning:** Even when looking up authoritative pricing from the database to prevent direct price manipulation, missing validation on `quantity` allows a malicious client to pass negative or non-integer quantities. This can manipulate the total order amount, potentially offsetting the cost of other items and enabling theft.
**Prevention:** Always perform robust server-side validation on all numerical inputs, specifically enforcing strictly positive integers (`typeof x === 'number' && Number.isInteger(x) && x > 0`) for quantities before processing.
