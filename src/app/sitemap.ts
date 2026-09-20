import { MetadataRoute } from 'next';
import { brandConfig } from '@/config/brand.config';
import { getSupportedLocales } from '@/app/i18n-config';
import { getStoreSettings } from '@/lib/services/settings';
import { getLocalizedField } from '@/lib/i18n';
import { adminDb } from '@/lib/firebase-admin';
import { Category, Product, Page } from '@/types/database';

export const dynamic = 'force-dynamic';

function toDate(timestampOrDate: any): Date {
    if (!timestampOrDate) return new Date();
    if (typeof timestampOrDate.toDate === 'function') return timestampOrDate.toDate();
    const parsed = new Date(timestampOrDate);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || brandConfig.identity.url || 'http://localhost:3000';
    const siteUrl = rawBaseUrl.replace(/\/+$/, '');
    const locales = getSupportedLocales();

    const entries: MetadataRoute.Sitemap = [];
    const seenUrls = new Set<string>();

    const addEntry = (entry: MetadataRoute.Sitemap[number]) => {
        if (!seenUrls.has(entry.url)) {
            seenUrls.add(entry.url);
            entries.push(entry);
        }
    };

    try {
        const [storeSettings, pagesSnap, categoriesSnap, productsSnap] = await Promise.all([
            getStoreSettings(),
            adminDb.collection('pages').get(),
            adminDb.collection('categories').get(),
            adminDb.collection('products').get(),
        ]);

        const pages = pagesSnap.docs
            .map((doc) => ({ id: doc.id, ...doc.data() } as Page))
            .filter((p) => p.status === 'published');

        const categories = categoriesSnap.docs
            .map((doc) => ({ id: doc.id, ...doc.data() } as Category))
            .filter((c) => (c.status ?? 'published') === 'published');

        const categoryMap = new Map(categories.map((c) => [c.id, c]));

        const rawProducts = productsSnap.docs.map(
            (doc) => ({ id: doc.id, ...doc.data() } as Product)
        );

        for (const locale of locales) {
            const catalogSlug = (
                getLocalizedField(storeSettings.catalogSlug, locale) ||
                (typeof storeSettings.catalogSlug === 'string' ? storeSettings.catalogSlug : 'shop')
            ).toLowerCase();

            // 1. Root Home per locale
            addEntry({
                url: `${siteUrl}/${locale}`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 1.0,
            });

            // 2. Catalog Root per locale
            addEntry({
                url: `${siteUrl}/${locale}/${catalogSlug}`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 0.9,
            });

            // 3. Published Pages (clean silo URL: /[locale]/[pageSlug])
            for (const page of pages) {
                const pageSlug =
                    (typeof page.slug === 'object' && page.slug?.[locale])
                        ? page.slug[locale]
                        : (locale === 'fr' ? page.slug_fr : page.slug_en) ||
                          getLocalizedField(page.slug, locale) ||
                          (typeof page.slug === 'string' ? page.slug : page.id);

                if (pageSlug) {
                    addEntry({
                        url: `${siteUrl}/${locale}/${pageSlug}`,
                        lastModified: toDate(page.updatedAt || page.createdAt),
                        changeFrequency: 'monthly',
                        priority: 0.7,
                    });
                }
            }

            // 4. Published Categories (clean silo URL: /[locale]/[catalogSlug]/[categorySlug])
            for (const category of categories) {
                const categorySlug =
                    (typeof category.slug === 'object' && category.slug?.[locale])
                        ? category.slug[locale]
                        : (locale === 'fr' ? category.slugFr : category.slugEn) ||
                          getLocalizedField(category.slug, locale) ||
                          (typeof category.slug === 'string' ? category.slug : category.id);

                if (categorySlug) {
                    addEntry({
                        url: `${siteUrl}/${locale}/${catalogSlug}/${categorySlug}`,
                        lastModified: toDate(category.updatedAt || category.createdAt),
                        changeFrequency: 'weekly',
                        priority: 0.8,
                    });
                }
            }

            // 5. Published Products (clean silo URL: /[locale]/[catalogSlug]/[categorySlug]/[productSlug])
            for (const product of rawProducts) {
                // Check if product is published for this locale
                const rawStatus =
                    (typeof product.status === 'object' && product.status?.[locale])
                        ? product.status[locale]
                        : (locale === 'fr' ? product.statusFr : product.statusEn) ||
                          getLocalizedField(product.status, locale) ||
                          (typeof product.status === 'string' ? product.status : 'draft');
                const isPublished = rawStatus === 'published' || rawStatus === 'publié';

                if (!isPublished) continue;

                const productSlug =
                    (typeof product.slug === 'object' && product.slug?.[locale])
                        ? product.slug[locale]
                        : (locale === 'fr' ? product.slugFr : product.slugEn) ||
                          getLocalizedField(product.slug, locale) ||
                          (typeof product.slug === 'string' ? product.slug : product.id);

                if (!productSlug) continue;

                // Find parent category slug
                const prodCatIds = product.categoryIds || (product.categoryId ? [product.categoryId] : []);
                const parentCat = prodCatIds
                    .map((id) => categoryMap.get(id))
                    .find(Boolean) as Category | undefined;

                const parentCatSlug = parentCat
                    ? ((typeof parentCat.slug === 'object' && parentCat.slug?.[locale])
                        ? parentCat.slug[locale]
                        : (locale === 'fr' ? parentCat.slugFr : parentCat.slugEn) ||
                          getLocalizedField(parentCat.slug, locale) ||
                          (typeof parentCat.slug === 'string' ? parentCat.slug : parentCat.id))
                    : 'all';

                addEntry({
                    url: `${siteUrl}/${locale}/${catalogSlug}/${parentCatSlug}/${productSlug}`,
                    lastModified: toDate(product.updatedAt || product.createdAt),
                    changeFrequency: 'weekly',
                    priority: 0.6,
                });
            }
        }
    } catch (error) {
        console.error('[SITEMAP_GENERATION_ERROR]', error);

        // Fallback minimal entries if database query fails
        for (const locale of locales) {
            addEntry({
                url: `${siteUrl}/${locale}`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 1.0,
            });
            addEntry({
                url: `${siteUrl}/${locale}/shop`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 0.9,
            });
        }
    }

    return entries;
}
