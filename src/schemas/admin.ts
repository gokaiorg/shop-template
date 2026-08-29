import { z } from "zod";

export const categorySchema = z.object({
    name: z.record(z.string(), z.string()),
    slug: z.record(z.string(), z.string()),
    intro: z.record(z.string(), z.string()).optional(),
    description: z.record(z.string(), z.string()),
});

export const productSchema = z.object({
    name: z.record(z.string(), z.string()),
    slug: z.record(z.string(), z.string()),
    intro: z.record(z.string(), z.string()).optional(),
    description: z.record(z.string(), z.string()),
    status: z.record(z.string(), z.string()).optional(),
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
