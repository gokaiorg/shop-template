"use server"

import { z } from "zod";
import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

import { categorySchema, productSchema, pageSchema } from "@/schemas/admin";
import { brandConfig } from "@/config/brand.config";
import { shopTemplateSeed } from "@/config/seed/shop-template.seed";
import { getDefaultLocale, getSupportedLocales } from "@/app/i18n-config";

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
        const defaultLocale = getDefaultLocale();
        const primarySlug = result.data.slug[defaultLocale] || Object.values(result.data.slug)[0];

        // Slug uniqueness check on default locale
        if (primarySlug) {
            const existing = await adminDb.collection("categories")
                .where(`slug.${defaultLocale}`, "==", primarySlug)
                .get();
            if (!existing.empty) {
                return { success: false, error: `A category with slug "${primarySlug}" already exists.` };
            }
        }

        const nameMap = { ...result.data.name };
        const slugMap = { ...result.data.slug };
        const introMap = { ...(result.data.intro || {}) };
        const descMap = { ...result.data.description };

        // Populate fallback fields for backward compatibility
        const nameEn = nameMap.en || nameMap[defaultLocale] || "";
        const nameFr = nameMap.fr || nameMap[defaultLocale] || "";
        const slugEn = slugMap.en || slugMap[defaultLocale] || "";
        const slugFr = slugMap.fr || slugMap[defaultLocale] || "";
        const introEn = introMap.en || introMap[defaultLocale] || "";
        const introFr = introMap.fr || introMap[defaultLocale] || "";
        const descriptionEn = descMap.en || descMap[defaultLocale] || "";
        const descriptionFr = descMap.fr || descMap[defaultLocale] || "";

        const ref = adminDb.collection("categories").doc();
        const categoryData = {
            id: ref.id,
            name: nameMap,
            slug: slugMap,
            intro: introMap,
            description: descMap,
            nameEn,
            nameFr,
            slugEn,
            slugFr,
            introEn,
            introFr,
            descriptionEn,
            descriptionFr,
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
        const defaultLocale = getDefaultLocale();
        const primarySlug = result.data.slug[defaultLocale] || Object.values(result.data.slug)[0];

        if (primarySlug) {
            const existing = await adminDb.collection("categories")
                .where(`slug.${defaultLocale}`, "==", primarySlug)
                .get();
            if (!existing.empty && existing.docs[0].id !== id) {
                return { success: false, error: `A category with slug "${primarySlug}" already exists.` };
            }
        }

        const nameMap = { ...result.data.name };
        const slugMap = { ...result.data.slug };
        const introMap = { ...(result.data.intro || {}) };
        const descMap = { ...result.data.description };

        const nameEn = nameMap.en || nameMap[defaultLocale] || "";
        const nameFr = nameMap.fr || nameMap[defaultLocale] || "";
        const slugEn = slugMap.en || slugMap[defaultLocale] || "";
        const slugFr = slugMap.fr || slugMap[defaultLocale] || "";
        const introEn = introMap.en || introMap[defaultLocale] || "";
        const introFr = introMap.fr || introMap[defaultLocale] || "";
        const descriptionEn = descMap.en || descMap[defaultLocale] || "";
        const descriptionFr = descMap.fr || descMap[defaultLocale] || "";

        const ref = adminDb.collection("categories").doc(id);
        const categoryData = {
            name: nameMap,
            slug: slugMap,
            intro: introMap,
            description: descMap,
            nameEn,
            nameFr,
            slugEn,
            slugFr,
            introEn,
            introFr,
            descriptionEn,
            descriptionFr,
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
        const defaultLocale = getDefaultLocale();
        const ref = adminDb.collection("products").doc();
        const images = result.data.images && result.data.images.length > 0 
            ? result.data.images 
            : (result.data.imageUrl ? [result.data.imageUrl] : []);

        const nameMap = { ...result.data.name };
        const slugMap = { ...result.data.slug };
        const introMap = { ...(result.data.intro || {}) };
        const descMap = { ...result.data.description };
        const statusMap = { ...(result.data.status || {}) };

        const nameEn = nameMap.en || nameMap[defaultLocale] || "";
        const nameFr = nameMap.fr || nameMap[defaultLocale] || "";
        const slugEn = slugMap.en || slugMap[defaultLocale] || "";
        const slugFr = slugMap.fr || slugMap[defaultLocale] || "";
        const introEn = introMap.en || introMap[defaultLocale] || "";
        const introFr = introMap.fr || introMap[defaultLocale] || "";
        const descriptionEn = descMap.en || descMap[defaultLocale] || "";
        const descriptionFr = descMap.fr || descMap[defaultLocale] || "";
        const statusEn = statusMap.en || statusMap[defaultLocale] || "draft";
        const statusFr = statusMap.fr || statusMap[defaultLocale] || (statusEn === "draft" ? "brouillon" : "publié");

        const categoryIds = result.data.categoryIds || (result.data.categoryId ? [result.data.categoryId] : []);
        const primaryCategoryId = categoryIds[0] || "";

        const productData = {
            id: ref.id,
            price: result.data.price,
            stock: result.data.stock,
            categoryIds,
            categoryId: primaryCategoryId,
            name: nameMap,
            slug: slugMap,
            intro: introMap,
            description: descMap,
            status: statusMap,
            nameEn,
            nameFr,
            slugEn,
            slugFr,
            introEn,
            introFr,
            descriptionEn,
            descriptionFr,
            statusEn,
            statusFr,
            imageUrl: result.data.imageUrl || (images.length > 0 ? images[0] : null),
            images,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await ref.set(productData);

        revalidatePath('/[lang]/admin', 'layout');
        revalidatePath('/[lang]/shop', 'layout');
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
        const defaultLocale = getDefaultLocale();
        const ref = adminDb.collection("products").doc(id);
        const images = result.data.images && result.data.images.length > 0 
            ? result.data.images 
            : (result.data.imageUrl ? [result.data.imageUrl] : []);

        const nameMap = { ...result.data.name };
        const slugMap = { ...result.data.slug };
        const introMap = { ...(result.data.intro || {}) };
        const descMap = { ...result.data.description };
        const statusMap = { ...(result.data.status || {}) };

        const nameEn = nameMap.en || nameMap[defaultLocale] || "";
        const nameFr = nameMap.fr || nameMap[defaultLocale] || "";
        const slugEn = slugMap.en || slugMap[defaultLocale] || "";
        const slugFr = slugMap.fr || slugMap[defaultLocale] || "";
        const introEn = introMap.en || introMap[defaultLocale] || "";
        const introFr = introMap.fr || introMap[defaultLocale] || "";
        const descriptionEn = descMap.en || descMap[defaultLocale] || "";
        const descriptionFr = descMap.fr || descMap[defaultLocale] || "";
        const statusEn = statusMap.en || statusMap[defaultLocale] || "draft";
        const statusFr = statusMap.fr || statusMap[defaultLocale] || (statusEn === "draft" ? "brouillon" : "publié");

        const categoryIds = result.data.categoryIds || (result.data.categoryId ? [result.data.categoryId] : []);
        const primaryCategoryId = categoryIds[0] || "";

        const productData = {
            price: result.data.price,
            stock: result.data.stock,
            categoryIds,
            categoryId: primaryCategoryId,
            name: nameMap,
            slug: slugMap,
            intro: introMap,
            description: descMap,
            status: statusMap,
            nameEn,
            nameFr,
            slugEn,
            slugFr,
            introEn,
            introFr,
            descriptionEn,
            descriptionFr,
            statusEn,
            statusFr,
            imageUrl: result.data.imageUrl || (images.length > 0 ? images[0] : null),
            images,
            updatedAt: new Date(),
        };
        await ref.update(productData);

        revalidatePath('/[lang]/admin', 'layout');
        revalidatePath('/[lang]/shop', 'layout');
        revalidatePath('/[lang]/product/[slug]', 'page');
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
        const defaultLocale = getDefaultLocale();
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
            const nameEn = cat.name.en || cat.name[defaultLocale] || "";
            const nameFr = cat.name.fr || cat.name[defaultLocale] || "";
            const slugEn = cat.slug.en || cat.slug[defaultLocale] || "";
            const slugFr = cat.slug.fr || cat.slug[defaultLocale] || "";
            const introEn = cat.intro?.en || cat.intro?.[defaultLocale] || "";
            const introFr = cat.intro?.fr || cat.intro?.[defaultLocale] || "";
            const descriptionEn = cat.description.en || cat.description[defaultLocale] || "";
            const descriptionFr = cat.description.fr || cat.description[defaultLocale] || "";

            const data = {
                id: ref.id,
                ...cat,
                nameEn,
                nameFr,
                slugEn,
                slugFr,
                introEn,
                introFr,
                descriptionEn,
                descriptionFr,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await ref.set(data);
            categories.push(data);
        }

        const productBatch = adminDb.batch();
        productsData.forEach(prod => {
            const indices = prod.categoryIndices || (typeof prod.categoryIndex === 'number' ? [prod.categoryIndex] : [0]);
            const assignedCats = indices.map(idx => categories[idx] || categories[0]);
            const categoryIds = assignedCats.map(c => c.id);
            const primaryCategory = assignedCats[0] || categories[0];

            const ref = adminDb.collection("products").doc();
            const { categoryIndex: _ignored1, categoryIndices: _ignored2, ...rest } = prod;

            const nameEn = prod.name.en || prod.name[defaultLocale] || "";
            const nameFr = prod.name.fr || prod.name[defaultLocale] || "";
            const slugEn = prod.slug.en || prod.slug[defaultLocale] || "";
            const slugFr = prod.slug.fr || prod.slug[defaultLocale] || "";
            const introEn = prod.intro?.en || prod.intro?.[defaultLocale] || "";
            const introFr = prod.intro?.fr || prod.intro?.[defaultLocale] || "";
            const descriptionEn = prod.description.en || prod.description[defaultLocale] || "";
            const descriptionFr = prod.description.fr || prod.description[defaultLocale] || "";
            const statusEn = prod.status.en || prod.status[defaultLocale] || "published";
            const statusFr = prod.status.fr || prod.status[defaultLocale] || "publié";

            productBatch.set(ref, {
                id: ref.id,
                ...rest,
                nameEn,
                nameFr,
                slugEn,
                slugFr,
                introEn,
                introFr,
                descriptionEn,
                descriptionFr,
                statusEn,
                statusFr,
                categoryIds,
                categoryId: primaryCategory.id,
                imageUrl: prod.images && prod.images.length > 0 ? prod.images[0] : null,
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
        const title_fr = result.data.title_fr || result.data.title_en;
        const meta_title_fr = result.data.meta_title_fr || result.data.meta_title_en;
        const meta_description_fr = result.data.meta_description_fr || result.data.meta_description_en;
        const content_fr = result.data.content_fr || result.data.content_en;

        const ref = adminDb.collection("pages").doc(id);
        const pageData = {
            ...result.data,
            title_fr,
            meta_title_fr,
            meta_description_fr,
            content_fr,
            updatedAt: new Date(),
        };
        await ref.update(pageData);

        revalidatePath('/[lang]/admin', 'layout');
        revalidatePath('/[lang]/(shop)/[slug]', 'page');
        
        return { success: true, page: { id, ...pageData } };
    } catch (error) {
        console.error("UPDATE_PAGE_ERROR:", error);
        return { success: false, error: "Failed to update page." };
    }
}

export async function deleteCategory(id: string) {
    const session = await auth();
    const userRole = (session?.user?.role || "").toLowerCase();
    if (userRole !== "admin") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await adminDb.collection("categories").doc(id).delete();

        revalidatePath('/[lang]/admin', 'layout');
        revalidatePath('/[lang]/shop', 'layout');
        return { success: true };
    } catch (error) {
        console.error("DELETE_CATEGORY_ERROR:", error);
        return { success: false, error: "Failed to delete category." };
    }
}

export async function deleteProduct(id: string) {
    const session = await auth();
    const userRole = (session?.user?.role || "").toLowerCase();
    if (userRole !== "admin") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const productRef = adminDb.collection("products").doc(id);
        const productDoc = await productRef.get();

        if (productDoc.exists) {
            const productData = productDoc.data();
            const imagesToDelete = [productData?.imageUrl, ...(productData?.images || [])].filter(Boolean);

            for (const imgUrl of imagesToDelete) {
                if (typeof imgUrl === 'string') {
                    try {
                        let filePath = imgUrl;
                        if (imgUrl.includes('/o/')) {
                            const pathPart = imgUrl.split('/o/')[1]?.split('?')[0];
                            if (pathPart) filePath = decodeURIComponent(pathPart);
                        }
                        if (imgUrl.includes('firebasestorage.googleapis.com') || imgUrl.includes('storage.googleapis.com') || (!imgUrl.startsWith('http://') && !imgUrl.startsWith('https://'))) {
                            const bucket = adminStorage.bucket();
                            const file = bucket.file(filePath);
                            const [exists] = await file.exists();
                            if (exists) {
                                await file.delete();
                            }
                        }
                    } catch (storageErr) {
                        console.warn('[STORAGE_CLEANUP_WARNING]', storageErr);
                    }
                }
            }
        }

        await productRef.delete();

        revalidatePath('/[lang]/admin', 'layout');
        revalidatePath('/[lang]/shop', 'layout');
        revalidatePath('/[lang]/product/[slug]', 'page');
        return { success: true };
    } catch (error) {
        console.error("DELETE_PRODUCT_ERROR:", error);
        return { success: false, error: "Failed to delete product." };
    }
}

export async function deletePage(id: string) {
    const session = await auth();
    const userRole = (session?.user?.role || "").toLowerCase();
    if (userRole !== "admin") {
        return { success: false, error: "Unauthorized" };
    }

    try {
        await adminDb.collection("pages").doc(id).delete();

        revalidatePath('/[lang]/admin', 'layout');
        revalidatePath('/[lang]/(shop)/[slug]', 'page');
        return { success: true };
    } catch (error) {
        console.error("DELETE_PAGE_ERROR:", error);
        return { success: false, error: "Failed to delete page." };
    }
}
