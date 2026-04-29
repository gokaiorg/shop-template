## 2024-04-04 - Context-aware Screen Reader Labels in Cart
**Learning:** In dynamically generated lists like shopping carts, generic `sr-only` labels ("Remove item", "Increase quantity") are unhelpful to screen reader users because they don't know *which* item is being targeted. Also, dynamic text components need their `alt` text and accessibility tags localized correctly.
**Action:** Always extract the dynamically localized item name and use it to build context-aware `sr-only` descriptions (e.g., `Remove {itemName}`). Use this same variable for image `alt` attributes to ensure correct localization. 

## $(date +%Y-%m-%d) - Screen Reader Double-Reading with Notification Badges
**Learning:** Adding a notification badge (like a cart item count) next to an icon button often causes screen readers to read the count out of context (e.g., just reading "3" before or after "Open cart").
**Action:** Hide visual notification badges from screen readers with `aria-hidden="true"` and incorporate their data directly into the parent element's `sr-only` text to prevent double-reading and provide context (e.g., "Open cart (3 items)").

## $(date +%Y-%m-%d) - Consistent SSR/Hydration Skeletons for Interactive Components
**Learning:** Using generic HTML elements (like a `<div>`) as a loading skeleton or SSR fallback for complex interactive components (like shadcn/radix buttons with variants) causes layout shifts and semantic inconsistency before hydration.
**Action:** For SSR/unmounted fallback states of interactive components, use structurally equivalent disabled semantic elements (e.g., a disabled `Button` with the same sizing variants) rather than generic divs.
## 2024-04-29 - Loading Skeleton Layout Shifts
**Learning:** Loading skeleton dimensions that do not perfectly match the final loaded component size (e.g., `h-8 w-16` placeholder for a `size-9` icon button) cause jarring layout shifts when the async state resolves.
**Action:** Always ensure fallback/loading skeleton UI elements match the exact dimensions of their interactive counterparts to provide a seamless, non-janky UX loading experience.
