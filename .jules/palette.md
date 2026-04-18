## 2024-04-04 - Context-aware Screen Reader Labels in Cart
**Learning:** In dynamically generated lists like shopping carts, generic `sr-only` labels ("Remove item", "Increase quantity") are unhelpful to screen reader users because they don't know *which* item is being targeted. Also, dynamic text components need their `alt` text and accessibility tags localized correctly.
**Action:** Always extract the dynamically localized item name and use it to build context-aware `sr-only` descriptions (e.g., `Remove {itemName}`). Use this same variable for image `alt` attributes to ensure correct localization. 
## 2024-04-18 - Auth Input Autofill
**Learning:** Browser password managers and native autofill systems require semantic attributes beyond just `type="email"` or `type="password"` to function reliably. Omitting `name` and `autoComplete` attributes on custom input components causes a frustrating login UX where users must manually retype credentials.
**Action:** Always include `id`, `name`, and explicit `autoComplete` attributes (e.g., `email`, `current-password`) when implementing or modifying authentication forms to ensure seamless password manager integration.
