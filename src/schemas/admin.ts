import { z } from "zod";

export const categorySchema = z.object({
    name: z.record(z.string(), z.string()),
    slug: z.record(z.string(), z.string()),
    intro: z.record(z.string(), z.string()).optional(),
    description: z.record(z.string(), z.string()),
    status: z.enum(["draft", "published"]).default("published"),
    imageUrl: z.string().optional().nullable(),
    order: z.coerce.number().int().default(0),
    showInHeader: z.boolean().default(false),
    enableProductZoom: z.boolean().default(true).optional(),
    hideSoldOutByDefault: z.boolean().default(false).optional(),
});

export const customFieldValueSchema = z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.record(z.string(), z.string()),
]);

export const productSchema = z.object({
    name: z.record(z.string(), z.string()),
    slug: z.record(z.string(), z.string()),
    intro: z.record(z.string(), z.string()).optional(),
    description: z.record(z.string(), z.string()).optional(),
    status: z.record(z.string(), z.string()).optional(),
    price: z.number().min(0),
    hidePrice: z.boolean().default(false),
    stock: z.number().min(0),
    artist: z.string().optional().nullable(),
    vendor: z.string().optional().nullable(),
    categoryIds: z.array(z.string()).min(1, "At least one category is required"),
    categoryId: z.string().optional(),
    imageUrl: z.string().optional().nullable(),
    images: z.array(z.string()).optional(),
    order: z.coerce.number().int().optional(),
    metadata: z.record(z.string(), customFieldValueSchema).optional(),
});

export const pageSchema = z.object({
    slug: z.record(z.string(), z.string()).refine(
        (val) => Object.values(val).some((v) => v && v.trim().length > 0),
        { message: "Slug is required in at least one language" }
    ),
    title: z.record(z.string(), z.string()).refine(
        (val) => Object.values(val).some((v) => v && v.trim().length > 0),
        { message: "Title is required in at least one language" }
    ),
    subtitle: z.record(z.string(), z.string()).optional(),
    content: z.record(z.string(), z.string()),
    status: z.enum(["draft", "published"]),
    showInHeader: z.boolean(),
    showInFooter: z.boolean(),
    order: z.coerce.number().int().optional(),
    activeBlocks: z.array(z.string()).default([]),
    imageUrl: z.string().optional().nullable(),
    image_url: z.string().optional().nullable(),
    coverImageUrl: z.string().optional().nullable(),
    banner_image: z.string().optional().nullable(),
    // Optional legacy fields for backward compatibility
    slug_en: z.string().optional(),
    slug_fr: z.string().optional(),
    title_en: z.string().optional(),
    title_fr: z.string().optional(),
    subtitle_en: z.string().optional(),
    subtitle_fr: z.string().optional(),
    content_en: z.string().optional(),
    content_fr: z.string().optional(),
    meta_title_en: z.string().optional(),
    meta_title_fr: z.string().optional(),
    meta_description_en: z.string().optional(),
    meta_description_fr: z.string().optional(),
});

export type PageFormData = z.infer<typeof pageSchema>;
