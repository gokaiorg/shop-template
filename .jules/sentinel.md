## 2024-05-24 - Authorization Bypass in Next.js Server Actions
**Vulnerability:** Critical authorization bypass in `/admin` functionalities. Server Actions defined in `src/actions/admin.ts` (`createCategory`, `createProduct`, `seedDemoData`) lacked explicit authentication/authorization checks. Although the `/admin` routes are protected by `middleware.ts`, Server Actions can be invoked directly from anywhere, allowing unauthenticated users to modify the database.
**Learning:** In Next.js App Router, `middleware.ts` protection on routes does not automatically secure Server Actions used by those routes. Server Actions are independent endpoints.
**Prevention:** Every Server Action performing sensitive operations must include direct session validation (e.g., `const session = await auth(); if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };`) regardless of the route middleware.

## 2024-05-25 - Pass-the-Hash Vulnerability in Plaintext Migration Fallback
**Vulnerability:** A "Pass-the-Hash" vulnerability existed in the credentials authorization logic (`src/auth.ts`) used to migrate plaintext passwords to bcrypt. The fallback allowed login if `user.password === credentials.password`, meaning if an attacker obtained the bcrypt hash from the database, they could supply the hash string itself as their password.
**Learning:** Fallback mechanisms intended for migration can be exploited if they don't explicitly exclude modernized/secure data formats (like bcrypt hashes).
**Prevention:** Always scope down migration fallbacks. Ensure that a plaintext fallback condition explicitly checks that the stored value is not already a hashed value (e.g., `!user.password.startsWith('$2a$') && !user.password.startsWith('$2b$')`).

## 2024-06-25 - [Checkout Quantity Validation]
**Vulnerability:** E-commerce checkout actions trusting client-provided quantity data without sufficient server-side validation. Attackers could submit zero, negative, or fractional quantities (e.g. `0.5`) to manipulate the total cost calculation or inventory, resulting in items being purchased for incorrect amounts or negative totals.
**Learning:** In server actions handling sensitive financial calculations (`src/actions/checkout.ts`), it is not enough to verify the item ID and backend price. The multiplier (quantity) must also be strictly validated as a positive integer.
**Prevention:** Always implement robust server-side data validation (`Number.isSafeInteger(quantity) && quantity > 0`) for numerical user inputs, particularly quantities, prices, or limits, before utilizing them in calculations or passing them to third-party APIs (like Stripe).
