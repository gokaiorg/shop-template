import { z } from "zod";

const COUNTRY_NAME_TO_ISO2: Record<string, string> = {
  france: "FR",
  thailand: "TH",
  thailande: "TH",
  "united states": "US",
  "united states of america": "US",
  usa: "US",
  "etats unis": "US",
  "etats-unis": "US",
  "united kingdom": "GB",
  "great britain": "GB",
  "royaume uni": "GB",
  "royaume-uni": "GB",
  england: "GB",
  uk: "GB",
  germany: "DE",
  allemagne: "DE",
  deutschland: "DE",
  spain: "ES",
  espagne: "ES",
  espana: "ES",
  italy: "IT",
  italie: "IT",
  italia: "IT",
  belgium: "BE",
  belgique: "BE",
  belgie: "BE",
  switzerland: "CH",
  suisse: "CH",
  schweiz: "CH",
  svizzera: "CH",
  canada: "CA",
  netherlands: "NL",
  "pays bas": "NL",
  "pays-bas": "NL",
  nederland: "NL",
  luxembourg: "LU",
  portugal: "PT",
  australia: "AU",
  australie: "AU",
  japan: "JP",
  japon: "JP",
  singapore: "SG",
  singapour: "SG",
  ireland: "IE",
  irlande: "IE",
  austria: "AT",
  autriche: "AT",
  sweden: "SE",
  suede: "SE",
  norway: "NO",
  norvege: "NO",
  denmark: "DK",
  danemark: "DK",
  finland: "FI",
  finlande: "FI",
  poland: "PL",
  pologne: "PL",
  morocco: "MA",
  maroc: "MA",
  tunisia: "TN",
  tunisie: "TN",
  algeria: "DZ",
  algerie: "DZ",
  "united arab emirates": "AE",
  uae: "AE",
  "emirats arabes unis": "AE",
};

export function normalizeCountryCode(
  input?: string | null,
  fallback = "FR"
): string {
  const cleanedFallback = /^[A-Z]{2}$/i.test(fallback.trim())
    ? fallback.trim().toUpperCase()
    : "FR";
  if (!input || typeof input !== "string") {
    return cleanedFallback;
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return cleanedFallback;
  }
  const upper = trimmed.toUpperCase();
  if (upper === "UK") {
    return "GB";
  }
  if (/^[A-Z]{2}$/.test(upper)) {
    return upper;
  }
  const normalizedKey = trimmed
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return COUNTRY_NAME_TO_ISO2[normalizedKey] || cleanedFallback;
}

export const SupportedLocaleSchema = z.enum(["en", "fr"]);

export const LocalizedAlternatesSchema = z.object({
  locale: z.string().min(2),
  canonicalPath: z.string().url(),
  languages: z
    .record(z.string().min(1), z.string().url())
    .refine((langs) => "x-default" in langs, {
      message: "Alternates languages must include x-default",
    }),
});

export const BreadcrumbItemSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
});

export const BreadcrumbListInputSchema = z.object({
  pageUrl: z.string().url(),
  items: z.array(BreadcrumbItemSchema).min(1),
});

export const FaqItemSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

export const FaqListInputSchema = z.object({
  pageUrl: z.string().url(),
  faqs: z.array(FaqItemSchema).min(1),
});

export const AggregateRatingSeoSchema = z.object({
  ratingValue: z.number().min(1).max(5),
  reviewCount: z.number().int().positive(),
  bestRating: z.number().default(5),
  worstRating: z.number().default(1),
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
  countryCode: z
    .string()
    .default("FR")
    .transform((value) => normalizeCountryCode(value)),
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
  entityType: z.string().min(1).default("Store"),
  name: z.string().min(1),
  legalName: z.string().min(1),
  url: z.string().url(),
  logo: z.string().url(),
  email: z.string().email(),
  telephone: z.string().min(1),
  openingHours: z.string().optional(),
  priceRange: z.string().optional(),
  address: z.object({
    streetAddress: z.string().min(1),
    addressLocality: z.string().min(1),
    postalCode: z.string().min(1),
    addressCountry: z
      .string()
      .min(1)
      .transform((value) => normalizeCountryCode(value)),
  }),
  geo: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  sameAs: z.array(z.string().url()).default([]),
  aggregateRating: AggregateRatingSeoSchema.optional(),
});

export type SupportedLocale = z.infer<typeof SupportedLocaleSchema>;
export type LocalizedAlternates = z.infer<typeof LocalizedAlternatesSchema>;
export type BreadcrumbItemSeo = z.infer<typeof BreadcrumbItemSchema>;
export type FaqItemSeo = z.infer<typeof FaqItemSchema>;
export type AggregateRatingSeo = z.infer<typeof AggregateRatingSeoSchema>;
export type MerchantOfferSeo = z.infer<typeof MerchantOfferSeoSchema>;
export type ProductSeoInput = z.infer<typeof ProductSeoInputSchema>;
export type OrganizationSeoConfig = z.infer<typeof OrganizationSeoConfigSchema>;
