import { cache } from 'react';
import { adminDb } from '@/lib/firebase-admin';
import { StoreSettings } from '@/types/database';
import { getActiveBrand } from '@/config/brand.config';

export const SETTINGS_COLLECTION = 'settings';
export const STORE_FRONT_DOC_ID = 'store_front';

/**
 * Retrieves the store_front settings document from Firestore.
 * Wrapped with React cache for per-request memoization during SSR.
 * If not present in Firestore, returns fallback values derived from active brand configuration.
 */
export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
    const brand = getActiveBrand();
    const fallbackSettings: StoreSettings = {
        id: STORE_FRONT_DOC_ID,
        brandName: brand.identity.name || '',
        logoUrl: brand.assets.logo.src || '',
        faviconUrl: brand.assets.favicon || '',
        heroTitle: {
            en: brand.identity.tagline?.en || brand.identity.name || '',
            fr: brand.identity.tagline?.fr || brand.identity.name || '',
        },
        heroDescription: {
            en: brand.identity.description?.en || '',
            fr: brand.identity.description?.fr || '',
        },
    };

    try {
        const docSnap = await adminDb.collection(SETTINGS_COLLECTION).doc(STORE_FRONT_DOC_ID).get();
        if (docSnap.exists) {
            const data = docSnap.data();
            return {
                id: docSnap.id,
                brandName: data?.brandName ?? fallbackSettings.brandName,
                logoUrl: data?.logoUrl ?? fallbackSettings.logoUrl,
                faviconUrl: data?.faviconUrl ?? fallbackSettings.faviconUrl,
                heroTitle: (data?.heroTitle && typeof data.heroTitle === 'object') ? data.heroTitle : fallbackSettings.heroTitle,
                heroDescription: (data?.heroDescription && typeof data.heroDescription === 'object') ? data.heroDescription : fallbackSettings.heroDescription,
                updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data?.updatedAt,
            };
        }
    } catch (error) {
        console.error('[SETTINGS_SERVICE_GET_ERROR]', error);
    }

    return fallbackSettings;
});

/**
 * Persists store_front settings into Firestore.
 */
export async function saveStoreSettings(settings: Omit<StoreSettings, 'id'>): Promise<void> {
    const docRef = adminDb.collection(SETTINGS_COLLECTION).doc(STORE_FRONT_DOC_ID);
    await docRef.set({
        ...settings,
        updatedAt: new Date(),
    }, { merge: true });
}
