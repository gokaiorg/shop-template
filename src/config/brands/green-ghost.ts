import { BrandConfig, DEFAULT_BRAND_ASSETS } from '../types';

export const greenGhostBrand: BrandConfig = {
    identity: {
        id: 'green-ghost',
        name: 'Green Ghost',
        shortName: 'GG'
    },
    assets: DEFAULT_BRAND_ASSETS,
    theme: {
        fontSans: 'var(--font-geist-sans)',
        fontHeading: 'var(--font-geist-sans)',
        radius: '0.625rem',
        colors: {
            light: {
                primary: 'oklch(0.25 0.12 145)', // Natural botanical deep forest green
                accent: 'oklch(0.68 0.18 140)', // Vibrant sage/emerald green
                background: 'oklch(0.99 0.01 140)',
                foreground: 'oklch(0.14 0.02 145)'
            },
            dark: {
                primary: 'oklch(0.85 0.14 140)',
                accent: 'oklch(0.7 0.18 140)',
                background: 'oklch(0.1 0.02 145)',
                foreground: 'oklch(0.98 0.01 140)'
            }
        }
    },
    seo: {
        titleTemplate: '%s | Green Ghost',
        robots: {
            allow: '/',
            disallow: ['/private/', '/admin/']
        }
    },
    supportedLocales: ['en', 'fr'],
    defaultLocale: 'en'
};
