import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { adminDb } from "@/lib/firebase-admin";
import Stripe from "stripe";

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get("Stripe-Signature") as string;

    let event: Stripe.Event;

    try {
        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            throw new Error("STRIPE_WEBHOOK_SECRET is not defined");
        }

        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (error: any) {
        console.error(`[STRIPE_WEBHOOK_ERROR] ${error.message}`);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    const session = event.data.object as Stripe.Checkout.Session;

    if (event.type === "checkout.session.completed") {
        const orderId = session.metadata?.orderId;

        if (!orderId) {
            return new NextResponse("Order ID not found in session metadata", {
                status: 400,
            });
        }

        try {
            const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
                expand: ['data.price.product']
            });

            const itemsList = lineItems.data.map(item => {
                const product = item.price?.product as Stripe.Product | undefined;
                return {
                    id: adminDb.collection('orders').doc().id,
                    productId: product?.metadata?.productId || "unknown",
                    quantity: item.quantity || 1,
                    price: item.price?.unit_amount ? item.price.unit_amount / 100 : 0
                };
            });

            await adminDb.collection("orders").doc(orderId).set({
                id: orderId,
                status: "PAID",
                totalAmount: session.amount_total ? session.amount_total / 100 : 0,
                userId: null,
                items: itemsList,
                customerEmail: session.customer_details?.email || null,
                customerName: session.customer_details?.name || null,
                stripeSessionId: session.id,
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        } catch (error: any) {
            console.error(`[DATABASE_UPDATE_ERROR] ${error.message}`);
            return new NextResponse("Failed to update order", { status: 500 });
        }
    }

    return new NextResponse(null, { status: 200 });
}
