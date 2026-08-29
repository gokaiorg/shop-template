"use server"

import { z } from "zod";
import { adminDb } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

import { categorySchema, productSchema, pageSchema } from "@/schemas/admin";
import { brandConfig } from "@/config/brand.config";
import { shopTemplateSeed } from "@/config/seed/shop-template.seed";

export async function createCategory(data: z.infer<typeof categorySchema>) {
    const session = await auth();
    const userRole = (session?.user?.role || "").toLowerCase();
    if (userRole !== "admin") {
        return { success: false, error: "Unauthorized" };
    }

    const result = categorySchema.safeParse(data);
    if (!result.success) {
        return { success: false, errors: result.error.flatten().fieldErrors };
    }

    try {
        // Basic unique slug check
        const existingFr = await adminDb.collection("categories").where("slugFr", "==", result.data.slugFr).get();
        if (!existingFr.empty) return { success: false, error: "A category with this French slug already exists." };
        
        const existingEn = await adminDb.collection("categories").where("slugEn", "==", result.data.slugEn).get();
        if (!existingEn.empty) return { success: false, error: "A category with this English slug already exists." };

        const ref = adminDb.collection("categories").doc();
        const categoryData = {
            id: ref.id,
            ...result.data,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await ref.set(categoryData);

        revalidatePath('/[lang]/admin', 'layout');
        return { success: true, category: categoryData };
    } catch (error) {
        console.error("CREATE_CATEGORY_ERROR:", error);
        return { success: false, error: "Failed to create category." };
    }
}

export async function updateCategory(id: string, data: z.infer<typeof categorySchema>) {
    const session = await auth();
    const userRole = (session?.user?.role || "").toLowerCase();
    if (userRole !== "admin") {
        return { success: false, error: "Unauthorized" };
    }

    const result = categorySchema.safeParse(data);
    if (!result.success) {
        return { success: false, errors: result.error.flatten().fieldErrors };
    }

    try {
        const existingFr = await adminDb.collection("categories").where("slugFr", "==", result.data.slugFr).get();
        if (!existingFr.empty && existingFr.docs[0].id !== id) return { success: false, error: "A category with this French slug already exists." };
        
        const existingEn = await adminDb.collection("categories").where("slugEn", "==", result.data.slugEn).get();
        if (!existingEn.empty && existingEn.docs[0].id !== id) return { success: false, error: "A category with this English slug already exists." };

        const ref = adminDb.collection("categories").doc(id);
        const categoryData = {
            ...result.data,
            updatedAt: new Date(),
        };
        await ref.update(categoryData);

        revalidatePath('/[lang]/admin', 'layout');
        return { success: true, category: { id, ...categoryData } };
    } catch (error) {
        console.error("UPDATE_CATEGORY_ERROR:", error);
        return { success: false, error: "Failed to update category." };
    }
}

export async function createProduct(data: z.infer<typeof productSchema>) {
    const session = await auth();
    const userRole = (session?.user?.role || "").toLowerCase();
    if (userRole !== "admin") {
        return { success: false, error: "Unauthorized" };
    }

    const result = productSchema.safeParse(data);
    if (!result.success) {
        return { success: false, errors: result.error.flatten().fieldErrors };
    }

    try {
        const ref = adminDb.collection("products").doc();
        const productData = {
            id: ref.id,
            ...result.data,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await ref.set(productData);

        revalidatePath('/[lang]/admin', 'layout');
        return { success: true, product: productData };
    } catch (error) {
        console.error("CREATE_PRODUCT_ERROR:", error);
        return { success: false, error: "Failed to create product." };
    }
}

export async function updateProduct(id: string, data: z.infer<typeof productSchema>) {
    const session = await auth();
    const userRole = (session?.user?.role || "").toLowerCase();
    if (userRole !== "admin") {
        return { success: false, error: "Unauthorized" };
    }

    const result = productSchema.safeParse(data);
    if (!result.success) {
        return { success: false, errors: result.error.flatten().fieldErrors };
    }

    try {
        const ref = adminDb.collection("products").doc(id);
        const productData = {
            ...result.data,
            updatedAt: new Date(),
        };
        await ref.update(productData);

        revalidatePath('/[lang]/admin', 'layout');
        return { success: true, product: { id, ...productData } };
    } catch (error) {
        console.error("UPDATE_PRODUCT_ERROR:", error);
        return { success: false, error: "Failed to update product." };
    }
}

export async function seedDemoData() {
    const session = await auth();
    const userRole = (session?.user?.role || "").toLowerCase();
    if (userRole !== "admin") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const prevProducts = await adminDb.collection("products").get();
        const prevCategories = await adminDb.collection("categories").get();
        
        const deleteBatch = adminDb.batch();
        prevProducts.docs.forEach(doc => deleteBatch.delete(doc.ref));
        prevCategories.docs.forEach(doc => deleteBatch.delete(doc.ref));
        await deleteBatch.commit();

        const seedCatalog = brandConfig.seedData || shopTemplateSeed;
        const categoriesData = seedCatalog.categories;
        const productsData = seedCatalog.products;

        const categories: any[] = [];
        for (const cat of categoriesData) {
            const ref = adminDb.collection("categories").doc();
            const data = { id: ref.id, ...cat, createdAt: new Date(), updatedAt: new Date() };
            await ref.set(data);
            categories.push(data);
        }

        const productBatch = adminDb.batch();
        productsData.forEach(prod => {
            const category = categories[prod.categoryIndex] || categories[0];
            const ref = adminDb.collection("products").doc();
            const { categoryIndex: _ignored, ...rest } = prod;
            productBatch.set(ref, {
                id: ref.id,
                ...rest,
                categoryId: category.id,
                images: prod.images || [],
                createdAt: new Date(),
                updatedAt: new Date(),
            });
        });
        await productBatch.commit();

        revalidatePath('/[lang]/admin', 'layout');
        revalidatePath('/[lang]/shop', 'layout');
        return { success: true };
    } catch (error) {
        console.error("SEED_DEMO_DATA_ERROR:", error);
        return { success: false, error: "Failed to seed demo data." };
    }
}

export async function updatePage(id: string, data: z.infer<typeof pageSchema>) {
    const session = await auth();
    const userRole = (session?.user?.role || "").toLowerCase();
    if (userRole !== "admin") {
        return { success: false, error: "Unauthorized" };
    }

    const result = pageSchema.safeParse(data);
    if (!result.success) {
        return { success: false, errors: result.error.flatten().fieldErrors };
    }

    try {
        const ref = adminDb.collection("pages").doc(id);
        const pageData = {
            ...result.data,
            updatedAt: new Date(),
        };
        await ref.update(pageData);

        revalidatePath('/[lang]/admin', 'layout');
        // Also revalidate the public page route
        revalidatePath('/[lang]/(shop)/[slug]', 'page');
        
        return { success: true, page: { id, ...pageData } };
    } catch (error) {
        console.error("UPDATE_PAGE_ERROR:", error);
        return { success: false, error: "Failed to update page." };
    }
}
