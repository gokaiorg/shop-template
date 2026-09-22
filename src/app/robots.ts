import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { brandConfig } from '@/config/brand.config';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
    let hostBaseUrl: string | undefined;
    try {
        const headersList = await headers();
        const host = headersList.get('x-forwarded-host') || headersList.get('host');
        if (host && !host.includes('localhost') && !host.includes('127.0.0.1') && !host.includes('0.0.0.0')) {
            const proto = headersList.get('x-forwarded-proto') || 'https';
            hostBaseUrl = `${proto}://${host}`;
        }
    } catch {
        // Fallback if headers() cannot be resolved
    }

    const envUrl = process.env.APP_URL || process.env["NEXT_PUBLIC_APP_URL"] || process.env.NEXT_PUBLIC_APP_URL;
    const brandUrl = brandConfig.identity.url;

    // Prioritize non-localhost production domain:
    // 1. Host header from incoming HTTP request (e.g. art-fate.com)
    // 2. envUrl if non-localhost
    // 3. Brand config URL (e.g. https://art-fate.com, https://gokai.org)
    // 4. Default to envUrl/brandUrl or localhost for local dev
    let rawBaseUrl = hostBaseUrl;
    if (!rawBaseUrl && envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        rawBaseUrl = envUrl;
    }
    if (!rawBaseUrl && brandUrl && !brandUrl.includes('localhost') && !brandUrl.includes('127.0.0.1')) {
        rawBaseUrl = brandUrl;
    }
    if (!rawBaseUrl) {
        rawBaseUrl = envUrl || brandUrl || 'http://localhost:3000';
    }

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
