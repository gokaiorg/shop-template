## 2024-04-04 - Context-aware Screen Reader Labels in Cart
**Learning:** In dynamically generated lists like shopping carts, generic `sr-only` labels ("Remove item", "Increase quantity") are unhelpful to screen reader users because they don't know *which* item is being targeted. Also, dynamic text components need their `alt` text and accessibility tags localized correctly.
**Action:** Always extract the dynamically localized item name and use it to build context-aware `sr-only` descriptions (e.g., `Remove {itemName}`). Use this same variable for image `alt` attributes to ensure correct localization. 
## 2024-04-10 - Screen reader text context in list buttons
**Learning:** Screen readers announce list actions out-of-context; adding item names to "Add to cart" buttons via aria-label drastically improves traversal without changing visual UI.
**Action:** In all multi-item lists, append `title` or `name` into dynamic `aria-label` properties.
