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
        heroBackgroundImageUrl: brand.assets?.heroBanner || (brand.assets as any)?.banner || '',
        catalogTitle: {
            en: 'Shop',
            fr: 'Boutique',
        },
        catalogDescription: {
            en: '',
            fr: '',
        },
        catalogSlug: 'shop',
        catalogBannerUrl: brand.assets?.heroBanner || (brand.assets as any)?.banner || '',
        footerDescription: {
            en: brand.identity.description?.en || '',
            fr: brand.identity.description?.fr || '',
        },
        footerRightMenuTitle: 'Legal',
        socialLinks: (brand.navigation?.socials || []).map((s: { platform?: string; url?: string }) => ({
            platform: s.platform || '',
            url: s.url || '',
        })),
        defaultTheme: 'system',
        defaultCurrency: 'THB',
        vendors: [],
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
                heroBackgroundImageUrl: typeof data?.heroBackgroundImageUrl === 'string' ? data.heroBackgroundImageUrl : fallbackSettings.heroBackgroundImageUrl,
                catalogTitle: (data?.catalogTitle && typeof data.catalogTitle === 'object') ? data.catalogTitle : fallbackSettings.catalogTitle,
                catalogDescription: (data?.catalogDescription && typeof data.catalogDescription === 'object') ? data.catalogDescription : fallbackSettings.catalogDescription,
                catalogSlug: (typeof data?.catalogSlug === 'string' && data.catalogSlug.trim().length > 0) ? data.catalogSlug.trim().toLowerCase() : fallbackSettings.catalogSlug,
                catalogBannerUrl: typeof data?.catalogBannerUrl === 'string' ? data.catalogBannerUrl : fallbackSettings.catalogBannerUrl,
                footerDescription: (data?.footerDescription && typeof data.footerDescription === 'object') ? data.footerDescription : fallbackSettings.footerDescription,
                footerRightMenuTitle: typeof data?.footerRightMenuTitle === 'string' && data.footerRightMenuTitle.trim() ? data.footerRightMenuTitle : fallbackSettings.footerRightMenuTitle,
                socialLinks: Array.isArray(data?.socialLinks) ? data.socialLinks : fallbackSettings.socialLinks,
                defaultTheme: data?.defaultTheme ?? fallbackSettings.defaultTheme,
                defaultCurrency: data?.defaultCurrency ?? fallbackSettings.defaultCurrency,
                vendors: Array.isArray(data?.vendors) ? data.vendors : fallbackSettings.vendors,
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
export async function saveStoreSettings(settings: Partial<Omit<StoreSettings, 'id'>>): Promise<void> {
    const docRef = adminDb.collection(SETTINGS_COLLECTION).doc(STORE_FRONT_DOC_ID);
    await docRef.set({
        ...settings,
        updatedAt: new Date(),
    }, { merge: true });
}
