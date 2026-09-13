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

    // Normalize multilingual slug
    let slug: Record<string, string> = {};
    if (data.slug && typeof data.slug === 'object') {
        slug = data.slug;
    } else if (typeof data.slug === 'string' && data.slug.trim()) {
        slug = { en: data.slug, fr: data.slug };
    } else {
        const fallback = doc.id;
        slug = { en: fallback, fr: fallback };
    }
    if (data.slug_en && !slug.en) slug.en = data.slug_en;
    if (data.slug_fr && !slug.fr) slug.fr = data.slug_fr;

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
        slug_en: data.slug_en || slug.en,
        slug_fr: data.slug_fr || slug.fr,
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

        // 2. Query nested slug maps (e.g. slug.en, slug.fr)
        const enSnap = await adminDb.collection("pages").where("slug.en", "==", slug).limit(1).get();
        if (!enSnap.empty) {
            return formatPageDoc(enSnap.docs[0]);
        }

        const frSnap = await adminDb.collection("pages").where("slug.fr", "==", slug).limit(1).get();
        if (!frSnap.empty) {
            return formatPageDoc(frSnap.docs[0]);
        }

        // 3. Fallback: Check flat slug field (legacy string)
        const querySnap = await adminDb.collection("pages").where("slug", "==", slug).limit(1).get();
        if (!querySnap.empty) {
            return formatPageDoc(querySnap.docs[0]);
        }

        // 4. Fallback: Check legacy localized slug fields
        const legacyFrSnap = await adminDb.collection("pages").where("slug_fr", "==", slug).limit(1).get();
        if (!legacyFrSnap.empty) {
            return formatPageDoc(legacyFrSnap.docs[0]);
        }

        const legacyEnSnap = await adminDb.collection("pages").where("slug_en", "==", slug).limit(1).get();
        if (!legacyEnSnap.empty) {
            return formatPageDoc(legacyEnSnap.docs[0]);
        }

        // 5. Fallback: scan collection in case slug is in another language key
        const allPages = await adminDb.collection("pages").get();
        for (const d of allPages.docs) {
            const dData = d.data();
            if (dData.slug && typeof dData.slug === 'object') {
                if (Object.values(dData.slug).includes(slug)) {
                    return formatPageDoc(d);
                }
            }
        }
    } catch (error) {
        console.error('[GET_PAGE_BY_SLUG_ERROR]', error);
    }

    return null;
});
