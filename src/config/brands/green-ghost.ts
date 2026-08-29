import { BrandConfig, BrandSeedData } from '../types';

export const greenGhostSeed: BrandSeedData = {
    categories: [
        {
            nameFr: "Fleurs CBD Premium",
            nameEn: "Premium CBD Flowers",
            slugFr: "fleurs-cbd-premium",
            slugEn: "premium-cbd-flowers",
            introFr: "Sélection indoor suisse & italienne.",
            introEn: "Swiss & Italian indoor selection.",
            descriptionFr: "Fleurs cultivées en intérieur sans pesticides avec profil terpénique exceptionnel.",
            descriptionEn: "Pesticide-free indoor grown flowers with exceptional terpene profiles."
        },
        {
            nameFr: "Huiles & Extraits Bio",
            nameEn: "Organic Oils & Extracts",
            slugFr: "huiles-extraits-bio",
            slugEn: "organic-oils-extracts",
            introFr: "Extraction spectre complet (Full Spectrum).",
            introEn: "Full spectrum botanical extraction.",
            descriptionFr: "Huiles sublinguales bio pressées à froid avec support MCT coco.",
            descriptionEn: "Cold-pressed organic sublingual oils with coconut MCT carrier."
        },
        {
            nameFr: "Infusions & Bien-être",
            nameEn: "Herbal Teas & Wellness",
            slugFr: "infusions-bien-etre",
            slugEn: "herbal-teas-wellness",
            introFr: "Mélanges de plantes et chanvre biologique.",
            introEn: "Organic botanical blends and hemp.",
            descriptionFr: "Tisanes relaxantes et digestives composées de plantes médicinales françaises.",
            descriptionEn: "Relaxing and digestive herbal teas crafted with French medicinal plants."
        },
        {
            nameFr: "Accessoires & Vapo",
            nameEn: "Vaporizers & Accessories",
            slugFr: "accessoires-vapo",
            slugEn: "vaporizers-accessories",
            introFr: "Matériel haute précision.",
            introEn: "High-precision equipment.",
            descriptionFr: "Vaporisateurs portables, grinders en céramique et accessoires durables.",
            descriptionEn: "Portable vaporizers, ceramic grinders, and sustainable smoking accessories."
        },
    ],
    products: [
        {
            nameFr: "Ghost OG Indoor 10g",
            nameEn: "Ghost OG Indoor 10g",
            slugFr: "ghost-og-indoor",
            slugEn: "ghost-og-indoor",
            introFr: "Arômes intenses de pin et d'agrumes.",
            introEn: "Intense aromas of pine and fresh citrus.",
            descriptionFr: "Notre variété signature Green Ghost. Fleurs denses et résineuses séchées lentement pendant 4 semaines.",
            descriptionEn: "Our signature Green Ghost strain. Dense, frosty buds cured slowly for 4 weeks.",
            price: 79,
            stock: 45,
            categoryIndex: 0,
            statusFr: "publié",
            statusEn: "published",
            images: ["https://images.unsplash.com/photo-1568644396922-5c3bfae12521?q=80&w=2670&auto=format&fit=crop"]
        },
        {
            nameFr: "Moonrock Spectre Ultime 5g",
            nameEn: "Moonrock Ultimate Spectrum 5g",
            slugFr: "moonrock-spectre-ultime",
            slugEn: "moonrock-ultimate-spectrum",
            introFr: "Puissance terpénique maximale.",
            introEn: "Maximum terpene potency.",
            descriptionFr: "Têtes compactes trempées dans un distillat pur puis roulées dans du kief de premier choix.",
            descriptionEn: "Dense buds dipped in pure broad-spectrum distillate and rolled in premium dry-sift kief.",
            price: 55,
            stock: 30,
            categoryIndex: 0,
            statusFr: "publié",
            statusEn: "published",
            images: ["https://images.unsplash.com/photo-1603909223429-69bb7101f420?q=80&w=2670&auto=format&fit=crop"]
        },
        {
            nameFr: "Huile Full Spectrum 20% Bio",
            nameEn: "Full Spectrum 20% Organic Oil",
            slugFr: "huile-full-spectrum-20",
            slugEn: "oil-full-spectrum-20",
            introFr: "Concentration optimale pour la relaxation et le sommeil.",
            introEn: "Optimal concentration for relaxation and sleep support.",
            descriptionFr: "Flacon compte-gouttes de 10ml avec 2000mg de cannabinoïdes actifs naturels.",
            descriptionEn: "10ml dropper bottle with 2000mg of natural active cannabinoids.",
            price: 69,
            stock: 60,
            categoryIndex: 1,
            statusFr: "publié",
            statusEn: "published",
            images: ["https://images.unsplash.com/photo-1608248597359-0a6963e69124?q=80&w=2670&auto=format&fit=crop"]
        },
        {
            nameFr: "Tisane Nuit Sereine 100g",
            nameEn: "Serene Night Herbal Tea 100g",
            slugFr: "tisane-nuit-sereine",
            slugEn: "serene-night-herbal-tea",
            introFr: "Mélange camomille, verveine et chanvre bio.",
            introEn: "Chamomile, verbena, and organic hemp blend.",
            descriptionFr: "Infusion apaisante idéale pour préparer une nuit calme et réparatrice.",
            descriptionEn: "Soothing infusion ideal for preparing a calm and restorative night.",
            price: 18,
            stock: 80,
            categoryIndex: 2,
            statusFr: "publié",
            statusEn: "published",
            images: ["https://images.unsplash.com/photo-1597481499750-3e6b22637e12?q=80&w=2670&auto=format&fit=crop"]
        }
    ]
};

export const greenGhostBrand: BrandConfig = {
    identity: {
        id: 'green-ghost',
        name: 'Green Ghost',
        shortName: 'GG',
        tagline: {
            en: 'Organic Botanicals & Herbal Lifestyle',
            fr: 'Botanique Biologique & Bien-être Naturel'
        },
        description: {
            en: 'Green Ghost curates pesticide-free indoor CBD flowers, certified organic sublingual oils, and premium botanical wellness infusions.',
            fr: 'Green Ghost sélectionne des fleurs de chanvre d\'exception cultivées sans pesticides, des huiles sublinguales bio et des infusions botaniques bien-être.'
        },
        url: process.env.NEXT_PUBLIC_APP_URL || 'https://greenghost.shop',
        companyName: 'Green Ghost Botanicals SAS',
        copyrightYear: new Date().getFullYear(),
        creator: {
            name: 'Green Ghost Studio',
            url: 'https://greenghost.shop'
        }
    },
    assets: {
        logo: {
            src: '/brand/default/logo.png',
            alt: 'Green Ghost Logo',
            width: 32,
            height: 32
        },
        icon: '/brand/default/icon.png',
        favicon: '/favicon.ico',
        ogImage: '/brand/default/og-image.jpg',
        placeholderImage: 'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?q=80&w=2670&auto=format&fit=crop',
        heroBanner: 'https://images.unsplash.com/photo-1603909223429-69bb7101f420?q=80&w=2670&auto=format&fit=crop'
    },
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
            { platform: 'instagram', url: 'https://instagram.com/greenghost' },
            { platform: 'x', url: 'https://x.com/greenghost' }
        ]
    },
    seo: {
        titleTemplate: '%s | Green Ghost',
        defaultTitle: 'Green Ghost - Botanique & Bien-être Chanvre Bio',
        defaultDescription: {
            en: 'Discover premium organic CBD flowers, sublingual oils, and herbal wellness infusions.',
            fr: 'Découvrez des fleurs de CBD premium, huiles biologiques et infusions bien-être naturelles.'
        },
        keywords: ['green ghost', 'fleurs cbd', 'cbd bio', 'huiles cbd', 'botanicals', 'tisanes bien-etre'],
        twitterHandle: '@greenghost',
        robots: {
            allow: '/',
            disallow: ['/private/', '/admin/']
        }
    },
    contact: {
        email: 'contact@greenghost.shop',
        phone: '+33 1 70 00 00 00',
        supportHours: {
            en: 'Monday - Saturday, 10am - 8pm CET',
            fr: 'Lundi - Samedi, 10h - 20h CET'
        }
    },
    seedData: greenGhostSeed
};
