## 2025-04-04 - Remove unnecessary `isMounted` hydration checks to enable SSR
**Learning:** Components like `ShopProductCard` often cargo-cult the `isMounted` hydration-safe pattern from components that actually need it (like a `CartSheet` that reads persisted local storage). If a component only *modifies* state (e.g., uses `addItem` from a Zustand store) or relies on stable server-provided props, the `isMounted` check forces it to render a skeleton on the server.
**Action:** Remove `isMounted` hydration checks from components that do not render dynamic client-side state. This immediately enables full Server-Side Rendering (SSR) for those components, dramatically improving SEO, First Contentful Paint (FCP), and Largest Contentful Paint (LCP).

## 2024-05-24 - Prevent N+1 queries in Firestore lookups
**Learning:** Using `Promise.all(items.map(... => adminDb.collection("...").doc(id).get()))` creates an N+1 query problem, causing multiple network roundtrips to Firestore. This significantly degrades backend performance, especially when checking out carts with multiple items.
**Action:** Always batch Firestore document lookups by ID into a single network call using `adminDb.getAll(...documentRefs)` instead of looping. Note that `getAll()` expects arguments to be spread and requires at least one document reference, so always add an empty array check (`if (items.length === 0) return/throw`).

## 2024-05-24 - [Plan Review Groundedness Rule]
**Learning:** When using `cat` for large files, terminal output is easily truncated in the trace history. This leads to Groundedness Rule violations when proposing to remove variables or imports that are assumed to be unused.
**Action:** Before proposing to remove any variables, imports, or code in an execution plan, explicitly verify they are genuinely unused in the entire file using targeted tools (like `grep -rn "variableName" file.tsx` or `read_file`) instead of relying solely on the potentially truncated output of `cat`.
## 2024-05-24 - [Next.js App Router Data Fetching Deduplication]
**Learning:** In Next.js App Router, while native `fetch` requests are automatically deduplicated during the server render pass across `generateMetadata` and Page components, direct database SDK calls (like `firebase-admin`'s `.get()`) are NOT automatically deduplicated. This results in the database being hit twice per request for identical data.
**Action:** Always wrap non-`fetch` database query functions that are shared between `generateMetadata` and Page components with `React.cache()` to enforce single-execution per request lifecycle.
