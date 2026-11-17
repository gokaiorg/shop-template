import type { Metadata } from "next";
import { z } from "zod";
import { brandConfig } from "@/config/brand.config";
import { getDefaultLocale, getSupportedLocales } from "@/app/i18n-config";
import { getLocalizedField } from "@/lib/i18n";
import {
  LocalizedAlternatesSchema,
  normalizeCountryCode,
  OrganizationSeoConfig,
  OrganizationSeoConfigSchema,
  SupportedLocale,
} from "@/schemas/seo";
import type { StoreSettings } from "@/types/database";

export interface ConstructLocalizedMetadataInput {
  locale: SupportedLocale | string;
  title: string;
  description: string;
  siteName?: string;
  baseUrl?: string;
  canonicalPath: string;
  languages?: Record<string, string>;
  imageUrl?: string;
  type?: "website" | "article";
  absoluteTitle?: boolean;
  noIndex?: boolean;
}

const UrlSchema = z.string().url();
const EmailSchema = z.string().email();

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function isLocalUrl(url: string): boolean {
  return (
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes("0.0.0.0")
  );
}

export function resolveSiteBaseUrl(customBaseUrl?: string): string {
  const rawCandidate = (
    customBaseUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    brandConfig.identity.url ||
    (process.env.NODE_ENV === "production"
      ? "https://gokai.org"
      : "http://localhost:3000")
  ).trim();
  const normalized = stripTrailingSlash(rawCandidate);
  const upgraded =
    process.env.NODE_ENV === "production" &&
    normalized.startsWith("http://") &&
    !isLocalUrl(normalized)
      ? normalized.replace(/^http:\/\//i, "https://")
      : normalized;
  return UrlSchema.safeParse(upgraded).success ? upgraded : "https://gokai.org";
}

export function toAbsoluteUrl(baseUrl: string, pathOrUrl: string): string {
  const cleanBase = stripTrailingSlash(baseUrl);
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const normalizedPath = pathOrUrl.startsWith("/")
    ? pathOrUrl
    : `/${pathOrUrl}`;
  return `${cleanBase}${normalizedPath}`;
}

export function constructLocalizedMetadata(
  input: ConstructLocalizedMetadataInput
): Metadata {
  const supportedLocales = getSupportedLocales();
  const defaultLocale = getDefaultLocale();
  const normalizedLocale = input.locale.toLowerCase();
  const activeLocale = supportedLocales.includes(normalizedLocale)
    ? normalizedLocale
    : defaultLocale;

  const baseUrl = resolveSiteBaseUrl(input.baseUrl);
  const activeSiteName =
    input.siteName || brandConfig.identity.name || "Shop Template";

  const canonicalUrl = toAbsoluteUrl(baseUrl, input.canonicalPath);

  const localePattern = new RegExp(`^\\/(${supportedLocales.join("|")})(?=\\/|$)`);
  const languageMap: Record<string, string> = {};

  for (const loc of supportedLocales) {
    const provided = input.languages?.[loc];
    const fallbackPath = localePattern.test(input.canonicalPath)
      ? input.canonicalPath.replace(localePattern, `/${loc}`)
      : `/${loc}`;
    languageMap[loc] = toAbsoluteUrl(baseUrl, provided || fallbackPath);
  }

  const defaultTarget =
    input.languages?.["x-default"] ||
    languageMap[defaultLocale] ||
    languageMap[supportedLocales[0]] ||
    canonicalUrl;
  languageMap["x-default"] = toAbsoluteUrl(baseUrl, defaultTarget);

  const validatedAlternates = LocalizedAlternatesSchema.parse({
    locale: activeLocale,
    canonicalPath: canonicalUrl,
    languages: languageMap,
  });

  const rawImage =
    input.imageUrl ||
    brandConfig.assets.ogImage ||
    brandConfig.assets.heroBanner ||
    brandConfig.assets.logo.src ||
    "/brand/default/hero-banner.webp";
  const resolvedImageUrl = toAbsoluteUrl(baseUrl, rawImage);

  return {
    metadataBase: new URL(baseUrl),
    title: input.absoluteTitle ? { absolute: input.title } : input.title,
    description: input.description,
    alternates: {
      canonical: validatedAlternates.canonicalPath,
      languages: validatedAlternates.languages,
    },
    openGraph: {
      title: input.title,
      description: input.description,
      url: validatedAlternates.canonicalPath,
      siteName: activeSiteName,
      locale: activeLocale === "fr" ? "fr_FR" : "en_US",
      type: input.type ?? "website",
      images: [
        {
          url: resolvedImageUrl,
          width: 1200,
          height: 630,
          alt: input.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [resolvedImageUrl],
    },
    robots: input.noIndex
      ? {
          index: false,
          follow: false,
          googleBot: {
            index: false,
            follow: false,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-video-preview": -1,
            "max-image-preview": "large",
            "max-snippet": -1,
          },
        },
  };
}

export function resolveOrganizationSeoConfig(
  storeSettings?: Partial<StoreSettings> | null,
  customBaseUrl?: string,
  options?: {
    locale?: string;
    ratingValue?: number | null;
    reviewCount?: number | null;
  }
): OrganizationSeoConfig {
  const baseUrl = resolveSiteBaseUrl(customBaseUrl);
  const name =
    storeSettings?.brandName?.trim() ||
    brandConfig.identity.name ||
    "Shop Template";
  const legalName = brandConfig.identity.companyName?.trim() || name;

  const defaultEntityType =
    brandConfig.identity.id === "green-ghost"
      ? "Dispensary"
      : brandConfig.identity.id === "art-fate"
        ? "ArtGallery"
        : "Store";
  const entityType = storeSettings?.seoEntityType?.trim() || defaultEntityType;

  const rawLogo =
    storeSettings?.logoUrl?.trim() ||
    brandConfig.assets.logo.src ||
    "/brand/default/logo.webp";
  const candidateLogo = toAbsoluteUrl(baseUrl, rawLogo);
  const logo = UrlSchema.safeParse(candidateLogo).success
    ? candidateLogo
    : toAbsoluteUrl(baseUrl, "/brand/default/logo.webp");

  const rawEmail =
    storeSettings?.contactEmail?.trim() ||
    brandConfig.contact?.email?.trim() ||
    "contact@gokai.org";
  const email = EmailSchema.safeParse(rawEmail).success
    ? rawEmail
    : "contact@gokai.org";

  const telephone =
    storeSettings?.contactPhone?.trim() ||
    brandConfig.contact?.phone?.trim() ||
    "+33100000000";

  const locale = options?.locale || getDefaultLocale();
  const isFr = locale.startsWith("fr");
  const openingHours =
    (isFr ? storeSettings?.supportHoursFr : storeSettings?.supportHoursEn) ||
    (storeSettings?.supportHoursEn || storeSettings?.supportHoursFr) ||
    (brandConfig.contact?.supportHours
      ? getLocalizedField(
          brandConfig.contact.supportHours as Record<string, string>,
          locale
        )
      : "") ||
    undefined;

  const streetAddress =
    storeSettings?.seoAddressStreet?.trim() ||
    brandConfig.contact?.address?.street?.trim() ||
    "10 Rue de la Paix";
  const addressLocality =
    storeSettings?.seoAddressLocality?.trim() ||
    brandConfig.contact?.address?.city?.trim() ||
    "Paris";
  const postalCode =
    storeSettings?.seoPostalCode?.trim() ||
    brandConfig.contact?.address?.postalCode?.trim() ||
    "75002";
  const addressCountry = normalizeCountryCode(
    storeSettings?.seoCountry || brandConfig.contact?.address?.country
  );

  const rawSocialUrls = [
    ...(storeSettings?.socialLinks?.map((s) => s.url?.trim()) || []),
    ...(brandConfig.navigation?.socials?.map((s) => s.url?.trim()) || []),
  ].filter(
    (url): url is string =>
      Boolean(url) && UrlSchema.safeParse(url).success
  );

  const uniqueSameAs = Array.from(new Set(rawSocialUrls));

  const validRating =
    typeof options?.ratingValue === "number" &&
    !isNaN(options.ratingValue) &&
    options.ratingValue >= 1 &&
    options.ratingValue <= 5 &&
    typeof options?.reviewCount === "number" &&
    !isNaN(options.reviewCount) &&
    options.reviewCount > 0
      ? {
          ratingValue: Number(options.ratingValue.toFixed(1)),
          reviewCount: Math.round(options.reviewCount),
          bestRating: 5,
          worstRating: 1,
        }
      : undefined;

  return OrganizationSeoConfigSchema.parse({
    entityType,
    name,
    legalName,
    url: baseUrl,
    logo,
    email,
    telephone,
    openingHours: openingHours?.trim() || undefined,
    priceRange: "$$",
    address: {
      streetAddress,
      addressLocality,
      postalCode,
      addressCountry,
    },
    geo: {
      latitude: 48.8686,
      longitude: 2.3314,
    },
    sameAs: uniqueSameAs,
    aggregateRating: validRating,
  });
}
