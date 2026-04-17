## 2024-04-04 - Context-aware Screen Reader Labels in Cart
**Learning:** In dynamically generated lists like shopping carts, generic `sr-only` labels ("Remove item", "Increase quantity") are unhelpful to screen reader users because they don't know *which* item is being targeted. Also, dynamic text components need their `alt` text and accessibility tags localized correctly.
**Action:** Always extract the dynamically localized item name and use it to build context-aware `sr-only` descriptions (e.g., `Remove {itemName}`). Use this same variable for image `alt` attributes to ensure correct localization. 
## 2026-04-17 - Component Isolation for Playwright Testing
**Learning:** When attempting to render components like  in Next.js using Playwright for visual testing, wrapping them in default layouts may trigger authentication or environment errors (like Firebase missing secrets). Creating an isolated test route (e.g., ) without global wrappers is an effective bypass to verify purely visual/UX changes.
**Action:** Use isolated test routes for component-level visual verification when the full application environment is difficult to bootstrap in the test environment.

## 2024-05-14 - Component Isolation for Playwright Testing
**Learning:** When attempting to render components like `PrimaryNav` in Next.js using Playwright for visual testing, wrapping them in default layouts may trigger authentication or environment errors (like Firebase missing secrets). Creating an isolated test route (e.g., `src/app/[lang]/test-nav/page.tsx`) without global wrappers is an effective bypass to verify purely visual/UX changes.
**Action:** Use isolated test routes for component-level visual verification when the full application environment is difficult to bootstrap in the test environment.
