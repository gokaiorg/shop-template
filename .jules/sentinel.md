## 2024-05-24 - Authorization Bypass in Next.js Server Actions
**Vulnerability:** Critical authorization bypass in `/admin` functionalities. Server Actions defined in `src/actions/admin.ts` (`createCategory`, `createProduct`, `seedDemoData`) lacked explicit authentication/authorization checks. Although the `/admin` routes are protected by `middleware.ts`, Server Actions can be invoked directly from anywhere, allowing unauthenticated users to modify the database.
**Learning:** In Next.js App Router, `middleware.ts` protection on routes does not automatically secure Server Actions used by those routes. Server Actions are independent endpoints.
**Prevention:** Every Server Action performing sensitive operations must include direct session validation (e.g., `const session = await auth(); if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };`) regardless of the route middleware.

## 2024-05-25 - Pass-the-Hash Vulnerability in Plaintext Migration Fallback
**Vulnerability:** A "Pass-the-Hash" vulnerability existed in the credentials authorization logic (`src/auth.ts`) used to migrate plaintext passwords to bcrypt. The fallback allowed login if `user.password === credentials.password`, meaning if an attacker obtained the bcrypt hash from the database, they could supply the hash string itself as their password.
**Learning:** Fallback mechanisms intended for migration can be exploited if they don't explicitly exclude modernized/secure data formats (like bcrypt hashes).
**Prevention:** Always scope down migration fallbacks. Ensure that a plaintext fallback condition explicitly checks that the stored value is not already a hashed value (e.g., `!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')`).
## 2026-04-26 - Server-side Input Validation in Checkout
**Vulnerability:** Client-provided item quantities were trusted implicitly in the checkout action, allowing negative or non-integer values.
**Learning:** This could lead to logic bugs, integer underflow, negative total order amounts, or manipulated inventory counts since the server action directly calculated total amounts based on these quantities.
**Prevention:** Always perform robust server-side validation on client-provided numerical inputs (e.g., quantities) inside server actions to ensure values are strict, positive integers before processing.
## 2026-04-28 - [Strict Input Typing in NextAuth Authorize]
**Vulnerability:** In NextAuth credentials authentication, the incoming `credentials` object properties (like email and password) are inherently loosely typed by NextAuth. A malicious user or incorrect client implementation could theoretically pass objects or arrays instead of strings. When processing plaintext password migration logic, truthy checks (`if (user.password)`) do not guarantee the stored or provided password is a string, which can cause runtime errors (e.g., calling `.startsWith()` on a non-string) or potentially NoSQL-related object comparison bypasses in document databases if those objects are directly passed into queries.
**Learning:** Defense-in-depth requires enforcing strict type checks (e.g., `typeof x === 'string'`) at runtime for authentication boundaries, rather than relying on TypeScript interfaces or simple truthy checks, especially when dealing with unstructured document databases (like Firestore) or string-specific methods like `bcrypt.compare` and `.startsWith()`.
**Prevention:** Always enforce `typeof credentials.property === 'string'` at the very beginning of the `authorize` function and verify fetched database sensitive fields (like password hashes) are strictly strings before performing string-specific operations.
## 2024-05-18 - [Fix Pass-the-hash vulnerability]
**Vulnerability:** Empty string passwords were permitted in the type checking logic allowing authentication bypasses. The pass-the-hash check did not consider all common bcrypt prefixes.
**Learning:** Checking for string types on passwords does not prevent empty strings. Additionally, pass-the-hash protection must cover all bcrypt formats ($2a$, $2b$, $2y$, $2x$).
**Prevention:** Ensure explicit \`!credentials.password\` length checks exist, and explicitly verify user IDs are strings.

## 2026-05-17 - [IDOR in Next.js Server Actions]
**Vulnerability:** Next.js Server Actions bypass route-level middleware protection (). The `updateProfile` action was vulnerable to IDOR because it accepted a `uid` parameter from the client and modified that user's profile without verifying if the authenticated session belonged to that `uid`.
**Learning:** Global middleware protection does not guarantee authorization for internal Server Action executions. Relying on client-provided IDs for user-specific mutations without server-side validation is a critical security risk.
**Prevention:** Always implement explicit session authorization checks directly within sensitive Next.js Server Actions (e.g., `const session = await auth(); if (!session || session.user.id !== uid)`) to enforce authorization boundaries.
## 2024-05-17 - [IDOR in Next.js Server Actions]
**Vulnerability:** Next.js Server Actions bypass route-level middleware protection (`middleware.ts`). The `updateProfile` action was vulnerable to IDOR because it accepted a `uid` parameter from the client and modified that user's profile without verifying if the authenticated session belonged to that `uid`.
**Learning:** Global middleware protection does not guarantee authorization for internal Server Action executions. Relying on client-provided IDs for user-specific mutations without server-side validation is a critical security risk.
**Prevention:** Always implement explicit session authorization checks directly within sensitive Next.js Server Actions (e.g., `const session = await auth(); if (!session || session.user.id !== uid)`) to enforce authorization boundaries.
