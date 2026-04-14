"use server";

import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import { headers } from "next/headers";

export async function createCheckoutSession(items: any[], lang: string) {
    try {
        // Fetch source of truth for products to avoid trusting client-provided prices
        const verifiedItems = await Promise.all(
            items.map(async (item) => {
                const quantity = Number(item.quantity);
                if (!Number.isInteger(quantity) || quantity <= 0) {
                    throw new Error(`Invalid quantity for product: ${item.id}`);
                }

                const productDoc = await adminDb.collection("products").doc(item.id).get();
                if (!productDoc.exists) {
                    throw new Error(`Product not found: ${item.id}`);
                }
                const productData = productDoc.data();
                return {
                    ...item,
                    quantity,
                    price: productData?.price || 0,
                    nameFr: productData?.nameFr || item.nameFr,
                    nameEn: productData?.nameEn || item.nameEn,
                };
            })
        );

        const totalAmount = verifiedItems.reduce(
            (acc, item) => acc + item.price * item.quantity,
            0
        );

        // 1. Create Order in Firestore
        const orderRef = adminDb.collection("orders").doc();
        const orderId = orderRef.id;

        await orderRef.set({
            id: orderId,
            status: "PENDING",
            totalAmount: totalAmount,
            userId: null,
            items: verifiedItems.map((item) => ({
                id: adminDb.collection("orders").doc().id, // Random ID
                productId: item.id,
                quantity: item.quantity,
                price: item.price,
            })),
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // 2. Create Stripe Checkout Session
        const headersList = await headers();
        const origin = headersList.get('origin') || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: verifiedItems.map((item) => ({
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: lang === "fr" ? item.nameFr : item.nameEn,
                        images: item.images && item.images.length > 0 ? [item.images[0]] : [],
                        metadata: {
                            productId: item.id
                        }
                    },
                    unit_amount: Math.round(item.price * 100), // Stripe expects cents
                },
                quantity: item.quantity,
            })),
            mode: "payment",
            success_url: `${origin}/${lang}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/${lang}/cart`,
            metadata: {
                orderId: orderId,
            },
        });

        if (!session.url) {
            throw new Error("Failed to create Stripe session URL");
        }

        return { url: session.url };
    } catch (error) {
        console.error("[CHECKOUT_ACTION_ERROR]", error);
        throw new Error("Failed to initiate checkout");
    }
}
