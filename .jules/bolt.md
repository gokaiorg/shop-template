## 2025-04-04 - Remove unnecessary `isMounted` hydration checks to enable SSR
**Learning:** Components like `ShopProductCard` often cargo-cult the `isMounted` hydration-safe pattern from components that actually need it (like a `CartSheet` that reads persisted local storage). If a component only *modifies* state (e.g., uses `addItem` from a Zustand store) or relies on stable server-provided props, the `isMounted` check forces it to render a skeleton on the server.
**Action:** Remove `isMounted` hydration checks from components that do not render dynamic client-side state. This immediately enables full Server-Side Rendering (SSR) for those components, dramatically improving SEO, First Contentful Paint (FCP), and Largest Contentful Paint (LCP).

## 2024-05-24 - Prevent N+1 queries in Firestore lookups
**Learning:** Using `Promise.all(items.map(... => adminDb.collection("...").doc(id).get()))` creates an N+1 query problem, causing multiple network roundtrips to Firestore. This significantly degrades backend performance, especially when checking out carts with multiple items.
**Action:** Always batch Firestore document lookups by ID into a single network call using `adminDb.getAll(...documentRefs)` instead of looping. Note that `getAll()` expects arguments to be spread and requires at least one document reference, so always add an empty array check (`if (items.length === 0) return/throw`).

## 2024-05-24 - [Plan Review Groundedness Rule]
**Learning:** When using `cat` for large files, terminal output is easily truncated in the trace history. This leads to Groundedness Rule violations when proposing to remove variables or imports that are assumed to be unused.
**Action:** Before proposing to remove any variables, imports, or code in an execution plan, explicitly verify they are genuinely unused in the entire file using targeted tools (like `grep -rn "variableName" file.tsx` or `read_file`) instead of relying solely on the potentially truncated output of `cat`.

## 2024-05-18 - Admin Dashboard TTFB Waterfall
**Learning:** `src/app/[lang]/admin/dashboard/page.tsx` awaits `session` before starting fetches for `productsSnap`, `categoriesSnap`, `recentOrders`, and `pendingOrdersCount`. This creates an unnecessary TTFB waterfall because those queries do not require `session.user.id` to execute. While it is faster to launch them early, it must be noted that it is generally safer to gate expensive operations behind authentication to prevent wasted db ops for unauthenticated requests. In this case, since the route is protected by `middleware.ts`, unauthenticated requests won't reach the page component directly anyway, making this safe.
**Action:** Since these promises can be fired independently, start them concurrently *before* awaiting the `auth()` call (when protected by middleware), and group them with the `userDoc` fetch later. Remember to add `.catch(() => {})` to background promises to prevent unhandled rejections if the main await fails.
