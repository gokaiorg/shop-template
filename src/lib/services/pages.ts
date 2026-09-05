import { cache } from 'react';
import { adminDb } from '@/lib/firebase-admin';
import { Page } from '@/types/database';

/**
 * Normalizes raw Firestore document data into a consistent Page interface.
 */
export function formatPageDoc(doc: FirebaseFirestore.DocumentSnapshot): Page {
    const data = doc.data() || {};
    
    // Normalize multilingual title
    let title: Record<string, string> = {};
    if (data.title && typeof data.title === 'object') {
        title = data.title;
    } else {
        if (data.title_en) title.en = data.title_en;
        if (data.title_fr) title.fr = data.title_fr;
    }

    // Normalize multilingual content
    let content: Record<string, string> = {};
    if (data.content && typeof data.content === 'object') {
        content = data.content;
    } else {
        if (data.content_en) content.en = data.content_en;
        if (data.content_fr) content.fr = data.content_fr;
    }

    const slug = data.slug || doc.id;
    const status = (data.status === 'draft' || data.status === 'published') ? data.status : 'published';

    return {
        id: doc.id,
        slug,
        title,
        content,
        status,
        showInHeader: Boolean(data.showInHeader),
        showInFooter: Boolean(data.showInFooter),
        order: typeof data.order === 'number' ? data.order : 0,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        title_en: data.title_en || title.en,
        title_fr: data.title_fr || title.fr,
        content_en: data.content_en || content.en,
        content_fr: data.content_fr || content.fr,
        meta_title_en: data.meta_title_en,
        meta_title_fr: data.meta_title_fr,
        meta_description_en: data.meta_description_en,
        meta_description_fr: data.meta_description_fr,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    };
}

/**
 * Retrieves all published pages for public storefront navigation and routing.
 * Cached per-request with React.cache.
 */
export const getPublishedPages = cache(async (): Promise<Page[]> => {
    try {
        const snapshot = await adminDb.collection("pages")
            .where("status", "==", "published")
            .get();

        return snapshot.docs
            .map(formatPageDoc)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    } catch (error) {
        console.error('[GET_PUBLISHED_PAGES_ERROR]', error);
        return [];
    }
});

/**
 * Retrieves a single page by its slug.
 * Cached per-request with React.cache.
 */
export const getPageBySlug = cache(async (slug: string): Promise<Page | null> => {
    if (!slug) return null;

    try {
        // 1. Try matching direct document ID
        const docRef = adminDb.collection("pages").doc(slug);
        const docSnap = await docRef.get();
        if (docSnap.exists) {
            return formatPageDoc(docSnap);
        }

        // 2. Try querying by slug field
        const querySnap = await adminDb.collection("pages").where("slug", "==", slug).limit(1).get();
        if (!querySnap.empty) {
            return formatPageDoc(querySnap.docs[0]);
        }

        // 3. Fallback: Check localized slug fields if legacy
        const legacyFrSnap = await adminDb.collection("pages").where("slug_fr", "==", slug).limit(1).get();
        if (!legacyFrSnap.empty) {
            return formatPageDoc(legacyFrSnap.docs[0]);
        }

        const legacyEnSnap = await adminDb.collection("pages").where("slug_en", "==", slug).limit(1).get();
        if (!legacyEnSnap.empty) {
            return formatPageDoc(legacyEnSnap.docs[0]);
        }
    } catch (error) {
        console.error('[GET_PAGE_BY_SLUG_ERROR]', error);
    }

    return null;
});
