import { cache } from 'react';
import { adminDb } from '@/lib/firebase-admin';
import { Category } from '@/types/database';

export const serializeCategoryTimestamp = (ts: any): string | null => {
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

export const serializeCategoryDoc = (docId: string, data: Record<string, any>): Category => {
    return {
        id: docId,
        ...data,
        name: data.name || {},
        slug: data.slug || {},
        description: data.description || {},
        showInHeader: Boolean(data.showInHeader),
        order: typeof data.order === 'number' ? data.order : 0,
        status: data.status || 'published',
        createdAt: serializeCategoryTimestamp(data.createdAt),
        updatedAt: serializeCategoryTimestamp(data.updatedAt),
    } as Category;
};

/**
  * Retrieves categories configured for top navigation placement (showInHeader === true).
  * Wrapped with React cache for per-request memoization during SSR.
  */
export const getHeaderCategories = cache(async (): Promise<Category[]> => {
    try {
        const snapshot = await adminDb
            .collection('categories')
            .where('showInHeader', '==', true)
            .get();

        if (snapshot.empty) {
            return [];
        }

        const categories: Category[] = snapshot.docs
            .map((doc) => serializeCategoryDoc(doc.id, doc.data() || {}))
            .filter((cat) => cat.status !== 'draft')
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        return categories;
    } catch (error) {
        console.error('[GET_HEADER_CATEGORIES_ERROR]', error);
        return [];
    }
});

/**
  * Retrieves all published categories for mobile navigation and catalog menus.
  * Wrapped with React cache for per-request memoization during SSR.
  */
export const getAllPublishedCategories = cache(async (): Promise<Category[]> => {
    try {
        const snapshot = await adminDb
            .collection('categories')
            .orderBy('order', 'asc')
            .get();

        if (snapshot.empty) {
            return [];
        }

        return snapshot.docs
            .map((doc) => serializeCategoryDoc(doc.id, doc.data() || {}))
            .filter((cat) => (cat.status ?? 'published') === 'published');
    } catch (error) {
        console.error('[GET_ALL_PUBLISHED_CATEGORIES_ERROR]', error);
        return [];
    }
});

