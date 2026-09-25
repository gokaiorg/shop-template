"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getIsCartEnabled } from "@/config/brand.config";
import { getStoreSettings } from "@/lib/services/settings";
import { getStripe } from "@/lib/stripe";
import { toStripeUnitAmount } from "@/lib/currency";
import { getLocalizedField } from "@/lib/i18n";
import { headers } from "next/headers";
import { auth } from "@/auth";

export interface CheckoutItemInput {
    id: string;
    quantity: number;
    name?: Record<string, string>;
    nameFr?: string;
    nameEn?: string;
    price?: number;
    [key: string]: any;
}

export interface CheckoutSessionResult {
    success: boolean;
    url?: string;
    orderId?: string;
    sessionId?: string;
    error?: string;
}

/**
 * Creates a Stripe Hosted Checkout session after strictly verifying product prices
 * against the Firestore database to prevent Insecure Direct Object Reference (IDOR) attacks.
 */
export async function createCheckoutSession(
    items: CheckoutItemInput[],
    lang: string = "en"
): Promise<CheckoutSessionResult> {
    try {
        if (!getIsCartEnabled()) {
            throw new Error("E-commerce cart functionality is disabled on this instance.");
        }

        if (!Array.isArray(items) || items.length === 0) {
            throw new Error("No items in cart");
        }

        // Validate quantities strictly
        for (const item of items) {
            if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0 || item.quantity > 1000) {
                throw new Error("Invalid quantity provided");
            }
        }

        // CRITICAL SECURITY (Anti-IDOR): Query the database directly for product data.
        // Never trust prices or currency amounts supplied by the client.
        const productRefs = items.map((item) => adminDb.collection("products").doc(item.id));
        const productDocs = await adminDb.getAll(...productRefs);

        const productDocMap = new Map();
        productDocs.forEach((doc) => {
            productDocMap.set(doc.id, doc);
        });

        const verifiedItems = items.map((item) => {
            const productDoc = productDocMap.get(item.id);
            if (!productDoc || !productDoc.exists) {
                throw new Error(`Product not found: ${item.id}`);
            }

            const productData = productDoc.data();
            return {
                id: item.id,
                quantity: item.quantity,
                // Server-verified price from database
                price: Number(productData?.price) || 0,
                name: productData?.name || item.name,
                nameFr: productData?.nameFr || item.nameFr,
                nameEn: productData?.nameEn || item.nameEn,
            };
        });

        const totalAmount = verifiedItems.reduce(
            (acc, item) => acc + item.price * item.quantity,
            0
        );

        const session = await auth();
        const storeSettings = await getStoreSettings();
        const currency = (storeSettings.defaultCurrency || "EUR").toLowerCase();

        const orderRef = adminDb.collection("orders").doc();
        const orderId = orderRef.id;

        // Persist initial order with PENDING status
        await orderRef.set({
            id: orderId,
            status: "PENDING",
            totalAmount: totalAmount,
            currency: currency.toUpperCase(),
            userId: session?.user?.id || null,
            customerEmail: session?.user?.email || null,
            customerName: session?.user?.name || null,
            items: verifiedItems.map((item) => ({
                id: adminDb.collection("orders").doc().id,
                productId: item.id,
                quantity: item.quantity,
                price: item.price,
            })),
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Initialize Stripe Checkout session
        const stripe = getStripe();
        if (!stripe) {
            console.warn("[CHECKOUT] Stripe is not configured or secret key is missing");
            return { success: true, orderId };
        }

        // Determine application base URL
        let origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
        if (!origin) {
            const headerList = await headers();
            const host = headerList.get("x-forwarded-host") || headerList.get("host") || "localhost:3000";
            const protocol = headerList.get("x-forwarded-proto") || (process.env.NODE_ENV === "production" ? "https" : "http");
            origin = `${protocol}://${host}`;
        }

        // Construct line items with server-verified prices
        const line_items = verifiedItems.map((item) => {
            const itemTitle = getLocalizedField(item.name, lang) || item.nameEn || item.nameFr || "Product";
            const unitAmount = toStripeUnitAmount(item.price, currency);

            return {
                price_data: {
                    currency: currency,
                    product_data: {
                        name: itemTitle,
                        metadata: {
                            productId: item.id,
                        },
                    },
                    unit_amount: unitAmount,
                },
                quantity: item.quantity,
            };
        });

        // Stripe Hosted Checkout Session creation incorporating all fixed_by_ui field intents
        const checkoutSession = await stripe.checkout.sessions.create({
            ui_mode: "hosted",
            billing_address_collection: "auto",
            mode: "payment",
            line_items: line_items,
            success_url: `${origin}/${lang}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
            cancel_url: `${origin}/${lang}`,
            customer_email: session?.user?.email || undefined,
            client_reference_id: orderId,
            metadata: {
                orderId: orderId,
                integration_identifier: "shop-template",
                origin_context: "hosted_checkout",
                userId: session?.user?.id || "",
            },
        });

        if (checkoutSession.url) {
            await orderRef.update({
                stripeSessionId: checkoutSession.id,
            });
        }

        return {
            success: true,
            orderId,
            sessionId: checkoutSession.id,
            url: checkoutSession.url || undefined,
        };
    } catch (error: any) {
        console.error("[CHECKOUT_ACTION_ERROR]", error);
        return { success: false, error: error?.message || "Failed to initiate checkout" };
    }
}

// Backward-compatible alias for existing components
export const checkoutOrder = createCheckoutSession;
