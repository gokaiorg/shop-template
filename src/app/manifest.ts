import { MetadataRoute } from 'next';
import { getActiveBrand } from '@/config/brand.config';
import { getStoreSettings } from '@/lib/services/settings';

export const dynamic = 'force-dynamic';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
    const brand = getActiveBrand();
    let storeSettings = null;
    try {
        storeSettings = await getStoreSettings();
    } catch (err) {
        console.warn('[MANIFEST] Unable to fetch store settings from Firestore, using brand fallback:', err);
    }

    const brandName = storeSettings?.brandName || brand.identity.name;
    const description = storeSettings?.heroDescription?.en || '';
    const activeIcon = storeSettings?.faviconUrl || brand.assets.icon || '/icon.png';
    const cleanUrl = activeIcon.split('?')[0].toLowerCase();
    const isWebp = cleanUrl.endsWith('.webp');
    const isPng = cleanUrl.endsWith('.png');
    const isSvg = cleanUrl.endsWith('.svg');
    const iconType = isWebp ? 'image/webp' : isPng ? 'image/png' : isSvg ? 'image/svg+xml' : 'image/x-icon';

    return {
        name: brandName,
        short_name: brand.identity.shortName || brandName,
        description,
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
            {
                src: activeIcon,
                sizes: 'any',
                type: iconType,
            },
            {
                src: activeIcon,
                sizes: '192x192 512x512',
                type: iconType,
            },
            {
                src: '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
        ],
    };
}

