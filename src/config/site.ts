import { brandConfig } from './brand.config';
import type { Metadata } from 'next';

/**
 * Formats page title according to brand template.
 */
export function formatTitle(title?: string): string {
    if (!title) return brandConfig.seo.defaultTitle;
    return brandConfig.seo.titleTemplate.replace('%s', title);
}

/**
 * Builds base Next.js Metadata object from brand configuration and locale.
 */
export function constructSiteMetadata({
    title,
    description,
    image,
    lang = 'en',
    noIndex = false,
}: {
    title?: string;
    description?: string;
    image?: string;
    lang?: 'en' | 'fr' | string;
    noIndex?: boolean;
} = {}): Metadata {
    const isFr = lang === 'fr';
    const siteTitle = title ? formatTitle(title) : brandConfig.seo.defaultTitle;
    const siteDescription =
        description ||
        (isFr ? brandConfig.seo.defaultDescription.fr : brandConfig.seo.defaultDescription.en);
    const ogImage = image || brandConfig.assets.ogImage || brandConfig.assets.logo.src;
    const siteUrl = brandConfig.identity.url;

    return {
        title: {
            default: siteTitle,
            template: brandConfig.seo.titleTemplate,
        },
        description: siteDescription,
        metadataBase: new URL(siteUrl),
        keywords: brandConfig.seo.keywords,
        authors: [
            {
                name: brandConfig.identity.creator?.name || brandConfig.identity.name,
                url: brandConfig.identity.creator?.url || siteUrl,
            },
        ],
        creator: brandConfig.identity.creator?.name || brandConfig.identity.name,
        icons: {
            icon: brandConfig.assets.favicon || '/favicon.ico',
            apple: brandConfig.assets.icon || '/icon.png',
        },
        openGraph: {
            title: siteTitle,
            description: siteDescription,
            url: siteUrl,
            siteName: brandConfig.identity.name,
            locale: isFr ? 'fr_FR' : 'en_US',
            type: 'website',
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                    alt: brandConfig.identity.name,
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
