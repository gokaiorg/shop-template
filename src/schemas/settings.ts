import { z } from 'zod';

export const storeSettingsSchema = z.object({
    brandName: z.string().min(1, 'Brand name is required'),
    logoUrl: z.string().min(1, 'Logo URL is required'),
    faviconUrl: z.string(),
    heroTitle: z.record(z.string(), z.string()).refine((val) => Object.values(val).some(v => v && v.trim().length > 0), {
        message: 'Hero title is required in at least one language',
    }),
    heroDescription: z.record(z.string(), z.string()),
    defaultTheme: z.enum(['light', 'dark', 'system']),
    defaultCurrency: z.string().min(1, 'Currency is required'),
});

export type StoreSettingsFormData = z.infer<typeof storeSettingsSchema>;
