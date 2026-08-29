import { MetadataRoute } from 'next';
import { brandConfig } from '@/config/brand.config';

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: brandConfig.identity.name,
        short_name: brandConfig.identity.shortName || brandConfig.identity.name,
        description: brandConfig.identity.description.en,
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
            {
                src: brandConfig.assets.favicon || '/favicon.ico',
                sizes: 'any',
                type: 'image/x-icon',
            },
            {
                src: brandConfig.assets.icon || '/icon.png',
                sizes: '192x192 512x512',
                type: 'image/png',
            },
        ],
    };
}
