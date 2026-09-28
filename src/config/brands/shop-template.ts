import { BrandConfig, DEFAULT_BRAND_ASSETS } from '../types';

export const shopTemplateBrand: BrandConfig = {
    identity: {
        id: 'shop-template',
        name: 'Shop Template',
        shortName: 'Shop'
    },
    assets: DEFAULT_BRAND_ASSETS,
    theme: {
        fontSans: 'var(--font-geist-sans)',
        fontHeading: 'var(--font-geist-sans)',
        radius: '0.625rem',
        colors: {
            light: {
                primary: 'oklch(0.205 0 0)',
                accent: 'oklch(0.97 0 0)',
                background: 'oklch(1 0 0)',
                foreground: 'oklch(0.145 0 0)'
            },
            dark: {
                primary: 'oklch(0.922 0 0)',
                accent: 'oklch(0.269 0 0)',
                background: 'oklch(0.145 0 0)',
                foreground: 'oklch(0.985 0 0)'
            }
        }
    },
    seo: {
        titleTemplate: '%s | Shop Template',
        robots: {
            allow: '/',
            disallow: ['/private/', '/admin/']
        }
    },
    supportedLocales: ['en', 'fr'],
    defaultLocale: 'en'
};
