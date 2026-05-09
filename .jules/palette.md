## 2024-04-04 - Context-aware Screen Reader Labels in Cart
**Learning:** In dynamically generated lists like shopping carts, generic `sr-only` labels ("Remove item", "Increase quantity") are unhelpful to screen reader users because they don't know *which* item is being targeted. Also, dynamic text components need their `alt` text and accessibility tags localized correctly.
**Action:** Always extract the dynamically localized item name and use it to build context-aware `sr-only` descriptions (e.g., `Remove {itemName}`). Use this same variable for image `alt` attributes to ensure correct localization. 

## $(date +%Y-%m-%d) - Screen Reader Double-Reading with Notification Badges
**Learning:** Adding a notification badge (like a cart item count) next to an icon button often causes screen readers to read the count out of context (e.g., just reading "3" before or after "Open cart").
**Action:** Hide visual notification badges from screen readers with `aria-hidden="true"` and incorporate their data directly into the parent element's `sr-only` text to prevent double-reading and provide context (e.g., "Open cart (3 items)").

## $(date +%Y-%m-%d) - Consistent SSR/Hydration Skeletons for Interactive Components
**Learning:** Using generic HTML elements (like a `<div>`) as a loading skeleton or SSR fallback for complex interactive components (like shadcn/radix buttons with variants) causes layout shifts and semantic inconsistency before hydration.
**Action:** For SSR/unmounted fallback states of interactive components, use structurally equivalent disabled semantic elements (e.g., a disabled `Button` with the same sizing variants) rather than generic divs.
## 2025-04-28 - Active Navigation State
**Learning:** Next.js Server Components require `"use client"` when using `usePathname()` to conditionally render active navigation states. However, adding this boundary at the navigation component level (`PrimaryNav.tsx`) is very safe and prevents having to convert the entire layout to a client component.
**Action:** Always verify if a component needs a client boundary before adding hooks, and isolate the client boundary to the smallest possible leaf component.

## 2025-04-28 - Accessible Skeletons vs Layout Shift
**Learning:** Using a structurally equivalent disabled component (e.g., `<Button disabled>`) instead of a generic `<div className="animate-pulse w-16">` as an SSR/loading fallback for an icon button provides significantly better semantics for screen readers and avoids width-based Cumulative Layout Shift (CLS) in the header.
**Action:** Default to using disabled variants of the actual interactive elements for loading skeletons rather than arbitrary div shapes.

## 2024-05-09 - [Password Toggle Icons]
**Learning:** Replaced text "Show"/"Hide" labels with `Eye` and `EyeOff` icons from `lucide-react` in the password toggle input. Ensure `aria-hidden="true"` on the icons and keep `aria-label` on the button itself.
**Action:** Consistently use recognized icons for password visibility toggles while preserving screen reader accessibility. Also, be mindful of `pnpm` versions matching the lockfile version to prevent massive unintended rewrites when running `pnpm install` during testing steps.
