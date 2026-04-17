## 2024-04-04 - Context-aware Screen Reader Labels in Cart
**Learning:** In dynamically generated lists like shopping carts, generic `sr-only` labels ("Remove item", "Increase quantity") are unhelpful to screen reader users because they don't know *which* item is being targeted. Also, dynamic text components need their `alt` text and accessibility tags localized correctly.
**Action:** Always extract the dynamically localized item name and use it to build context-aware `sr-only` descriptions (e.g., `Remove {itemName}`). Use this same variable for image `alt` attributes to ensure correct localization. 

## 2024-11-20 - Context-Aware Screen Reader Labels in Lists
**Learning:** For repeated lists (like product cards with "Add to cart" buttons), generic button text causes screen readers to redundantly read the same action without providing users context about what item the action applies to. Using dynamic `aria-label`s incorporating item titles creates a significantly more understandable accessibility experience.
**Action:** When creating repeated interactive elements in maps or lists, always include contextual data (e.g., `aria-label="Add to cart [Product Title]"`) on the element to ensure accessible navigation.
