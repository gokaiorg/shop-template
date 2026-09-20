import { BrandConfig } from '../types';
import { shopTemplateSeed } from '../seed/shop-template.seed';

export const gokaiLabsBrand: BrandConfig = {
    identity: {
        id: 'gokai-labs',
        name: 'Gokai Labs',
        shortName: 'Gokai',
        tagline: {
            en: 'Crafting Next-Gen Digital Experiences',
            fr: 'Créateur d\'expériences numériques de pointe'
        },
        description: {
            en: 'Gokai Labs builds high-performance web applications, AI-powered systems, and scalable digital solutions for ambitious brands.',
            fr: 'Gokai Labs conçoit des applications web haute performance, des systèmes dopés à l\'IA et des solutions digitales pour les marques ambitieuses.'
        },
        url: process.env.NEXT_PUBLIC_APP_URL || 'https://gokai.org',
        companyName: 'Gokai Labs Studio',
        copyrightYear: new Date().getFullYear(),
        creator: {
            name: 'Gokai Labs',
            url: 'https://gokai.org'
        }
    },
    assets: {
        logo: {
            src: '/brand/gokai-labs/logo.webp',
            alt: 'Gokai Labs Logo',
            width: 32,
            height: 32
        },
        icon: '/brand/gokai-labs/icon.webp',
        favicon: '/favicon.ico',
        ogImage: '/brand/gokai-labs/og-image.jpg',
        placeholderImage: '/brand/gokai-labs/placeholder.webp',
        heroBanner: '/brand/gokai-labs/hero-banner.webp'
    },
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
            { platform: 'github', url: 'https://github.com/gokaiorg' },
            { platform: 'x', url: 'https://x.com/gokailabs' }
        ]
    },
    seo: {
        titleTemplate: '%s | Gokai Labs',
        defaultTitle: 'Gokai Labs - Studio Web, Cloud & IA',
        defaultDescription: {
            en: 'High-performance boilerplates, full-stack development, and AI engineering services.',
            fr: 'Templates full-stack haute performance, développement web et ingénierie IA.'
        },
        keywords: ['gokai labs', 'nextjs agency', 'web development', 'ai engineering', 'cloud consulting'],
        twitterHandle: '@gokailabs',
        robots: {
            allow: '/',
            disallow: ['/private/', '/admin/']
        }
    },
    contact: {
        email: 'contact@gokai.org',
        phone: '+33 1 89 00 00 00',
        supportHours: {
            en: 'Monday - Friday, 9am - 7pm CET',
            fr: 'Lundi - Vendredi, 9h - 19h CET'
        }
    },
    seedData: shopTemplateSeed
};
