## 2025-04-04 - Remove unnecessary `isMounted` hydration checks to enable SSR
**Learning:** Components like `ShopProductCard` often cargo-cult the `isMounted` hydration-safe pattern from components that actually need it (like a `CartSheet` that reads persisted local storage). If a component only *modifies* state (e.g., uses `addItem` from a Zustand store) or relies on stable server-provided props, the `isMounted` check forces it to render a skeleton on the server.
**Action:** Remove `isMounted` hydration checks from components that do not render dynamic client-side state. This immediately enables full Server-Side Rendering (SSR) for those components, dramatically improving SEO, First Contentful Paint (FCP), and Largest Contentful Paint (LCP).

## 2026-04-10 - Redundant Hydration Checks with useSession
**Learning:** Components that rely on `next-auth/react`'s `useSession` do not need manual `isMounted` hydration checks because the hook natively exposes a `status` property that inherently tracks the loading state (`status === "loading"`). Adding `isMounted` creates unnecessary double-rendering and delays initial loading.
**Action:** Rely exclusively on `status === "loading"` for loading skeletons rather than manual useEffect-based hydration flags in components with session state.
