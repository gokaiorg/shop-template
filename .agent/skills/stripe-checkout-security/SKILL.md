---
name: stripe-checkout-security
description: Enforce Anti-IDOR server-side price verification in checkout, currency conversion via toStripeUnitAmount(), Stripe-Signature webhook verification for PAID orders, and secured ISR cache revalidation.
---

## Overview
Enforces security rules for Stripe Hosted Checkout session creation, monetary unit conversion, webhook signature verification, and on-demand ISR cache invalidation.

## Strict Anti-IDOR Price Verification (`src/actions/checkout.ts` & `POST /api/checkout`)
- Verify cart availability first via `getIsCartEnabled()` (`@/config/brand.config`).
- Validate item quantities strictly as positive safe integers (`1 <= quantity <= 1000`).
- **Never trust prices, titles, or currency amounts sent by the client.**
- Always batch-fetch product documents directly from Firestore (`adminDb.collection("products")`, `adminDb.getAll(...productRefs)`) and recompute:
  - Unit `price` (`Number(productData?.price) || 0`)
  - Localized product title via `getLocalizedField(item.name, lang) || item.nameEn || item.nameFr || "Product"`
  - Order `totalAmount` from server-verified prices and quantities
- Persist the initial order in Firestore `orders` collection with `status: "PENDING"` before creating the Stripe Checkout Session (`ui_mode: "hosted"`, `mode: "payment"`), storing `orderId` in both `client_reference_id` and `metadata.orderId`.

## Monetary Conversion (`src/lib/currency.ts`)
- Resolve store currency from `getStoreSettings()` (`defaultCurrency || "EUR"`).
- Always convert server-verified decimal prices to Stripe integer minor units using `toStripeUnitAmount(item.price, currency)` from `@/lib/currency` when building `line_items[].price_data.unit_amount`.

## Webhook Signature Validation (`src/app/api/webhooks/stripe/route.ts`)
- The `POST /api/webhooks/stripe` handler is the **sole authority** allowed to transition an order status to `PAID`.
- Read the raw request body via `await req.text()` and the `Stripe-Signature` header.
- Verify the event authenticity using `stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET)`. Reject any invalid signature with HTTP `400`.
- On `checkout.session.completed`, extract `orderId` from `session.metadata?.orderId || session.client_reference_id`, expand line items via `stripe.checkout.sessions.listLineItems`, and update the Firestore `orders/{orderId}` document with `status: "PAID"`.

## On-Demand ISR Revalidation (`/api/revalidate`)
- Cache invalidation after catalog mutations or external syncs (`src/scripts/sync-sheet.ts`) must call `/api/revalidate` authenticated with `REVALIDATION_SECRET` and verify an HTTP `200` response.
