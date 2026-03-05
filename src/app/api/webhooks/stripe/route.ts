import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
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
            await prisma.order.update({
                where: { id: orderId },
                data: {
                    status: "PAID",
                    customerEmail: session.customer_details?.email,
                    customerName: session.customer_details?.name,
                    stripeSessionId: session.id,
                },
            });
        } catch (error: any) {
            console.error(`[DATABASE_UPDATE_ERROR] ${error.message}`);
            return new NextResponse("Failed to update order", { status: 500 });
        }
    }

    return new NextResponse(null, { status: 200 });
}
