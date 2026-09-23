import { cache } from 'react';
import { adminDb } from '@/lib/firebase-admin';
import { StoreSettings } from '@/types/database';
import { getActiveBrand, getIsCartEnabled } from '@/config/brand.config';

export const SETTINGS_COLLECTION = 'settings';
export const STORE_FRONT_DOC_ID = 'store_front';

/**
 * Retrieves the store_front settings document from Firestore.
 * Wrapped with React cache for per-request memoization during SSR.
 * If not present in Firestore, returns fallback values derived from active brand configuration.
 */
export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
    const brand = getActiveBrand();
    const defaultPrimaryColor = brand.identity.id === 'art-fate' ? '#14B3F6' : '#0f172a';
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
        categoriesTitle: {
            en: '',
            fr: '',
        },
        categoriesSubtitle: {
            en: '',
            fr: '',
        },
        catalogTitle: {
            en: 'Shop',
            fr: 'Boutique',
        },
        catalogDescription: {
            en: '',
            fr: '',
        },
        catalogSlug: {
            en: 'shop',
            fr: 'boutique',
        },
        catalogBannerUrl: brand.assets?.heroBanner || (brand.assets as any)?.banner || '',
        footerDescription: {
            en: brand.identity.description?.en || '',
            fr: brand.identity.description?.fr || '',
        },
        footerRightMenuTitle: {
            en: 'Legal',
            fr: 'Légal',
        },
        socialLinks: (brand.navigation?.socials || []).map((s: { platform?: string; url?: string }) => ({
            platform: s.platform || '',
            url: s.url || '',
        })),
        defaultTheme: 'system',
        defaultCurrency: 'THB',
        primaryColor: defaultPrimaryColor,
        vendors: [],
        aboutSection: {
            enabled: false,
            title: { en: '', fr: '' },
            description: { en: '', fr: '' },
            ctaLabel: { en: '', fr: '' },
            ctaUrl: '',
            images: [],
        },
        contactSection: {
            enabled: false,
            title: { en: '', fr: '' },
            description: { en: '', fr: '' },
        },
        faqSection: {
            enabled: false,
            status: 'inactive',
            title: { en: 'Frequently Asked Questions', fr: 'Questions fréquentes' },
            subtitle: { en: 'Find quick answers to common questions.', fr: 'Trouvez des réponses rapides à vos questions.' },
            items: [],
        },
        cartEnabled: getIsCartEnabled(),
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
                categoriesTitle: (data?.categoriesTitle && typeof data.categoriesTitle === 'object') ? data.categoriesTitle : fallbackSettings.categoriesTitle,
                categoriesSubtitle: (data?.categoriesSubtitle && typeof data.categoriesSubtitle === 'object') ? data.categoriesSubtitle : fallbackSettings.categoriesSubtitle,
                catalogTitle: (data?.catalogTitle && typeof data.catalogTitle === 'object') ? data.catalogTitle : fallbackSettings.catalogTitle,
                catalogDescription: (data?.catalogDescription && typeof data.catalogDescription === 'object') ? data.catalogDescription : fallbackSettings.catalogDescription,
                catalogSlug: (data?.catalogSlug && typeof data.catalogSlug === 'object')
                    ? data.catalogSlug
                    : (typeof data?.catalogSlug === 'string' && data.catalogSlug.trim().length > 0)
                        ? { en: data.catalogSlug.trim().toLowerCase(), fr: data.catalogSlug.trim().toLowerCase() }
                        : fallbackSettings.catalogSlug,
                catalogBannerUrl: typeof data?.catalogBannerUrl === 'string' ? data.catalogBannerUrl : fallbackSettings.catalogBannerUrl,
                footerDescription: (data?.footerDescription && typeof data.footerDescription === 'object') ? data.footerDescription : fallbackSettings.footerDescription,
                footerRightMenuTitle: (data?.footerRightMenuTitle && typeof data.footerRightMenuTitle === 'object') ? data.footerRightMenuTitle : fallbackSettings.footerRightMenuTitle,
                socialLinks: Array.isArray(data?.socialLinks) ? data.socialLinks : fallbackSettings.socialLinks,
                defaultTheme: data?.defaultTheme ?? fallbackSettings.defaultTheme,
                defaultCurrency: data?.defaultCurrency ?? fallbackSettings.defaultCurrency,
                primaryColor: (typeof data?.primaryColor === 'string' && data.primaryColor.trim().length > 0) ? data.primaryColor : fallbackSettings.primaryColor,
                vendors: Array.isArray(data?.vendors) ? data.vendors : fallbackSettings.vendors,
                aboutSection: data?.aboutSection ? {
                    enabled: Boolean(data.aboutSection.enabled),
                    title: (data.aboutSection.title && typeof data.aboutSection.title === 'object') ? data.aboutSection.title : {},
                    description: (data.aboutSection.description && typeof data.aboutSection.description === 'object') ? data.aboutSection.description : {},
                    ctaLabel: (data.aboutSection.ctaLabel && typeof data.aboutSection.ctaLabel === 'object') ? data.aboutSection.ctaLabel : {},
                    ctaUrl: typeof data.aboutSection.ctaUrl === 'string' ? data.aboutSection.ctaUrl : '',
                    images: Array.isArray(data.aboutSection.images) ? data.aboutSection.images : [],
                } : fallbackSettings.aboutSection,
                contactSection: data?.contactSection ? {
                    enabled: Boolean(data.contactSection.enabled),
                    title: (data.contactSection.title && typeof data.contactSection.title === 'object') ? data.contactSection.title : {},
                    description: (data.contactSection.description && typeof data.contactSection.description === 'object') ? data.contactSection.description : {},
                } : fallbackSettings.contactSection,
                faqSection: data?.faqSection ? {
                    enabled: Boolean(data.faqSection.enabled ?? (data.faqSection.status === 'active')),
                    status: (data.faqSection.status === 'active' || data.faqSection.enabled) ? 'active' : 'inactive',
                    title: (data.faqSection.title && typeof data.faqSection.title === 'object')
                        ? data.faqSection.title
                        : typeof data.faqSection.title === 'string'
                        ? { en: data.faqSection.title, fr: data.faqSection.title }
                        : (fallbackSettings.faqSection?.title || {}),
                    subtitle: (data.faqSection.subtitle && typeof data.faqSection.subtitle === 'object')
                        ? data.faqSection.subtitle
                        : typeof data.faqSection.subtitle === 'string'
                        ? { en: data.faqSection.subtitle, fr: data.faqSection.subtitle }
                        : (fallbackSettings.faqSection?.subtitle || {}),
                    items: Array.isArray(data.faqSection.items) ? data.faqSection.items : [],
                } : fallbackSettings.faqSection,
                cartEnabled: typeof data?.cartEnabled === 'boolean' ? data.cartEnabled : fallbackSettings.cartEnabled,
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
