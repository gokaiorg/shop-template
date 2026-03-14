## 2024-05-16 - Context-Aware Screen Reader Labels in Lists
**Learning:** When using generic `sr-only` labels (like "Increase quantity" or "Remove item") within list items, screen reader users miss crucial context about *which* item they are modifying. Even when visual context implies the association, screen reader context is strictly linear.
**Action:** Always extract the relevant identifier (e.g., the localized product name `itemName`) and inject it into `sr-only` labels and `aria-label`s for interactive list controls (e.g., "Remove {itemName}").
