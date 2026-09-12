"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getIsCartEnabled } from "@/config/brand.config";
import { getStoreSettings } from "@/lib/services/settings";
import { getStripe } from "@/lib/stripe";
import { toStripeUnitAmount } from "@/lib/currency";
import { getLocalizedField } from "@/lib/i18n";
import { headers } from "next/headers";
import { auth } from "@/auth";

export async function checkoutOrder(
    items: { id: string; quantity: number; name?: Record<string, string>; nameFr?: string; nameEn?: string; price?: number }[],
    lang: string = "en"
) {
    try {
        if (!getIsCartEnabled()) {
            throw new Error("E-commerce cart functionality is disabled on this instance.");
        }

        if (!Array.isArray(items) || items.length === 0) {
            throw new Error("No items in cart");
        }

        for (const item of items) {
            if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0 || item.quantity > 1000) {
                throw new Error("Invalid quantity provided");
            }
        }

        const productRefs = items.map((item) => adminDb.collection("products").doc(item.id));
        const productDocs = await adminDb.getAll(...productRefs);

        const productDocMap = new Map();
        productDocs.forEach(doc => {
            productDocMap.set(doc.id, doc);
        });

        const verifiedItems = items.map((item) => {
            const productDoc = productDocMap.get(item.id);
            if (!productDoc || !productDoc.exists) {
                throw new Error(`Product not found: ${item.id}`);
            }

            const productData = productDoc.data();
            return {
                ...item,
                price: productData?.price || 0,
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
        const currency = (storeSettings.defaultCurrency || "THB").toLowerCase();

        const orderRef = adminDb.collection("orders").doc();
        const orderId = orderRef.id;

        await orderRef.set({
            id: orderId,
            status: "PENDING",
            totalAmount: totalAmount,
            currency: currency.toUpperCase(),
            userId: session?.user?.id || null,
            customerEmail: session?.user?.email || null,
            customerName: session?.user?.name || null,
            items: verifiedItems.map((item) => ({
                id: adminDb.collection("orders").doc().id, // Random ID
                productId: item.id,
                quantity: item.quantity,
                price: item.price,
            })),
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Initialize Stripe Checkout session if Stripe is configured
        const stripe = getStripe();
        let checkoutUrl: string | undefined = undefined;

        if (stripe) {
            const headerList = await headers();
            const host = headerList.get("host") || "localhost:3000";
            const protocol = process.env.NODE_ENV === "production" ? "https" : "http";
            const origin = `${protocol}://${host}`;

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

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ["card"],
                line_items: line_items,
                mode: "payment",
                success_url: `${origin}/${lang}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
                cancel_url: `${origin}/${lang}`,
                metadata: {
                    orderId: orderId,
                },
            });

            if (session.url) {
                checkoutUrl = session.url;
                await orderRef.update({
                    stripeSessionId: session.id,
                });
            }
        }

        return { success: true, orderId, url: checkoutUrl };
    } catch (error: any) {
        console.error("[CHECKOUT_ACTION_ERROR]", error);
        return { success: false, error: error?.message || "Failed to initiate checkout" };
    }
}
