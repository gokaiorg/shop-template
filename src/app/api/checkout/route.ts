import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { getIsCartEnabled } from "@/config/brand.config";
import { getStoreSettings } from "@/lib/services/settings";
import { getStripe } from "@/lib/stripe";
import { toStripeUnitAmount } from "@/lib/currency";
import { getLocalizedField } from "@/lib/i18n";

export async function POST(req: Request) {
    try {
        if (!getIsCartEnabled()) {
            return NextResponse.json(
                { error: "E-commerce cart functionality is disabled on this instance." },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { items, lang = "en" } = body;

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: "No items in cart" }, { status: 400 });
        }

        for (const item of items) {
            if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0 || item.quantity > 1000) {
                return NextResponse.json({ error: "Invalid quantity provided" }, { status: 400 });
            }
        }

        const productRefs = items.map((item: any) => adminDb.collection("products").doc(item.id));
        const productDocs = await adminDb.getAll(...productRefs);

        const productDocMap = new Map();
        productDocs.forEach(doc => {
            productDocMap.set(doc.id, doc);
        });

        const verifiedItems = items.map((item: any) => {
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
            (acc: number, item: any) => acc + item.price * item.quantity,
            0
        );

        // Fetch dynamic currency from Firestore settings
        const storeSettings = await getStoreSettings();
        const currency = (storeSettings.defaultCurrency || "THB").toLowerCase();

        const orderRef = adminDb.collection("orders").doc();
        const orderId = orderRef.id;

        await orderRef.set({
            id: orderId,
            status: "PENDING",
            totalAmount: totalAmount,
            currency: currency.toUpperCase(),
            userId: null,
            items: verifiedItems.map((item: any) => ({
                id: adminDb.collection("orders").doc().id,
                productId: item.id,
                quantity: item.quantity,
                price: item.price,
            })),
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        // Initialize Stripe Checkout session if Stripe is configured
        const stripe = getStripe();
        let checkoutUrl: string | undefined = undefined;

        if (stripe) {
            const urlObj = new URL(req.url);
            const origin = urlObj.origin;

            const line_items = verifiedItems.map((item: any) => {
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

        return NextResponse.json({ success: true, orderId, url: checkoutUrl });
    } catch (error: any) {
        console.error("[API_CHECKOUT_ERROR]", error);
        return NextResponse.json(
            { error: error?.message || "Failed to process checkout" },
            { status: 500 }
        );
    }
}
