import { z } from "zod";

export const categorySchema = z.object({
    nameFr: z.string().min(1, "Name (FR) is required"),
    nameEn: z.string().min(1, "Name (EN) is required"),
    slugFr: z.string().min(1, "Slug (FR) is required"),
    slugEn: z.string().min(1, "Slug (EN) is required"),
    introFr: z.string().optional(),
    introEn: z.string().optional(),
    descriptionFr: z.string().min(1, "Description (FR) is required"),
    descriptionEn: z.string().min(1, "Description (EN) is required"),
});

export const productSchema = z.object({
    nameFr: z.string().min(1, "Name (FR) is required"),
    nameEn: z.string().min(1, "Name (EN) is required"),
    slugFr: z.string().min(1, "Slug (FR) is required"),
    slugEn: z.string().min(1, "Slug (EN) is required"),
    introFr: z.string().optional(),
    introEn: z.string().optional(),
    descriptionFr: z.string().min(1, "Description (FR) is required"),
    descriptionEn: z.string().min(1, "Description (EN) is required"),
    statusFr: z.string().min(1),
    statusEn: z.string().min(1),
    price: z.number().min(0),
    stock: z.number().min(0).int(),
    categoryId: z.string().min(1, "Category is required"),
});
