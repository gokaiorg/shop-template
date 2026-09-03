import { MetadataRoute } from 'next';
import { brandConfig } from '@/config/brand.config';
import { i18n } from '@/app/i18n-config';
import { getStoreSettings } from '@/lib/services/settings';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const storeSettings = await getStoreSettings();
    const catalogRoute = `/${storeSettings.catalogSlug || 'shop'}`;
    const siteUrl = brandConfig.identity.url.replace(/\/$/, '');
    const routes = ['', catalogRoute, '/pages/about', '/pages/contact', '/pages/mentions-legales', '/pages/cgv', '/pages/privacy-policy', '/pages/returns'];
    
    const entries: MetadataRoute.Sitemap = [];

    for (const locale of i18n.locales) {
        for (const route of routes) {
            entries.push({
                url: `${siteUrl}/${locale}${route}`,
                lastModified: new Date(),
                changeFrequency: route === '' || route === catalogRoute ? 'daily' : 'monthly',
                priority: route === '' ? 1.0 : route === catalogRoute ? 0.9 : 0.6,
            });
        }
    }

    return entries;
}
