## 2024-04-04 - Context-aware Screen Reader Labels in Cart
**Learning:** In dynamically generated lists like shopping carts, generic `sr-only` labels ("Remove item", "Increase quantity") are unhelpful to screen reader users because they don't know *which* item is being targeted. Also, dynamic text components need their `alt` text and accessibility tags localized correctly.
**Action:** Always extract the dynamically localized item name and use it to build context-aware `sr-only` descriptions (e.g., `Remove {itemName}`). Use this same variable for image `alt` attributes to ensure correct localization. 

## 2026-04-24 - Structurally Sound SSR Fallback States
**Learning:** When building Next.js components with client-side state (like reading cart totals from local storage), the fallback state rendered during Server-Side Rendering (SSR) via `!mounted` checks must maintain the same structural accessibility as the mounted interactive state. For example, rendering a generic `<div>` instead of a `<Button disabled>` breaks the expected semantic structure for screen readers and can cause layout shifts when hydration completes.
**Action:** Always ensure the `!mounted` fallback returns a structurally equivalent, disabled semantic element (e.g., `<Button disabled>`) with appropriate screen reader labels (`sr-only`), rather than reverting to a basic `div` or an empty element.
