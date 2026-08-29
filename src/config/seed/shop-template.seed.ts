import { BrandSeedData } from '../types';

export const shopTemplateSeed: BrandSeedData = {
    categories: [
        {
            nameFr: "Forfaits Web",
            nameEn: "Web Packages",
            slugFr: "forfaits-web",
            slugEn: "web-packages",
            introFr: "Création de sites internet.",
            introEn: "Website creation.",
            descriptionFr: "Des forfaits complets pour votre présence en ligne.",
            descriptionEn: "Complete packages for your online presence."
        },
        {
            nameFr: "Maintenance",
            nameEn: "Maintenance",
            slugFr: "maintenance",
            slugEn: "maintenance-en",
            introFr: "Gardez votre site à jour.",
            introEn: "Keep your site up to date.",
            descriptionFr: "Services de maintenance mensuelle ou annuelle.",
            descriptionEn: "Monthly or yearly maintenance services."
        },
        {
            nameFr: "Produits Digitaux",
            nameEn: "Digital Products",
            slugFr: "produits-digitaux",
            slugEn: "digital-products",
            introFr: "Outils et templates.",
            introEn: "Tools and templates.",
            descriptionFr: "Templates et ressources prêtes à l'emploi.",
            descriptionEn: "Ready-to-use templates and assets."
        },
        {
            nameFr: "Accessoires",
            nameEn: "Accessories",
            slugFr: "accessoires",
            slugEn: "accessories",
            introFr: "Tout pour vos besoins.",
            introEn: "Everything for your needs.",
            descriptionFr: "Accessoires et fournitures essentiels.",
            descriptionEn: "Essential gear and accessories."
        },
    ],
    products: [
        {
            nameFr: "Site Vitrine Pro",
            nameEn: "Pro Showcase Website",
            slugFr: "site-vitrine-pro",
            slugEn: "pro-showcase-website",
            introFr: "Idéal pour les PME et indépendants.",
            introEn: "Ideal for SMBs and freelancers.",
            descriptionFr: "Site vitrine moderne, optimisé pour le référencement et mobile-first.",
            descriptionEn: "Modern showcase website, SEO optimized and mobile-first.",
            price: 1490,
            stock: 20,
            categoryIndex: 0,
            statusFr: "publié",
            statusEn: "published",
            images: ["https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop"]
        },
        {
            nameFr: "Boutique E-commerce",
            nameEn: "E-Commerce Store",
            slugFr: "boutique-ecommerce",
            slugEn: "ecommerce-store",
            introFr: "Vendez en ligne dès aujourd'hui.",
            introEn: "Start selling online today.",
            descriptionFr: "Plateforme e-commerce performante avec gestion de stock et paiements sécurisés.",
            descriptionEn: "High-performance e-commerce platform with inventory management and secure payments.",
            price: 2890,
            stock: 15,
            categoryIndex: 0,
            statusFr: "publié",
            statusEn: "published",
            images: ["https://images.unsplash.com/photo-1556742049-0a67e5572293?q=80&w=2670&auto=format&fit=crop"]
        },
        {
            nameFr: "Pack Sérénité Mensuel",
            nameEn: "Monthly Serenity Plan",
            slugFr: "pack-serenite-mensuel",
            slugEn: "monthly-serenity-plan",
            introFr: "Votre tranquillité d'esprit.",
            introEn: "Peace of mind.",
            descriptionFr: "Mises à jour techniques, sauvegardes quotidiennes et support prioritaire.",
            descriptionEn: "Technical updates, daily backups and priority support.",
            price: 99,
            stock: 100,
            categoryIndex: 1,
            statusFr: "publié",
            statusEn: "published",
            images: ["https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?q=80&w=2670&auto=format&fit=crop"]
        },
        {
            nameFr: "Audit de Performance & Sécurité",
            nameEn: "Performance & Security Audit",
            slugFr: "audit-performance-securite",
            slugEn: "performance-security-audit",
            introFr: "Optimisez votre plateforme.",
            introEn: "Optimize your platform.",
            descriptionFr: "Analyse approfondie des performances web vitals, accessibilité et sécurité.",
            descriptionEn: "In-depth analysis of Core Web Vitals, accessibility, and security vulnerabilities.",
            price: 490,
            stock: 10,
            categoryIndex: 1,
            statusFr: "publié",
            statusEn: "published",
            images: ["https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2670&auto=format&fit=crop"]
        },
        {
            nameFr: "UI Kit Design System",
            nameEn: "UI Kit Design System",
            slugFr: "ui-kit-design-system",
            slugEn: "ui-kit-design-system",
            introFr: "Composants réutilisables.",
            introEn: "Reusable components.",
            descriptionFr: "Ensemble de 80+ composants React/Tailwind conçus avec précision.",
            descriptionEn: "Set of 80+ handcrafted React/Tailwind UI components.",
            price: 79,
            stock: 500,
            categoryIndex: 2,
            statusFr: "publié",
            statusEn: "published",
            images: ["https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=2555&auto=format&fit=crop"]
        },
        {
            nameFr: "Pack Icônes Minimalistes",
            nameEn: "Minimalist Icons Pack",
            slugFr: "pack-icones-minimalistes",
            slugEn: "minimalist-icons-pack",
            introFr: "Icônes vectorielles.",
            introEn: "Vector icons.",
            descriptionFr: "Collection de 500 icônes vectorielles SVG épurées et modernes.",
            descriptionEn: "Collection of 500 clean and modern vector SVG icons.",
            price: 29,
            stock: 500,
            categoryIndex: 2,
            statusFr: "publié",
            statusEn: "published",
            images: ["https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"]
        }
    ]
};
