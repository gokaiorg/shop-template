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
    categoryIds: z.array(z.string()).min(1, "At least one category is required"),
    categoryId: z.string().optional(),
    imageUrl: z.string().optional().nullable(),
    images: z.array(z.string()).optional(),
});

export const pageSchema = z.object({
    slug: z
        .string()
        .min(1, "Slug is required")
        .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase alphanumeric characters and hyphens"),
    title: z.record(z.string(), z.string()).refine(
        (val) => Object.values(val).some((v) => v && v.trim().length > 0),
        { message: "Title is required in at least one language" }
    ),
    content: z.record(z.string(), z.string()),
    status: z.enum(["draft", "published"]),
    showInHeader: z.boolean(),
    showInFooter: z.boolean(),
    // Optional legacy fields for backward compatibility
    title_en: z.string().optional(),
    title_fr: z.string().optional(),
    content_en: z.string().optional(),
    content_fr: z.string().optional(),
    meta_title_en: z.string().optional(),
    meta_title_fr: z.string().optional(),
    meta_description_en: z.string().optional(),
    meta_description_fr: z.string().optional(),
});

export type PageFormData = z.infer<typeof pageSchema>;
