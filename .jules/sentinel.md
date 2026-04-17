## 2024-05-24 - Authorization Bypass in Next.js Server Actions
**Vulnerability:** Critical authorization bypass in `/admin` functionalities. Server Actions defined in `src/actions/admin.ts` (`createCategory`, `createProduct`, `seedDemoData`) lacked explicit authentication/authorization checks. Although the `/admin` routes are protected by `middleware.ts`, Server Actions can be invoked directly from anywhere, allowing unauthenticated users to modify the database.
**Learning:** In Next.js App Router, `middleware.ts` protection on routes does not automatically secure Server Actions used by those routes. Server Actions are independent endpoints.
**Prevention:** Every Server Action performing sensitive operations must include direct session validation (e.g., `const session = await auth(); if (session?.user?.role !== "ADMIN") return { error: "Unauthorized" };`) regardless of the route middleware.
## 2026-04-14 - [Checkout Quantity Validation]
**Vulnerability:** The checkout action blindly accepted client-provided `item.quantity` values without verifying they were positive integers. This could allow an attacker to submit negative quantities (manipulating the total price) or fractional quantities.
**Learning:** Even when fetching the source-of-truth price from the database, all other factors in a financial calculation (like quantity) must be strictly validated server-side to prevent business logic bypasses.
**Prevention:** Always use `Number.isSafeInteger()` and ensure values are `> 0` for any multiplier affecting transaction totals in Server Actions.
