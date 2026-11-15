import type { Metadata } from "next";
import { brandConfig } from "@/config/brand.config";
import {
  LocalizedAlternatesSchema,
  OrganizationSeoConfig,
  OrganizationSeoConfigSchema,
  SupportedLocale,
  SupportedLocaleSchema,
} from "@/schemas/seo";
import type { StoreSettings } from "@/types/database";

export interface ConstructLocalizedMetadataInput {
  locale: SupportedLocale | string;
  title: string;
  description: string;
  siteName?: string;
  baseUrl?: string;
  canonicalPath: string;
  languages?: {
    en: string;
    fr: string;
    "x-default"?: string;
  };
  imageUrl?: string;
  type?: "website" | "article";
  absoluteTitle?: boolean;
  noIndex?: boolean;
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export function resolveSiteBaseUrl(customBaseUrl?: string): string {
  const candidate =
    customBaseUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    brandConfig.identity.url ||
    "https://gokai.org";
  return stripTrailingSlash(candidate);
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
  const parsedLocaleResult = SupportedLocaleSchema.safeParse(input.locale);
  const activeLocale: SupportedLocale = parsedLocaleResult.success
    ? parsedLocaleResult.data
    : "en";

  const baseUrl = resolveSiteBaseUrl(input.baseUrl);
  const activeSiteName =
    input.siteName || brandConfig.identity.name || "Shop Template";

  const canonicalUrl = toAbsoluteUrl(baseUrl, input.canonicalPath);

  const defaultEnPath = input.canonicalPath.replace(/^\/(en|fr)(?=\/|$)/, "/en");
  const defaultFrPath = input.canonicalPath.replace(/^\/(en|fr)(?=\/|$)/, "/fr");

  const enUrl = toAbsoluteUrl(
    baseUrl,
    input.languages?.en || defaultEnPath || "/en"
  );
  const frUrl = toAbsoluteUrl(
    baseUrl,
    input.languages?.fr || defaultFrPath || "/fr"
  );
  const xDefaultUrl = toAbsoluteUrl(
    baseUrl,
    input.languages?.["x-default"] || input.languages?.en || enUrl
  );

  const validatedAlternates = LocalizedAlternatesSchema.parse({
    locale: activeLocale,
    canonicalPath: canonicalUrl,
    languages: {
      en: enUrl,
      fr: frUrl,
      "x-default": xDefaultUrl,
    },
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
  customBaseUrl?: string
): OrganizationSeoConfig {
  const baseUrl = resolveSiteBaseUrl(customBaseUrl);
  const name =
    storeSettings?.brandName?.trim() ||
    brandConfig.identity.name ||
    "Shop Template";
  const legalName =
    brandConfig.identity.companyName?.trim() || name;

  const rawLogo =
    storeSettings?.logoUrl?.trim() ||
    brandConfig.assets.logo.src ||
    "/brand/default/logo.webp";
  const logo = toAbsoluteUrl(baseUrl, rawLogo);

  const rawEmail =
    storeSettings?.contactEmail?.trim() ||
    brandConfig.contact?.email?.trim() ||
    "contact@gokai.org";
  const email = rawEmail.includes("@") ? rawEmail : "contact@gokai.org";

  const telephone =
    storeSettings?.contactPhone?.trim() ||
    brandConfig.contact?.phone?.trim() ||
    "+33100000000";

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
  const addressCountry =
    storeSettings?.seoCountry?.trim() ||
    brandConfig.contact?.address?.country?.trim() ||
    "FR";

  const rawSocialUrls = [
    ...(storeSettings?.socialLinks?.map((s) => s.url) || []),
    ...(brandConfig.navigation?.socials?.map((s) => s.url) || []),
  ].filter((url): url is string => Boolean(url && (url.startsWith("http://") || url.startsWith("https://"))));

  const uniqueSameAs = Array.from(new Set(rawSocialUrls));

  return OrganizationSeoConfigSchema.parse({
    name,
    legalName,
    url: baseUrl,
    logo,
    email,
    telephone,
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
  });
}
