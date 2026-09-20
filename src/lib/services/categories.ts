import { cache } from 'react';
import { adminDb } from '@/lib/firebase-admin';
import { Category } from '@/types/database';

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
            .map((doc) => {
                const data = doc.data() || {};
                return {
                    id: doc.id,
                    ...data,
                    name: data.name || {},
                    slug: data.slug || {},
                    description: data.description || {},
                    showInHeader: Boolean(data.showInHeader),
                    order: typeof data.order === 'number' ? data.order : 0,
                    status: data.status || 'published',
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
                    updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
                } as Category;
            })
            .filter((cat) => cat.status !== 'draft')
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        return categories;
    } catch (error) {
        console.error('[GET_HEADER_CATEGORIES_ERROR]', error);
        return [];
    }
});
