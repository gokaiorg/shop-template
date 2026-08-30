"use server";

import { adminDb } from "@/lib/firebase-admin";
import { Order } from "@/types/database";
import { auth } from "@/auth";
import { getIsCartEnabled } from "@/config/brand.config";

export async function getRecentOrders(): Promise<Order[]> {
    if (!getIsCartEnabled()) {
        return [];
    }

    const session = await auth();
    const userRole = (session?.user?.role || "").toLowerCase();
    
    if (userRole !== "admin") {
        return [];
    }
    
    const snapshot = await adminDb.collection("orders")
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();
        
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date(data.createdAt).toISOString(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date(data.updatedAt || new Date()).toISOString(),
        } as Order;
    });
}

export async function getPendingOrdersCount(): Promise<number> {
    if (!getIsCartEnabled()) {
        return 0;
    }

    const session = await auth();
    const userRole = (session?.user?.role || "").toLowerCase();

    if (userRole !== "admin") {
        return 0;
    }

    const snapshot = await adminDb.collection("orders")
        .where("status", "==", "PENDING")
        .count()
        .get();
        
    return snapshot.data().count;
}
