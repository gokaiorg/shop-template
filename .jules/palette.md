## 2024-04-04 - Context-aware Screen Reader Labels in Cart
**Learning:** In dynamically generated lists like shopping carts, generic `sr-only` labels ("Remove item", "Increase quantity") are unhelpful to screen reader users because they don't know *which* item is being targeted. Also, dynamic text components need their `alt` text and accessibility tags localized correctly.
**Action:** Always extract the dynamically localized item name and use it to build context-aware `sr-only` descriptions (e.g., `Remove {itemName}`). Use this same variable for image `alt` attributes to ensure correct localization. 

## 2026-04-13 - Context-aware Screen Reader Labels on Add to Cart Buttons
**Learning:** Generic "Add to cart" buttons in product lists lack context for screen reader users, making it difficult to distinguish which item is being added.
**Action:** Always append the dynamically localized item name to the `aria-label` of "Add to cart" buttons (e.g., `Add to cart {itemName}`) in product cards or lists to provide clear context for assistive technologies.
