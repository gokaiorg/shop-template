## 2025-03-21 - Optimize O(n²) loop when fetching products with category relations
**Learning:** In Next.js Server Components, performing `.find()` over a list of categories inside a `.map()` for products leads to O(n*m) complexity. This can cause significant server-side latency as the product catalog scales.
**Action:** Always map relations like Categories to a `Map` structure prior to iterating over the Products array to ensure O(1) lookups and O(n+m) overall time complexity.

## 2025-03-21 - Prevent cascading re-renders in global store hooks
**Learning:** Using `const { addItem } = useCart();` destructures from the full Zustand state object. Any change to `totalItems` or `items` will force the component (e.g., `ShopProductCard`) to re-render, creating massive performance overhead on pages with large product grids.
**Action:** Use selector functions to specifically subscribe only to the state needed: `const addItem = useCart(state => state.addItem);`.

## 2025-04-04 - Remove unnecessary `isMounted` hydration checks to enable SSR
**Learning:** Components like `ShopProductCard` often cargo-cult the `isMounted` hydration-safe pattern from components that actually need it (like a `CartSheet` that reads persisted local storage). If a component only *modifies* state (e.g., uses `addItem` from a Zustand store) or relies on stable server-provided props, the `isMounted` check forces it to render a skeleton on the server.
**Action:** Remove `isMounted` hydration checks from components that do not render dynamic client-side state. This immediately enables full Server-Side Rendering (SSR) for those components, dramatically improving SEO, First Contentful Paint (FCP), and Largest Contentful Paint (LCP).
