## 2024-04-04 - Context-aware Screen Reader Labels in Cart
**Learning:** In dynamically generated lists like shopping carts, generic `sr-only` labels ("Remove item", "Increase quantity") are unhelpful to screen reader users because they don't know *which* item is being targeted. Also, dynamic text components need their `alt` text and accessibility tags localized correctly.
**Action:** Always extract the dynamically localized item name and use it to build context-aware `sr-only` descriptions (e.g., `Remove {itemName}`). Use this same variable for image `alt` attributes to ensure correct localization. 
## 2024-04-12 - Context-Aware ARIA Labels for Repeated Actions
**Learning:** Generic aria-labels like "Add to cart" in product lists are insufficient for screen readers because they don't provide context on *which* item is being added.
**Action:** Always inject contextual variables (like the product `title`) into `aria-label`s for repeated actions in lists/grids to ensure true accessibility (e.g., `aria-label="Add to cart Premium Widget"`).
