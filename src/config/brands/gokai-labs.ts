import { BrandConfig, DEFAULT_BRAND_ASSETS } from '../types';

export const gokaiLabsBrand: BrandConfig = {
    identity: {
        id: 'gokai-labs',
        name: 'Gokai Labs',
        shortName: 'Gokai'
    },
    assets: DEFAULT_BRAND_ASSETS,
    theme: {
        fontSans: 'var(--font-geist-sans)',
        fontHeading: 'var(--font-geist-sans)',
        radius: '0.5rem',
        colors: {
            light: {
                primary: 'oklch(0.25 0.1 270)', // High-tech deep violet
                accent: 'oklch(0.65 0.22 280)',
                background: 'oklch(1 0 0)',
                foreground: 'oklch(0.15 0.02 270)'
            },
            dark: {
                primary: 'oklch(0.7 0.18 280)',
                accent: 'oklch(0.6 0.22 290)',
                background: 'oklch(0.12 0.02 270)',
                foreground: 'oklch(0.98 0 0)'
            }
        }
    },
    seo: {
        titleTemplate: '%s | Gokai Labs',
        robots: {
            allow: '/',
            disallow: ['/private/', '/admin/']
        }
    },
    supportedLocales: ['en', 'fr'],
    defaultLocale: 'en'
};
