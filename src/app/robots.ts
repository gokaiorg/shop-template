import { MetadataRoute } from 'next';
import { brandConfig } from '@/config/brand.config';

export default function robots(): MetadataRoute.Robots {
    const siteUrl = brandConfig.identity.url.replace(/\/$/, '');
    const allowRules = brandConfig.seo.robots?.allow || '/';
    const disallowRules = brandConfig.seo.robots?.disallow || ['/private/', '/admin/'];

    return {
        rules: {
            userAgent: '*',
            allow: allowRules,
            disallow: disallowRules,
        },
        sitemap: `${siteUrl}/sitemap.xml`,
    };
}
