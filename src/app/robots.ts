import { MetadataRoute } from 'next';
import { brandConfig } from '@/config/brand.config';

export default function robots(): MetadataRoute.Robots {
    const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || brandConfig.identity.url || 'http://localhost:3000';
    const siteUrl = rawBaseUrl.replace(/\/+$/, '');
    const allowRules = brandConfig.seo.robots?.allow || '/';
    const configuredDisallows = brandConfig.seo.robots?.disallow || ['/private/', '/admin/'];
    const disallowRules = Array.from(new Set([
        ...configuredDisallows,
        '/admin/',
        '/*/admin/',
        '/checkout/',
        '/*/checkout/',
        '/api/',
    ]));

    return {
        rules: {
            userAgent: '*',
            allow: allowRules,
            disallow: disallowRules,
        },
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}
