import { z } from 'zod';

export const socialLinkSchema = z.object({
    platform: z.string().min(1, 'Platform is required'),
    url: z.string().min(1, 'URL is required'),
});

export const storeSettingsSchema = z.object({
    brandName: z.string().min(1, 'Brand name is required'),
    logoUrl: z.string().min(1, 'Logo URL is required'),
    faviconUrl: z.string(),
    heroTitle: z.record(z.string(), z.string()).refine((val) => Object.values(val).some(v => v && v.trim().length > 0), {
        message: 'Hero title is required in at least one language',
    }),
    heroDescription: z.record(z.string(), z.string()),
    heroBackgroundImageUrl: z.string().optional(),
    catalogTitle: z.record(z.string(), z.string()).optional(),
    catalogSlug: z.string().min(1, 'Catalog slug is required').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase alphanumeric with hyphens (e.g. shop or galerie)'),
    catalogBannerUrl: z.string().optional(),
    footerDescription: z.record(z.string(), z.string()).optional(),
    socialLinks: z.array(socialLinkSchema).optional(),
    defaultTheme: z.enum(['light', 'dark', 'system']),
    defaultCurrency: z.string().min(1, 'Currency is required'),
});

export type StoreSettingsFormData = z.infer<typeof storeSettingsSchema>;
