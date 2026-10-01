import { cache } from 'react';
import { adminDb } from '@/lib/firebase-admin';
import { Product, Category } from '@/types/database';

export const serializeProductTimestamp = (ts: any): string | null => {
    if (!ts) return null;
    if (typeof ts.toDate === 'function') {
        return ts.toDate().toISOString();
    }
    if (typeof ts === 'object' && typeof ts._seconds === 'number') {
        return new Date(ts._seconds * 1000).toISOString();
    }
    if (typeof ts === 'string') {
        return ts;
    }
    if (ts instanceof Date) {
        return ts.toISOString();
    }
    return null;
};

import { isProductInStock } from '@/lib/products';
export { isProductInStock };

/**
 * Retrieves in-stock products for the homepage grid.
 * Excludes products with stock <= 0 or status === 'out-of-stock'.
 * Wrapped with React cache for per-request memoization.
 */
export const getHomeProducts = cache(async (categoryMap?: Map<string, Category>): Promise<Product[]> => {
    try {
        const snapshot = await adminDb
            .collection('products')
            .orderBy('createdAt', 'desc')
            .get();

        if (snapshot.empty) {
            return [];
        }

        const rawProducts: Product[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            const catIds = data.categoryIds || (data.categoryId ? [data.categoryId] : []);
            const assignedCats = categoryMap
                ? (catIds.map((id: string) => categoryMap.get(id)).filter(Boolean) as Category[])
                : [];

            return {
                ...data,
                id: doc.id,
                order: typeof data.order === 'number' ? data.order : 0,
                categoryIds: catIds,
                categories: assignedCats,
                category: assignedCats[0] || (categoryMap && data.categoryId ? categoryMap.get(data.categoryId) : null) || null,
                createdAt: serializeProductTimestamp(data.createdAt),
                updatedAt: serializeProductTimestamp(data.updatedAt),
            } as Product;
        });

        // 1. Filter out-of-stock items
        const inStockProducts = rawProducts.filter(isProductInStock);

        // 2. Sort by custom order first, then newest first
        const sortedProducts = inStockProducts.sort((a, b) => {
            const orderDiff = (a.order ?? 0) - (b.order ?? 0);
            if (orderDiff !== 0) return orderDiff;
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

        return sortedProducts;
    } catch (error) {
        console.error('[GET_HOME_PRODUCTS_ERROR]', error);
        return [];
    }
});
