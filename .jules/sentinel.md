## 2024-05-24 - Authorization Bypass in Next.js Server Actions
**Vulnerability:** Critical authorization bypass in `/admin` functionalities. Server Actions defined in `src/actions/admin.ts` (`createCategory`, `createProduct`, `seedDemoData`) lacked explicit authentication/authorization checks. Although the `/admin` routes are protected by `middleware.ts`, Server Actions can be invoked directly from anywhere, allowing unauthenticated users to modify the database.
**Learning:** In Next.js App Router, `middleware.ts` protection on routes does not automatically secure Server Actions used by those routes. Server Actions are independent endpoints.
**Prevention:** Every Server Action performing sensitive operations must include direct session validation (e.g., `const session = await auth(); if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };`) regardless of the route middleware.

## 2024-05-25 - Pass-the-Hash Vulnerability in Plaintext Migration Fallback
**Vulnerability:** A "Pass-the-Hash" vulnerability existed in the credentials authorization logic (`src/auth.ts`) used to migrate plaintext passwords to bcrypt. The fallback allowed login if `user.password === credentials.password`, meaning if an attacker obtained the bcrypt hash from the database, they could supply the hash string itself as their password.
**Learning:** Fallback mechanisms intended for migration can be exploited if they don't explicitly exclude modernized/secure data formats (like bcrypt hashes).
**Prevention:** Always scope down migration fallbacks. Ensure that a plaintext fallback condition explicitly checks that the stored value is not already a hashed value (e.g., `!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')`).

## 2025-02-28 - Missing Validation on Client-Provided Checkout Quantities
**Vulnerability:** A missing server-side validation vulnerability existed in the `/checkout` server action (`src/actions/checkout.ts`). Although item prices were securely fetched from the database, client-provided `quantity` values were trusted implicitly. An attacker could potentially send negative quantities or floating-point numbers, potentially resulting in negative order totals, incorrect stripe transactions, or application errors.
**Learning:** Never implicitly trust client-provided numbers used in calculations or business logic, even if other parts of the payload (like product IDs) are validated against a database.
**Prevention:** Always perform strict validation on numerical inputs derived from client requests, especially for financial transactions. Check for correct typing (e.g., `Number.isInteger()`) and ensure values fall within an expected safe range (e.g., `> 0`).
