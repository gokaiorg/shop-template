"use server";

import { adminDb } from "@/lib/firebase-admin";

export async function checkoutOrder(items: { id: string, quantity: number, nameFr?: string, nameEn?: string, price?: number }[]) {
    try {
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
                nameFr: productData?.nameFr || item.nameFr,
                nameEn: productData?.nameEn || item.nameEn,
            };
        });

        const totalAmount = verifiedItems.reduce(
            (acc, item) => acc + item.price * item.quantity,
            0
        );

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

        return { success: true, orderId };
    } catch (error) {
        console.error("[CHECKOUT_ACTION_ERROR]", error);
        return { success: false, error: "Failed to initiate checkout" };
    }
}
