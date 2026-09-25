# 💳 Stripe Hosted Checkout Integration - Next Steps & Configuration

This document outlines the required configuration, security best practices, and validation steps for the Stripe Hosted Checkout integration on **Shop Template** (Next.js 16 App Router).

---

## 🔑 1. Environment Variables Configuration

Ensure the following variables are defined in your environment files (`.env.local`, `.env.[brand]`) and in your production secret store (Google Cloud Secret Manager / Cloud Run):

| Variable | Scope | Description | Example |
| :--- | :--- | :--- | :--- |
| `STRIPE_SECRET_KEY` | Server-only | Secret API key used by Server Actions & Route Handlers | `sk_test_51...` |
| `STRIPE_WEBHOOK_SECRET` | Server-only | Webhook signing secret for event signature verification | `whsec_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Public / Client | Publishable API key | `pk_test_51...` |
| `NEXT_PUBLIC_APP_URL` | Public / Server | Canonical base URL used for success & cancel redirects | `https://yourdomain.com` |
| `NEXT_PUBLIC_ENABLE_CART` | Public / Server | Feature flag enabling e-commerce & checkout features | `"true"` |

> [!WARNING]
> **Never** prefix `STRIPE_SECRET_KEY` or `STRIPE_WEBHOOK_SECRET` with `NEXT_PUBLIC_`. These must remain strictly private to the server.

---

## 🛡️ 2. Security & Anti-IDOR Implementation

The server action [`createCheckoutSession`](file:///Users/home/GitWorks/shop-template/src/actions/checkout.ts) incorporates strict architectural guardrails:
1. **Zero Client-Price Trust (Anti-IDOR):** The server action ignores any prices sent from the client cart. It performs a batch query directly on the Firestore database (`products` collection) to resolve genuine product prices.
2. **Quantity Sanitization:** Each quantity is verified to be a positive safe integer (`1 <= quantity <= 1000`).
3. **Webhook Cryptographic Verification:** All incoming events in [`/api/webhooks/stripe`](file:///Users/home/GitWorks/shop-template/src/app/api/webhooks/stripe/route.ts) are validated using `stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)` before processing.

---

## ⚙️ 3. Field Intents (Hosted Checkout Configuration)

The following parameters are implemented in `src/actions/checkout.ts`:
- **UI Mode:** `ui_mode: "hosted"` (full-page Stripe redirect).
- **Billing Address Collection:** `billing_address_collection: "auto"`.
- **Payment Mode:** `mode: "payment"`.
- **Dynamic URLs:** 
  - `success_url`: `${origin}/${lang}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`
  - `cancel_url`: `${origin}/${lang}`
- **Metadata Context:**
  - `orderId`: Firestore document reference ID.
  - `integration_identifier`: `"shop-template"`.
  - `origin_context`: `"hosted_checkout"`.
  - `userId`: Authenticated customer ID (if logged in).

---

## 🧪 4. Local Testing with Stripe CLI

To test webhook processing locally without deploying to public HTTPS:

1. **Install & Authenticate Stripe CLI:**
   ```bash
   brew install stripe/stripe-cli/stripe
   stripe login
   ```

2. **Forward Webhook Events to Next.js:**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   *Note down the temporary webhook signing secret printed by the CLI (`whsec_...`) and place it in your local `.env`.*

3. **Trigger a Test Webhook Event:**
   ```bash
   stripe trigger checkout.session.completed
   ```

4. **Verify:** Check your terminal to confirm the webhook returns `200 OK` and updates the order status to `PAID` in Firestore.

---

## 🚀 5. Production Webhook Setup

1. Open the [Stripe Dashboard Webhooks](https://dashboard.stripe.com/webhooks).
2. Click **Add endpoint**.
3. Set the Endpoint URL to:
   ```
   https://<your-domain>/api/webhooks/stripe
   ```
4. Select the events to listen to:
   - `checkout.session.completed`
5. Copy the **Signing secret** (`whsec_...`).
6. Add `STRIPE_WEBHOOK_SECRET` to your production environment variables (e.g. via GCP Secret Manager or Cloud Run service configuration).

---

## 📋 6. Next Steps & Post-Payment Customization

In [`src/app/api/webhooks/stripe/route.ts`](file:///Users/home/GitWorks/shop-template/src/app/api/webhooks/stripe/route.ts), customize the `checkout.session.completed` handler:
- [ ] Connect transactional email service (Resend, SendGrid, Postmark) to send order confirmation to `session.customer_details.email`.
- [ ] Decrement product inventory count upon payment success.
- [ ] Trigger third-party shipping / fulfillment APIs or Slack alerts.
