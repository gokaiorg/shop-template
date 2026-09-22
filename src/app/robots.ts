import { MetadataRoute } from 'next';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
    const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const baseUrl = rawBaseUrl.replace(/\/+$/, '');

    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: [
                '/private/',
                '/admin/',
                '/*/admin/',
                '/checkout/',
                '/*/checkout/',
                '/api/',
            ],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
