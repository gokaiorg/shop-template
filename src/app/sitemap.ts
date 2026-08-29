import { MetadataRoute } from 'next';
import { brandConfig } from '@/config/brand.config';
import { i18n } from '@/app/i18n-config';

export default function sitemap(): MetadataRoute.Sitemap {
    const siteUrl = brandConfig.identity.url.replace(/\/$/, '');
    const routes = ['', '/shop', '/about', '/contact', '/mentions-legales', '/cgv', '/privacy-policy', '/returns'];
    
    const entries: MetadataRoute.Sitemap = [];

    for (const locale of i18n.locales) {
        for (const route of routes) {
            entries.push({
                url: `${siteUrl}/${locale}${route}`,
                lastModified: new Date(),
                changeFrequency: route === '' || route === '/shop' ? 'daily' : 'monthly',
                priority: route === '' ? 1.0 : route === '/shop' ? 0.9 : 0.6,
            });
        }
    }

    return entries;
}
