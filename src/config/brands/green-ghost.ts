import { BrandConfig, BrandSeedData } from '../types';

export const greenGhostSeed: BrandSeedData = {
    categories: [
        {
            name: {
                en: "Premium CBD Flowers",
                fr: "Fleurs CBD Premium"
            },
            slug: {
                en: "premium-cbd-flowers",
                fr: "fleurs-cbd-premium"
            },
            intro: {
                en: "Swiss & Italian indoor selection.",
                fr: "Sélection indoor suisse & italienne."
            },
            description: {
                en: "Pesticide-free indoor grown flowers with exceptional terpene profiles.",
                fr: "Fleurs cultivées en intérieur sans pesticides avec profil terpénique exceptionnel."
            }
        },
        {
            name: {
                en: "Organic Oils & Extracts",
                fr: "Huiles & Extraits Bio"
            },
            slug: {
                en: "organic-oils-extracts",
                fr: "huiles-extraits-bio"
            },
            intro: {
                en: "Full spectrum botanical extraction.",
                fr: "Extraction spectre complet (Full Spectrum)."
            },
            description: {
                en: "Cold-pressed organic sublingual oils with coconut MCT carrier.",
                fr: "Huiles sublinguales bio pressées à froid avec support MCT coco."
            }
        },
        {
            name: {
                en: "Herbal Teas & Wellness",
                fr: "Infusions & Bien-être"
            },
            slug: {
                en: "herbal-teas-wellness",
                fr: "infusions-bien-etre"
            },
            intro: {
                en: "Organic botanical blends and hemp.",
                fr: "Mélanges de plantes et chanvre biologique."
            },
            description: {
                en: "Relaxing and digestive herbal teas crafted with French medicinal plants.",
                fr: "Tisanes relaxantes et digestives composées de plantes médicinales françaises."
            }
        },
        {
            name: {
                en: "Vaporizers & Accessories",
                fr: "Accessoires & Vapo"
            },
            slug: {
                en: "vaporizers-accessories",
                fr: "accessoires-vapo"
            },
            intro: {
                en: "High-precision equipment.",
                fr: "Matériel haute précision."
            },
            description: {
                en: "Portable vaporizers, ceramic grinders, and sustainable smoking accessories.",
                fr: "Vaporisateurs portables, grinders en céramique et accessoires durables."
            }
        },
    ],
    products: [
        {
            name: {
                en: "Ghost OG Indoor 10g",
                fr: "Ghost OG Indoor 10g"
            },
            slug: {
                en: "ghost-og-indoor",
                fr: "ghost-og-indoor"
            },
            intro: {
                en: "Intense aromas of pine and fresh citrus.",
                fr: "Arômes intenses de pin et d'agrumes."
            },
            description: {
                en: "Our signature Green Ghost strain. Dense, frosty buds cured slowly for 4 weeks.",
                fr: "Notre variété signature Green Ghost. Fleurs denses et résineuses séchées lentement pendant 4 semaines."
            },
            price: 79,
            stock: 45,
            categoryIndices: [0],
            status: {
                en: "published",
                fr: "publié"
            },
            images: ["https://images.unsplash.com/photo-1568644396922-5c3bfae12521?q=80&w=2670&auto=format&fit=crop"]
        },
        {
            name: {
                en: "Moonrock Ultimate Spectrum 5g",
                fr: "Moonrock Spectre Ultime 5g"
            },
            slug: {
                en: "moonrock-ultimate-spectrum",
                fr: "moonrock-spectre-ultime"
            },
            intro: {
                en: "Maximum terpene potency.",
                fr: "Puissance terpénique maximale."
            },
            description: {
                en: "Dense buds dipped in pure broad-spectrum distillate and rolled in premium dry-sift kief.",
                fr: "Têtes compactes trempées dans un distillat pur puis roulées dans du kief de premier choix."
            },
            price: 55,
            stock: 30,
            categoryIndices: [0, 3],
            status: {
                en: "published",
                fr: "publié"
            },
            images: ["https://images.unsplash.com/photo-1603909223429-69bb7101f420?q=80&w=2670&auto=format&fit=crop"]
        },
        {
            name: {
                en: "Full Spectrum 20% Organic Oil",
                fr: "Huile Full Spectrum 20% Bio"
            },
            slug: {
                en: "oil-full-spectrum-20",
                fr: "huile-full-spectrum-20"
            },
            intro: {
                en: "Optimal concentration for relaxation and sleep support.",
                fr: "Concentration optimale pour la relaxation et le sommeil."
            },
            description: {
                en: "10ml dropper bottle with 2000mg of natural active cannabinoids.",
                fr: "Flacon compte-gouttes de 10ml avec 2000mg de cannabinoïdes actifs naturels."
            },
            price: 69,
            stock: 60,
            categoryIndices: [1],
            status: {
                en: "published",
                fr: "publié"
            },
            images: ["https://images.unsplash.com/photo-1608248597359-0a6963e69124?q=80&w=2670&auto=format&fit=crop"]
        },
        {
            name: {
                en: "Serene Night Herbal Tea 100g",
                fr: "Tisane Nuit Sereine 100g"
            },
            slug: {
                en: "serene-night-herbal-tea",
                fr: "tisane-nuit-sereine"
            },
            intro: {
                en: "Chamomile, verbena, and organic hemp blend.",
                fr: "Mélange camomille, verveine et chanvre bio."
            },
            description: {
                en: "Soothing infusion ideal for preparing a calm and restorative night.",
                fr: "Infusion apaisante idéale pour préparer une nuit calme et réparatrice."
            },
            price: 18,
            stock: 80,
            categoryIndices: [2],
            status: {
                en: "published",
                fr: "publié"
            },
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
            src: '/brand/green-ghost/logo.webp',
            alt: 'Green Ghost Logo',
            width: 32,
            height: 32
        },
        icon: '/brand/green-ghost/icon.webp',
        favicon: '/favicon.ico',
        ogImage: '/brand/green-ghost/og-image.jpg',
        placeholderImage: '/brand/green-ghost/placeholder.webp',
        heroBanner: '/brand/green-ghost/hero-banner.webp'
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
