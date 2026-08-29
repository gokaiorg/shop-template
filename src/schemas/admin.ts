import { z } from "zod";

export const categorySchema = z.object({
    nameEn: z.string().min(1, "Name (EN) is required"),
    slugEn: z.string().min(1, "Slug (EN) is required"),
    introEn: z.string().optional(),
    descriptionEn: z.string().min(1, "Description (EN) is required"),
    nameFr: z.string().optional(),
    slugFr: z.string().optional(),
    introFr: z.string().optional(),
    descriptionFr: z.string().optional(),
});

export const productSchema = z.object({
    nameEn: z.string().min(1, "Name (EN) is required"),
    slugEn: z.string().min(1, "Slug (EN) is required"),
    introEn: z.string().optional(),
    descriptionEn: z.string().min(1, "Description (EN) is required"),
    statusEn: z.string().min(1, "Status (EN) is required"),
    nameFr: z.string().optional(),
    slugFr: z.string().optional(),
    introFr: z.string().optional(),
    descriptionFr: z.string().optional(),
    statusFr: z.string().optional(),
    price: z.number().min(0),
    stock: z.number().min(0).int(),
    categoryId: z.string().min(1, "Category is required"),
    imageUrl: z.string().optional().nullable(),
    images: z.array(z.string()).optional(),
});

export const pageSchema = z.object({
    title_en: z.string().min(1, "Title (EN) is required"),
    meta_title_en: z.string().min(1, "Meta Title (EN) is required"),
    meta_description_en: z.string().min(1, "Meta Description (EN) is required"),
    content_en: z.string().min(1, "Content (EN) is required"),
    title_fr: z.string().optional(),
    meta_title_fr: z.string().optional(),
    meta_description_fr: z.string().optional(),
    content_fr: z.string().optional(),
});
