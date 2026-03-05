"use server"

import { z } from "zod";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { categorySchema, productSchema } from "@/schemas/admin";

export async function createCategory(data: z.infer<typeof categorySchema>) {
    const result = categorySchema.safeParse(data);
    if (!result.success) {
        return { success: false, errors: result.error.flatten().fieldErrors };
    }

    try {
        const category = await prisma.category.create({
            data: result.data,
        });
        revalidatePath('/[lang]/admin', 'layout');
        return { success: true, category };
    } catch (error: any) {
        console.error("CREATE_CATEGORY_ERROR:", error);

        // Handle Prisma unique constraint error
        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0];
            return {
                success: false,
                error: `A category with this ${field === 'slug_fr' ? 'French slug' : field === 'slug_en' ? 'English slug' : 'slug'} already exists.`
            };
        }

        return { success: false, error: "Failed to create category." };
    }
}

export async function createProduct(data: z.infer<typeof productSchema>) {
    const result = productSchema.safeParse(data);
    if (!result.success) {
        return { success: false, errors: result.error.flatten().fieldErrors };
    }

    try {
        const product = await prisma.product.create({
            data: result.data,
        });
        revalidatePath('/[lang]/admin', 'layout');
        return { success: true, product };
    } catch (error) {
        console.error("CREATE_PRODUCT_ERROR:", error);
        return { success: false, error: "Failed to create product." };
    }
}

export async function seedDemoData() {
    try {
        // Clear existing
        await prisma.product.deleteMany();
        await prisma.category.deleteMany();

        // Create 4 Categories
        const categoriesData = [
            { nameFr: "Forfaits Web", nameEn: "Web Packages", slugFr: "forfaits-web", slugEn: "web-packages", introFr: "Création de sites internet.", introEn: "Website creation.", descriptionFr: "Des forfaits complets pour votre présence en ligne.", descriptionEn: "Complete packages for your online presence." },
            { nameFr: "Maintenance", nameEn: "Maintenance", slugFr: "maintenance", slugEn: "maintenance-en", introFr: "Gardez votre site à jour.", introEn: "Keep your site up to date.", descriptionFr: "Services de maintenance mensuelle ou annuelle.", descriptionEn: "Monthly or yearly maintenance services." },
            { nameFr: "Fleurs CBD", nameEn: "CBD Flowers", slugFr: "fleurs-cbd", slugEn: "cbd-flowers", introFr: "Fleurs de qualité premium.", introEn: "Premium quality flowers.", descriptionFr: "Découvrez notre sélection de fleurs cultivées avec soin.", descriptionEn: "Discover our selection of carefully grown flowers." },
            { nameFr: "Accessoires", nameEn: "Accessories", slugFr: "accessoires", slugEn: "accessories", introFr: "Tout pour vos besoins.", introEn: "Everything for your needs.", descriptionFr: "Feuilles, filtres, grinders et plus encore.", descriptionEn: "Papers, filters, grinders and more." },
        ];

        const categories = [];
        for (const cat of categoriesData) {
            categories.push(await prisma.category.create({ data: cat }));
        }

        // Create Products (10 total)
        const productsData = [
            // Web Packages
            { nameFr: "Site Vitrine", nameEn: "Showcase Website", slugFr: "site-vitrine", slugEn: "showcase-website", introFr: "Présentez votre entreprise.", introEn: "Present your business.", descriptionFr: "Un site simple et efficace de 5 pages.", descriptionEn: "A simple and effective 5-page website.", price: 999, stock: 10, categoryId: categories[0].id, statusFr: "publié", statusEn: "published" },
            { nameFr: "Site E-commerce", nameEn: "E-commerce Website", slugFr: "site-ecommerce", slugEn: "ecommerce-website", introFr: "Vendez en ligne.", introEn: "Sell online.", descriptionFr: "Boutique en ligne complète avec paiement sécurisé.", descriptionEn: "Complete online store with secure payment.", price: 2999, stock: 5, categoryId: categories[0].id, statusFr: "publié", statusEn: "published" },
            { nameFr: "Sur Mesure", nameEn: "Custom Build", slugFr: "sur-mesure", slugEn: "custom-build", introFr: "Application web complexe.", introEn: "Complex web application.", descriptionFr: "Développement spécifique selon vos besoins.", descriptionEn: "Specific development according to your needs.", price: 5000, stock: 2, categoryId: categories[0].id, statusFr: "brouillon", statusEn: "draft" },
            // Maintenance
            { nameFr: "Maintenance Mensuelle", nameEn: "Monthly Maintenance", slugFr: "maintenance-mensuelle", slugEn: "monthly-maintenance", introFr: "Tranquillité d'esprit.", introEn: "Peace of mind.", descriptionFr: "Mises à jour et sauvegardes chaque mois.", descriptionEn: "Updates and backups every month.", price: 49, stock: 100, categoryId: categories[1].id, statusFr: "publié", statusEn: "published" },
            { nameFr: "Audit de Sécurité", nameEn: "Security Audit", slugFr: "audit-securite", slugEn: "security-audit", introFr: "Sécurisez votre plateforme.", introEn: "Secure your platform.", descriptionFr: "Analyse complète des vulnérabilités.", descriptionEn: "Complete analysis of vulnerabilities.", price: 499, stock: 10, categoryId: categories[1].id, statusFr: "publié", statusEn: "published" },
            // CBD Flowers
            { nameFr: "Amnesia Haze", nameEn: "Amnesia Haze", slugFr: "amnesia-haze", slugEn: "amnesia-haze", introFr: "L'incontournable.", introEn: "The essential.", descriptionFr: "Fleur CBD indoor puissante.", descriptionEn: "Powerful indoor CBD flower.", price: 9.90, stock: 200, categoryId: categories[2].id, statusFr: "publié", statusEn: "published" },
            { nameFr: "White Widow", nameEn: "White Widow", slugFr: "white-widow", slugEn: "white-widow", introFr: "Douce et relaxante.", introEn: "Sweet and relaxing.", descriptionFr: "Un classique indémodable.", descriptionEn: "A timeless classic.", price: 8.50, stock: 150, categoryId: categories[2].id, statusFr: "publié", statusEn: "published" },
            { nameFr: "OG Kush", nameEn: "OG Kush", slugFr: "og-kush", slugEn: "og-kush", introFr: "Saveurs intenses.", introEn: "Intense flavors.", descriptionFr: "Parfaite pour la fin de journée.", descriptionEn: "Perfect for the end of the day.", price: 11.00, stock: 50, categoryId: categories[2].id, statusFr: "brouillon", statusEn: "draft" },
            // Accessories
            { nameFr: "Grinder OCB", nameEn: "OCB Grinder", slugFr: "grinder-ocb", slugEn: "ocb-grinder", introFr: "Broyez avec précision.", introEn: "Grind with precision.", descriptionFr: "Grinder en métal 4 parties.", descriptionEn: "4-part metal grinder.", price: 15.00, stock: 30, categoryId: categories[3].id, statusFr: "publié", statusEn: "published" },
            { nameFr: "Feuilles RAW", nameEn: "RAW Papers", slugFr: "feuilles-raw", slugEn: "raw-papers", introFr: "Naturelles et non blanchies.", introEn: "Natural and unbleached.", descriptionFr: "Carnet de feuilles slim.", descriptionEn: "Slim rolling papers booklet.", price: 1.50, stock: 500, categoryId: categories[3].id, statusFr: "publié", statusEn: "published" },
        ];

        await prisma.product.createMany({ data: productsData });
        revalidatePath('/[lang]/admin', 'layout');
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to seed demo data." };
    }
}
