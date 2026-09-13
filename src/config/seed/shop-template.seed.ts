import { BrandSeedData } from '../types';

export const shopTemplateSeed: BrandSeedData = {
    categories: [
        {
            name: {
                en: "Web Packages",
                fr: "Forfaits Web"
            },
            slug: {
                en: "web-packages",
                fr: "forfaits-web"
            },
            intro: {
                en: "Website creation.",
                fr: "Création de sites internet."
            },
            description: {
                en: "Complete packages for your online presence.",
                fr: "Des forfaits complets pour votre présence en ligne."
            }
        },
        {
            name: {
                en: "Maintenance",
                fr: "Maintenance"
            },
            slug: {
                en: "maintenance",
                fr: "maintenance-fr"
            },
            intro: {
                en: "Keep your site up to date.",
                fr: "Gardez votre site à jour."
            },
            description: {
                en: "Monthly or yearly maintenance services.",
                fr: "Services de maintenance mensuelle ou annuelle."
            }
        },
        {
            name: {
                en: "Digital Products",
                fr: "Produits Digitaux"
            },
            slug: {
                en: "digital-products",
                fr: "produits-digitaux"
            },
            intro: {
                en: "Tools and templates.",
                fr: "Outils et templates."
            },
            description: {
                en: "Ready-to-use templates and assets.",
                fr: "Templates et ressources prêtes à l'emploi."
            }
        },
        {
            name: {
                en: "Accessories",
                fr: "Accessoires"
            },
            slug: {
                en: "accessories",
                fr: "accessoires"
            },
            intro: {
                en: "Everything for your needs.",
                fr: "Tout pour vos besoins."
            },
            description: {
                en: "Essential gear and accessories.",
                fr: "Accessoires et fournitures essentiels."
            }
        },
    ],
    products: [
        {
            name: {
                en: "Pro Showcase Website",
                fr: "Site Vitrine Pro"
            },
            slug: {
                en: "pro-showcase-website",
                fr: "site-vitrine-pro"
            },
            intro: {
                en: "Ideal for SMBs and freelancers.",
                fr: "Idéal pour les PME et indépendants."
            },
            description: {
                en: "Modern showcase website, SEO optimized and mobile-first.",
                fr: "Site vitrine moderne, optimisé pour le référencement et mobile-first."
            },
            price: 1490,
            stock: 20,
            categoryIndices: [0],
            status: {
                en: "published",
                fr: "publié"
            },
            images: ["https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop"]
        },
        {
            name: {
                en: "E-Commerce Store",
                fr: "Boutique E-commerce"
            },
            slug: {
                en: "ecommerce-store",
                fr: "boutique-ecommerce"
            },
            intro: {
                en: "Start selling online today.",
                fr: "Vendez en ligne dès aujourd'hui."
            },
            description: {
                en: "High-performance e-commerce platform with inventory management and secure payments.",
                fr: "Plateforme e-commerce performante avec gestion de stock et paiements sécurisés."
            },
            price: 2890,
            stock: 15,
            categoryIndices: [0, 1],
            status: {
                en: "published",
                fr: "publié"
            },
            images: ["https://images.unsplash.com/photo-1556742049-0a67e5572293?q=80&w=2670&auto=format&fit=crop"]
        },
        {
            name: {
                en: "Monthly Serenity Plan",
                fr: "Pack Sérénité Mensuel"
            },
            slug: {
                en: "monthly-serenity-plan",
                fr: "pack-serenite-mensuel"
            },
            intro: {
                en: "Peace of mind.",
                fr: "Votre tranquillité d'esprit."
            },
            description: {
                en: "Technical updates, daily backups and priority support.",
                fr: "Mises à jour techniques, sauvegardes quotidiennes et support prioritaire."
            },
            price: 99,
            stock: 100,
            categoryIndices: [1],
            status: {
                en: "published",
                fr: "publié"
            },
            images: ["https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2670&auto=format&fit=crop"]
        },
        {
            name: {
                en: "Performance & Security Audit",
                fr: "Audit de Performance & Sécurité"
            },
            slug: {
                en: "performance-security-audit",
                fr: "audit-performance-securite"
            },
            intro: {
                en: "Optimize your platform.",
                fr: "Optimisez votre plateforme."
            },
            description: {
                en: "In-depth analysis of Core Web Vitals, accessibility, and security vulnerabilities.",
                fr: "Analyse approfondie des performances web vitals, accessibilité et sécurité."
            },
            price: 490,
            stock: 10,
            categoryIndices: [1, 2],
            status: {
                en: "published",
                fr: "publié"
            },
            images: ["https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop"]
        },
        {
            name: {
                en: "UI Kit Design System",
                fr: "UI Kit Design System"
            },
            slug: {
                en: "ui-kit-design-system",
                fr: "ui-kit-design-system"
            },
            intro: {
                en: "Reusable components.",
                fr: "Composants réutilisables."
            },
            description: {
                en: "Set of 80+ handcrafted React/Tailwind UI components.",
                fr: "Ensemble de 80+ composants React/Tailwind conçus avec précision."
            },
            price: 79,
            stock: 500,
            categoryIndices: [2],
            status: {
                en: "published",
                fr: "publié"
            },
            images: ["https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=2555&auto=format&fit=crop"]
        },
        {
            name: {
                en: "Minimalist Icons Pack",
                fr: "Pack Icônes Minimalistes"
            },
            slug: {
                en: "minimalist-icons-pack",
                fr: "pack-icones-minimalistes"
            },
            intro: {
                en: "Vector icons.",
                fr: "Icônes vectorielles."
            },
            description: {
                en: "Collection of 500 clean and modern vector SVG icons.",
                fr: "Collection de 500 icônes vectorielles SVG épurées et modernes."
            },
            price: 29,
            stock: 500,
            categoryIndices: [2, 3],
            status: {
                en: "published",
                fr: "publié"
            },
            images: ["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"]
        }
    ]
};
