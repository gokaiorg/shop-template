"use server";

import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export async function createCheckoutSession(items: any[], lang: string) {
    try {
        const totalAmount = items.reduce(
            (acc, item) => acc + item.price * item.quantity,
            0
        );

        // 1. Create Order in Prisma
        const order = await prisma.order.create({
            data: {
                status: "PENDING",
                totalAmount: totalAmount,
                userId: null,
                items: {
                    create: items.map((item) => ({
                        productId: item.id,
                        quantity: item.quantity,
                        price: item.price,
                    })),
                },
            },
        });

        // 2. Create Stripe Checkout Session
        const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: items.map((item) => ({
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: lang === "fr" ? item.nameFr : item.nameEn,
                        images: item.images && item.images.length > 0 ? [item.images[0]] : [],
                    },
                    unit_amount: Math.round(item.price * 100), // Stripe expects cents
                },
                quantity: item.quantity,
            })),
            mode: "payment",
            success_url: `${origin}/${lang}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/${lang}/cart`,
            metadata: {
                orderId: order.id,
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
