import { z } from "zod";

export const SupportedLocaleSchema = z.enum(["en", "fr"]);

export const LocalizedAlternatesSchema = z.object({
  locale: SupportedLocaleSchema,
  canonicalPath: z.string().min(1),
  languages: z.object({
    en: z.string().min(1),
    fr: z.string().min(1),
    "x-default": z.string().min(1),
  }),
});

export const MerchantOfferSeoSchema = z.object({
  price: z.number().nonnegative(),
  priceCurrency: z.string().min(3).max(3).default("EUR"),
  availability: z.enum(["InStock", "OutOfStock", "PreOrder"]),
  validFrom: z.string().min(1),
  priceValidUntil: z.string().min(1),
  isDigitalOrService: z.boolean().default(false),
  shippingRate: z.number().nonnegative().default(0),
  returnDays: z.number().int().nonnegative().default(14),
});

export const ProductSeoInputSchema = z.object({
  id: z.string().min(1),
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(20),
  url: z.string().url(),
  images: z.array(z.string().url()).min(1),
  brandName: z.string().min(1),
  categoryName: z.string().min(1),
  offer: MerchantOfferSeoSchema,
});

export const OrganizationSeoConfigSchema = z.object({
  name: z.string().min(1),
  legalName: z.string().min(1),
  url: z.string().url(),
  logo: z.string().url(),
  email: z.string().email(),
  telephone: z.string().min(1),
  address: z.object({
    streetAddress: z.string().min(1),
    addressLocality: z.string().min(1),
    postalCode: z.string().min(1),
    addressCountry: z.string().min(2),
  }),
  geo: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  sameAs: z.array(z.string().url()).default([]),
});

export type SupportedLocale = z.infer<typeof SupportedLocaleSchema>;
export type LocalizedAlternates = z.infer<typeof LocalizedAlternatesSchema>;
export type MerchantOfferSeo = z.infer<typeof MerchantOfferSeoSchema>;
export type ProductSeoInput = z.infer<typeof ProductSeoInputSchema>;
export type OrganizationSeoConfig = z.infer<typeof OrganizationSeoConfigSchema>;
