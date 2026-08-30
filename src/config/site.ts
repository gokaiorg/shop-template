import { brandConfig } from './brand.config';
import type { Metadata } from 'next';

/**
 * Formats page title according to brand template.
 */
export function formatTitle(title?: string, brandName?: string): string {
    const activeBrandName = brandName || brandConfig.identity.name;
    if (!title) return `${activeBrandName} - Store`;
    return `%s | ${activeBrandName}`.replace('%s', title);
}

/**
 * Builds base Next.js Metadata object from brand configuration, dynamic store settings, and locale.
 */
export function constructSiteMetadata({
    title,
    description,
    image,
    lang = 'en',
    noIndex = false,
    brandName,
    faviconUrl,
}: {
    title?: string;
    description?: string;
    image?: string;
    lang?: 'en' | 'fr' | string;
    noIndex?: boolean;
    brandName?: string;
    faviconUrl?: string;
} = {}): Metadata {
    const isFr = lang === 'fr';
    const activeBrandName = brandName || brandConfig.identity.name;
    const siteTitle = title ? formatTitle(title, activeBrandName) : `${activeBrandName} - Store`;
    const siteDescription =
        description ||
        (isFr ? brandConfig.seo.defaultDescription.fr : brandConfig.seo.defaultDescription.en);
    const ogImage = image || brandConfig.assets.ogImage || brandConfig.assets.logo.src;
    const siteUrl = brandConfig.identity.url;
    const activeFavicon = faviconUrl || brandConfig.assets.favicon || '/favicon.ico';

    return {
        title: {
            default: siteTitle,
            template: `%s | ${activeBrandName}`,
        },
        description: siteDescription,
        metadataBase: new URL(siteUrl),
        keywords: brandConfig.seo.keywords,
        authors: [
            {
                name: brandConfig.identity.creator?.name || activeBrandName,
                url: brandConfig.identity.creator?.url || siteUrl,
            },
        ],
        creator: brandConfig.identity.creator?.name || activeBrandName,
        icons: {
            icon: activeFavicon,
            apple: activeFavicon || '/icon.png',
        },
        openGraph: {
            title: siteTitle,
            description: siteDescription,
            url: siteUrl,
            siteName: activeBrandName,
            locale: isFr ? 'fr_FR' : 'en_US',
            type: 'website',
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                    alt: activeBrandName,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: siteTitle,
            description: siteDescription,
            creator: brandConfig.seo.twitterHandle,
            images: [ogImage],
        },
        robots: noIndex
            ? {
                  index: false,
                  follow: false,
              }
            : {
                  index: true,
                  follow: true,
              },
    };
}
