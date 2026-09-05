import { BrandConfig } from '../types';
import { shopTemplateSeed } from '../seed/shop-template.seed';

export const shopTemplateBrand: BrandConfig = {
    identity: {
        id: 'shop-template',
        name: 'Shop Template',
        shortName: 'Shop',
        tagline: {
            en: 'One Template. Infinite Possibilities.',
            fr: 'Un modèle. Des possibilités infinies.'
        },
        description: {
            en: 'The ultimate full-stack boilerplate for modern e-commerce and digital stores. Built with Next.js, Firebase, and Tailwind CSS.',
            fr: 'Le boilerplate full-stack ultime pour le e-commerce moderne. Conçu avec Next.js, Firebase et Tailwind CSS.'
        },
        url: process.env.NEXT_PUBLIC_APP_URL || 'https://shop-template.demo',
        companyName: 'Shop Template Inc.',
        copyrightYear: new Date().getFullYear(),
        creator: {
            name: 'Gokai Labs',
            url: 'https://gokai.org'
        }
    },
    assets: {
        logo: {
            src: '/brand/shop-template/logo.webp',
            alt: 'Shop Template Logo',
            width: 32,
            height: 32
        },
        icon: '/brand/shop-template/icon.webp',
        favicon: '/favicon.ico',
        ogImage: '/brand/shop-template/og-image.jpg',
        placeholderImage: '/brand/shop-template/placeholder.webp',
        heroBanner: '/brand/shop-template/hero-banner.webp'
    },
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
            { platform: 'twitter', url: 'https://twitter.com' },
            { platform: 'github', url: 'https://github.com' }
        ]
    },
    seo: {
        titleTemplate: '%s | Shop Template',
        defaultTitle: 'Shop Template - Modern E-Commerce Platform',
        defaultDescription: {
            en: 'Discover high-performance full-stack templates and services.',
            fr: 'Découvrez des templates et services full-stack ultra-performants.'
        },
        keywords: ['e-commerce', 'nextjs', 'tailwind', 'firebase', 'shop template'],
        twitterHandle: '@shoptemplate',
        robots: {
            allow: '/',
            disallow: ['/private/', '/admin/']
        }
    },
    contact: {
        email: 'contact@shop-template.demo',
        phone: '+33 1 00 00 00 00',
        supportHours: {
            en: 'Monday - Friday, 9am - 6pm CET',
            fr: 'Lundi - Vendredi, 9h - 18h CET'
        }
    },
    seedData: shopTemplateSeed
};
