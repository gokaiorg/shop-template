import { BrandConfig } from '../types';
import { artFateSeed } from '../seed/art-fate.seed';

export const artFateBrand: BrandConfig = {
    identity: {
        id: 'art-fate',
        name: 'Art Fate',
        shortName: 'AF',
        tagline: {
            en: 'Curated Fine Art & Exclusive Editions',
            fr: 'Art Contemporain & Éditions Rares'
        },
        description: {
            en: 'Discover rare sculptures, museum-grade limited prints, and contemporary canvases curated by Art Fate Studio.',
            fr: 'Découvrez des sculptures rares, des tirages d\'art limités de qualité musée et des peintures contemporaines sélectionnées par le Studio Art Fate.'
        },
        url: process.env.NEXT_PUBLIC_APP_URL || 'https://artfate.com',
        companyName: 'Art Fate Studio SAS',
        copyrightYear: new Date().getFullYear(),
        creator: {
            name: 'Art Fate Studio',
            url: 'https://artfate.com'
        }
    },
    assets: {
        logo: {
            src: '/brand/art-fate/logo.svg',
            alt: 'Art Fate Logo',
            width: 36,
            height: 36
        },
        icon: '/brand/art-fate/icon.png',
        favicon: '/favicon.ico',
        ogImage: '/brand/art-fate/og-image.jpg',
        placeholderImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=2608&auto=format&fit=crop',
        heroBanner: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=2670&auto=format&fit=crop'
    },
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
    navigation: {
        headerNav: [
            { key: 'shop', href: '/shop' },
            { key: 'about', href: '/about' },
            { key: 'contact', href: '/contact' }
        ],
        footerSections: {
            shop: [
                { key: 'shop', href: '/shop' },
                { key: 'about', href: '/about' },
                { key: 'contact', href: '/contact' }
            ],
            company: [
                { key: 'about', href: '/about' },
                { key: 'contact', href: '/contact' }
            ],
            legal: [
                { key: 'mentions_legales', href: '/mentions-legales' },
                { key: 'cgv', href: '/cgv' },
                { key: 'privacy_policy', href: '/privacy-policy' },
                { key: 'returns', href: '/returns' }
            ]
        },
        socials: [
            { platform: 'instagram', url: 'https://instagram.com/artfate' },
            { platform: 'x', url: 'https://x.com/artfate' }
        ]
    },
    seo: {
        titleTemplate: '%s | Art Fate',
        defaultTitle: 'Art Fate - Galerie d\'Art Contemporain & Éditions Limitées',
        defaultDescription: {
            en: 'Explore our curated selection of original contemporary art, signed limited edition prints, and fine sculptures.',
            fr: 'Explorez notre sélection exclusive d\'art contemporain original, d\'éditions limitées signées et de sculptures de collection.'
        },
        keywords: ['art contemporain', 'galerie dart', 'tirages limites', 'sculptures', 'art fate', 'fine art prints'],
        twitterHandle: '@artfate',
        robots: {
            allow: '/',
            disallow: ['/private/', '/admin/']
        }
    },
    contact: {
        email: 'contact@artfate.com',
        phone: '+33 1 42 68 00 00',
        address: {
            street: '14 Rue de la Paix',
            city: 'Paris',
            postalCode: '75002',
            country: 'France'
        },
        supportHours: {
            en: 'Tuesday - Saturday, 10am - 7pm CET',
            fr: 'Mardi - Samedi, 10h - 19h CET'
        }
    },
    seedData: artFateSeed
};
