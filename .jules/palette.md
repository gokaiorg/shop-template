## 2024-04-04 - Context-aware Screen Reader Labels in Cart
**Learning:** In dynamically generated lists like shopping carts, generic `sr-only` labels ("Remove item", "Increase quantity") are unhelpful to screen reader users because they don't know *which* item is being targeted. Also, dynamic text components need their `alt` text and accessibility tags localized correctly.
**Action:** Always extract the dynamically localized item name and use it to build context-aware `sr-only` descriptions (e.g., `Remove {itemName}`). Use this same variable for image `alt` attributes to ensure correct localization. 
## 2025-04-15 - [Active Filter Accessibility]
**Learning:** Adding `aria-current="true"` to active category filter buttons significantly improves the screen reader experience, as previously the active state was only indicated visually or through `pointer-events-none`, leaving screen reader users unaware of the currently applied filter.
**Action:** When creating toggle groups, tabs, or filter lists, always include `aria-current="true"` (or `aria-pressed="true"`) on the currently active element to ensure semantic clarity for assistive technologies.
