import { BrandConfig, DEFAULT_BRAND_ASSETS } from '../types';

export const artFateBrand: BrandConfig = {
    identity: {
        id: 'art-fate',
        name: 'Art Fate',
        shortName: 'AF'
    },
    assets: DEFAULT_BRAND_ASSETS,
    theme: {
        fontSans: 'var(--font-geist-sans)',
        fontHeading: 'var(--font-geist-sans)',
        radius: '0.5rem',
        colors: {
            light: {
                primary: 'oklch(0.18 0.02 240)',
                accent: 'oklch(0.7 0.15 70)', // Warm subtle bronze/gold
                background: 'oklch(0.99 0.005 90)', // Warm gallery off-white
                foreground: 'oklch(0.12 0.01 240)'
            },
            dark: {
                primary: 'oklch(0.95 0.01 90)',
                accent: 'oklch(0.75 0.14 70)',
                background: 'oklch(0.1 0.005 240)', // Deep charcoal gallery black
                foreground: 'oklch(0.98 0.005 90)'
            }
        }
    },
    seo: {
        titleTemplate: '%s | Art Fate',
        robots: {
            allow: '/',
            disallow: ['/private/', '/admin/']
        }
    },
    supportedLocales: ['en'],
    defaultLocale: 'en'
};
