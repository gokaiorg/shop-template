## 2025-03-21 - Optimize O(n²) loop when fetching products with category relations
**Learning:** In Next.js Server Components, performing `.find()` over a list of categories inside a `.map()` for products leads to O(n*m) complexity. This can cause significant server-side latency as the product catalog scales.
**Action:** Always map relations like Categories to a `Map` structure prior to iterating over the Products array to ensure O(1) lookups and O(n+m) overall time complexity.

## 2025-03-21 - Prevent cascading re-renders in global store hooks
**Learning:** Using `const { addItem } = useCart();` destructures from the full Zustand state object. Any change to `totalItems` or `items` will force the component (e.g., `ShopProductCard`) to re-render, creating massive performance overhead on pages with large product grids.
**Action:** Use selector functions to specifically subscribe only to the state needed: `const addItem = useCart(state => state.addItem);`.
