## 2025-04-04 - Remove unnecessary `isMounted` hydration checks to enable SSR
**Learning:** Components like `ShopProductCard` often cargo-cult the `isMounted` hydration-safe pattern from components that actually need it (like a `CartSheet` that reads persisted local storage). If a component only *modifies* state (e.g., uses `addItem` from a Zustand store) or relies on stable server-provided props, the `isMounted` check forces it to render a skeleton on the server.
**Action:** Remove `isMounted` hydration checks from components that do not render dynamic client-side state. This immediately enables full Server-Side Rendering (SSR) for those components, dramatically improving SEO, First Contentful Paint (FCP), and Largest Contentful Paint (LCP).

## 2024-05-24 - Prevent N+1 queries in Firestore lookups
**Learning:** Using `Promise.all(items.map(... => adminDb.collection("...").doc(id).get()))` creates an N+1 query problem, causing multiple network roundtrips to Firestore. This significantly degrades backend performance, especially when checking out carts with multiple items.
**Action:** Always batch Firestore document lookups by ID into a single network call using `adminDb.getAll(...documentRefs)` instead of looping. Note that `getAll()` expects arguments to be spread and requires at least one document reference, so always add an empty array check (`if (items.length === 0) return/throw`).

## 2024-05-24 - [Plan Review Groundedness Rule]
**Learning:** When using `cat` for large files, terminal output is easily truncated in the trace history. This leads to Groundedness Rule violations when proposing to remove variables or imports that are assumed to be unused.
**Action:** Before proposing to remove any variables, imports, or code in an execution plan, explicitly verify they are genuinely unused in the entire file using targeted tools (like `grep -rn "variableName" file.tsx` or `read_file`) instead of relying solely on the potentially truncated output of `cat`.
\n## 2026-05-22 - Deduplicating Firestore Queries in Next.js Server Components
**Learning:** In Next.js App Router,  requests are automatically memoized/deduplicated by the framework. However, direct database queries using SDKs like  are not. If a page uses  and the main page component, identical database queries will execute twice per request, unnecessarily increasing database reads and TTFB.
**Action:** When building Next.js Server Components with direct SDK database calls, wrap the data-fetching functions with  to ensure the query is executed only once per render pass.

## 2024-05-25 - Deduplicating Firestore Queries in Next.js Server Components
**Learning:** In Next.js App Router, fetch() requests are automatically memoized/deduplicated by the framework. However, direct database queries using SDKs like firebase-admin are not. If a page uses generateMetadata and the main page component, identical database queries will execute twice per request, unnecessarily increasing database reads and TTFB.
**Action:** When building Next.js Server Components with direct SDK database calls, wrap the data-fetching functions with React.cache() to ensure the query is executed only once per render pass.
