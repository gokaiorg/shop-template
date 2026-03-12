## 2025-02-13 - [Promise.all Data Fetching Parallelization]
**Learning:** Found a common Next.js pattern where independent server-side data fetching (e.g. `getDictionary`, `prisma.category.findMany`, and `prisma.product.findMany`) are chained sequentially using `await`, leading to a slower Time to First Byte (TTFB).
**Action:** Always scan server components for consecutive `await` statements that don't depend on each other's results, and wrap them in a `Promise.all` block to execute them concurrently and improve performance.
