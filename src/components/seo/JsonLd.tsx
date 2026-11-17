import React from "react";
import { buildJsonLdGraph, serializeJsonLd } from "@/lib/seo/json-ld";
import { resolveSiteBaseUrl, toAbsoluteUrl } from "@/lib/seo/metadata";
import { normalizeCountryCode } from "@/schemas/seo";

export interface JsonLdProps {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}

export function JsonLd({ data }: JsonLdProps) {
  if (!data || (Array.isArray(data) && data.length === 0)) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
      suppressHydrationWarning
    />
  );
}

export interface GlobalJsonLdProps {
  name?: string;
  url?: string;
  description?: string;
  logoUrl?: string;
  lang?: string;
  socialLinks?: string[];
  searchActionUrl?: string;
}

export function GlobalJsonLd({
  name,
  url,
  description,
  logoUrl,
  lang = "en",
  socialLinks = [],
}: GlobalJsonLdProps) {
  const brandName = name || process.env.NEXT_PUBLIC_BRAND || "Store";
  const baseUrl = resolveSiteBaseUrl(url);
  const absoluteLogoUrl = logoUrl
    ? toAbsoluteUrl(baseUrl, logoUrl)
    : undefined;

  const websiteSchema: Record<string, unknown> = {
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    name: brandName,
    url: `${baseUrl}/${lang}`,
    inLanguage: lang,
    ...(description ? { description } : {}),
    publisher: {
      "@id": `${baseUrl}/#organization`,
    },
  };

  const organizationSchema: Record<string, unknown> = {
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: brandName,
    url: baseUrl,
    ...(absoluteLogoUrl
      ? {
          logo: {
            "@type": "ImageObject",
            url: absoluteLogoUrl,
          },
          image: absoluteLogoUrl,
        }
      : {}),
    ...(description ? { description } : {}),
    ...(socialLinks.length > 0 ? { sameAs: socialLinks.filter(Boolean) } : {}),
  };

  return <JsonLd data={buildJsonLdGraph([organizationSchema, websiteSchema])} />;
}

export interface ItemListProduct {
  name: string;
  url: string;
  image?: string;
  description?: string;
  price?: number;
  priceCurrency?: string;
  sku?: string;
  brandName?: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface CategoryJsonLdProps {
  categoryName: string;
  categoryUrl: string;
  categoryDescription?: string;
  products?: ItemListProduct[];
  breadcrumbs?: BreadcrumbItem[];
  brandName?: string;
  countryCode?: string;
}

function getNextYearIsoDate(): string {
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  return nextYear.toISOString().split("T")[0];
}

export function CategoryJsonLd({
  categoryName,
  categoryUrl,
  categoryDescription,
  products = [],
  breadcrumbs = [],
  brandName,
  countryCode = "FR",
}: CategoryJsonLdProps) {
  const activeBrandName = brandName || process.env.NEXT_PUBLIC_BRAND || "Store";
  const priceValidUntil = getNextYearIsoDate();
  const normalizedCountry = normalizeCountryCode(countryCode);
  const nodes: Array<Record<string, unknown>> = [];

  if (breadcrumbs.length > 0) {
    nodes.push({
      "@type": "BreadcrumbList",
      "@id": `${categoryUrl}#breadcrumb`,
      itemListElement: breadcrumbs.map((b, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: b.name,
        item: b.url,
      })),
    });
  }

  const itemListElement = products.map((product, index) => {
    const itemSku =
      product.sku || product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const currency = (product.priceCurrency || "EUR").toUpperCase();
    return {
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product.name,
        url: product.url,
        sku: itemSku,
        mpn: itemSku,
        brand: {
          "@type": "Brand",
          name: product.brandName || activeBrandName,
        },
        ...(product.image ? { image: [product.image] } : {}),
        description: product.description || `${product.name} - ${categoryName}`,
        ...(product.price !== undefined
          ? {
              offers: {
                "@type": "Offer",
                price: product.price.toFixed(2),
                priceCurrency: currency,
                availability: "https://schema.org/InStock",
                url: product.url,
                itemCondition: "https://schema.org/NewCondition",
                priceValidUntil,
                hasMerchantReturnPolicy: {
                  "@type": "MerchantReturnPolicy",
                  applicableCountry: normalizedCountry,
                  returnPolicyCategory:
                    "https://schema.org/MerchantReturnFiniteReturnWindow",
                  merchantReturnDays: 14,
                  returnMethod: "https://schema.org/ReturnByMail",
                  returnFees: "https://schema.org/FreeReturn",
                },
                shippingDetails: {
                  "@type": "OfferShippingDetails",
                  shippingRate: {
                    "@type": "MonetaryAmount",
                    value: "0.00",
                    currency,
                  },
                  shippingDestination: {
                    "@type": "DefinedRegion",
                    addressCountry: normalizedCountry,
                  },
                  deliveryTime: {
                    "@type": "ShippingDeliveryTime",
                    handlingTime: {
                      "@type": "QuantitativeValue",
                      minValue: 0,
                      maxValue: 1,
                      unitCode: "DAY",
                    },
                    transitTime: {
                      "@type": "QuantitativeValue",
                      minValue: 0,
                      maxValue: 2,
                      unitCode: "DAY",
                    },
                  },
                },
              },
            }
          : {}),
      },
    };
  });

  nodes.push({
    "@type": "CollectionPage",
    "@id": `${categoryUrl}#collection`,
    name: categoryName,
    url: categoryUrl,
    ...(categoryDescription ? { description: categoryDescription } : {}),
    mainEntity: {
      "@type": "ItemList",
      name: categoryName,
      ...(categoryDescription ? { description: categoryDescription } : {}),
      numberOfItems: products.length,
      itemListElement,
    },
  });

  return <JsonLd data={buildJsonLdGraph(nodes)} />;
}

export interface ProductShippingDetailsProps {
  shippingRate?: number;
  currency?: string;
  addressCountry?: string | string[];
  handlingTimeMin?: number;
  handlingTimeMax?: number;
  transitTimeMin?: number;
  transitTimeMax?: number;
}

export interface ProductReturnPolicyProps {
  applicableCountry?: string | string[];
  returnDays?: number;
  returnMethod?: string;
  returnFees?: string;
}

export interface ProductJsonLdProps {
  name: string;
  description?: string;
  images?: string[];
  sku?: string;
  brandName?: string;
  price?: number;
  currency?: string;
  isOutOfStock?: boolean;
  productUrl: string;
  hidePrice?: boolean;
  shippingDetails?: ProductShippingDetailsProps;
  returnPolicy?: ProductReturnPolicyProps;
  breadcrumbs?: BreadcrumbItem[];
}

export function ProductJsonLd({
  name,
  description,
  images = [],
  sku,
  brandName,
  price,
  currency = "EUR",
  isOutOfStock = false,
  productUrl,
  hidePrice = false,
  shippingDetails,
  returnPolicy,
  breadcrumbs = [],
}: ProductJsonLdProps) {
  const activeBrandName = brandName || process.env.NEXT_PUBLIC_BRAND || "Store";
  const baseUrl = productUrl.startsWith("http")
    ? new URL(productUrl).origin
    : resolveSiteBaseUrl();
  const nodes: Array<Record<string, unknown>> = [];

  const activeShippingRate = shippingDetails?.shippingRate ?? 0;
  const activeShippingCurrency = (
    shippingDetails?.currency || currency
  ).toUpperCase();
  const defaultCountries = ["FR", "US", "GB", "DE", "BE", "CH", "CA", "ES", "IT"];

  const rawShippingCountry = shippingDetails?.addressCountry;
  const shippingCountries = Array.isArray(rawShippingCountry)
    ? rawShippingCountry
    : rawShippingCountry
      ? [rawShippingCountry]
      : defaultCountries;

  const handlingMin = shippingDetails?.handlingTimeMin ?? 0;
  const handlingMax = shippingDetails?.handlingTimeMax ?? 1;
  const transitMin = shippingDetails?.transitTimeMin ?? 1;
  const transitMax = shippingDetails?.transitTimeMax ?? 3;

  const rawReturnCountry = returnPolicy?.applicableCountry;
  const returnCountries = Array.isArray(rawReturnCountry)
    ? rawReturnCountry
    : rawReturnCountry
      ? [rawReturnCountry]
      : defaultCountries;

  const returnDays = returnPolicy?.returnDays ?? 30;
  const returnMethod =
    returnPolicy?.returnMethod || "https://schema.org/ReturnByMail";
  const returnFees = returnPolicy?.returnFees || "https://schema.org/FreeReturn";
  const priceValidUntil = getNextYearIsoDate();
  const effectiveSku = sku || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  const offerSchema: Record<string, unknown> = {
    "@type": "Offer",
    "@id": `${productUrl}#offer`,
    price: (price ?? 0).toFixed(2),
    priceCurrency: currency.toUpperCase(),
    availability: isOutOfStock
      ? "https://schema.org/OutOfStock"
      : "https://schema.org/InStock",
    url: productUrl,
    itemCondition: "https://schema.org/NewCondition",
    priceValidUntil,
    seller: {
      "@type": "Organization",
      name: activeBrandName,
      url: baseUrl,
    },
    shippingDetails: {
      "@type": "OfferShippingDetails",
      shippingRate: {
        "@type": "MonetaryAmount",
        value: activeShippingRate.toFixed(2),
        currency: activeShippingCurrency,
      },
      shippingDestination: shippingCountries.map((countryCode) => ({
        "@type": "DefinedRegion",
        addressCountry: countryCode,
      })),
      deliveryTime: {
        "@type": "ShippingDeliveryTime",
        handlingTime: {
          "@type": "QuantitativeValue",
          minValue: handlingMin,
          maxValue: handlingMax,
          unitCode: "DAY",
        },
        transitTime: {
          "@type": "QuantitativeValue",
          minValue: transitMin,
          maxValue: transitMax,
          unitCode: "DAY",
        },
      },
    },
    hasMerchantReturnPolicy: {
      "@type": "MerchantReturnPolicy",
      applicableCountry: returnCountries,
      returnPolicyCategory:
        "https://schema.org/MerchantReturnFiniteReturnWindow",
      merchantReturnDays: returnDays,
      returnMethod,
      returnFees,
    },
  };

  nodes.push({
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name,
    description: description || `${name} - ${activeBrandName}`,
    ...(images.length > 0 ? { image: images } : {}),
    sku: effectiveSku,
    mpn: effectiveSku,
    brand: {
      "@type": "Brand",
      name: activeBrandName,
      url: baseUrl,
    },
    ...(!hidePrice ? { offers: offerSchema } : {}),
  });

  if (breadcrumbs.length > 0) {
    nodes.push({
      "@type": "BreadcrumbList",
      "@id": `${productUrl}#breadcrumb`,
      itemListElement: breadcrumbs.map((b, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: b.name,
        item: b.url,
      })),
    });
  }

  return <JsonLd data={buildJsonLdGraph(nodes)} />;
}

export interface CatalogCategoryItem {
  name: string;
  url: string;
  image?: string;
  description?: string;
}

export interface CatalogJsonLdProps {
  catalogTitle: string;
  catalogUrl: string;
  catalogDescription?: string;
  categories?: CatalogCategoryItem[];
  breadcrumbs?: BreadcrumbItem[];
}

export function CatalogJsonLd({
  catalogTitle,
  catalogUrl,
  catalogDescription,
  categories = [],
  breadcrumbs = [],
}: CatalogJsonLdProps) {
  const nodes: Array<Record<string, unknown>> = [];

  if (breadcrumbs.length > 0) {
    nodes.push({
      "@type": "BreadcrumbList",
      "@id": `${catalogUrl}#breadcrumb`,
      itemListElement: breadcrumbs.map((b, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: b.name,
        item: b.url,
      })),
    });
  }

  if (categories.length > 0) {
    nodes.push({
      "@type": "CollectionPage",
      "@id": `${catalogUrl}#collection`,
      name: catalogTitle,
      url: catalogUrl,
      ...(catalogDescription ? { description: catalogDescription } : {}),
      mainEntity: {
        "@type": "ItemList",
        name: catalogTitle,
        ...(catalogDescription ? { description: catalogDescription } : {}),
        numberOfItems: categories.length,
        itemListElement: categories.map((cat, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "Thing",
            name: cat.name,
            url: cat.url,
            ...(cat.image ? { image: cat.image } : {}),
            ...(cat.description ? { description: cat.description } : {}),
          },
        })),
      },
    });
  }

  return <JsonLd data={buildJsonLdGraph(nodes)} />;
}

export interface PageJsonLdProps {
  title: string;
  description?: string;
  url: string;
  lang?: string;
  type?: "AboutPage" | "ContactPage" | "FAQPage" | "WebPage";
  imageUrl?: string;
  datePublished?: string;
  dateModified?: string;
  brandName?: string;
  breadcrumbs?: BreadcrumbItem[];
  organization?: {
    name: string;
    url: string;
    logo?: string;
    description?: string;
    sameAs?: string[];
  };
}

export function PageJsonLd({
  title,
  description,
  url,
  lang = "en",
  type = "WebPage",
  imageUrl,
  datePublished,
  dateModified,
  brandName,
  breadcrumbs = [],
  organization,
}: PageJsonLdProps) {
  const activeBrandName = brandName || process.env.NEXT_PUBLIC_BRAND || "Store";
  const baseUrl = url.startsWith("http")
    ? new URL(url).origin
    : resolveSiteBaseUrl();
  const nodes: Array<Record<string, unknown>> = [];

  if (breadcrumbs.length > 0) {
    nodes.push({
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: breadcrumbs.map((b, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: b.name,
        item: b.url,
      })),
    });
  }

  const orgNode: Record<string, unknown> = organization
    ? {
        "@type": "Organization",
        "@id": `${organization.url || baseUrl}/#organization`,
        name: organization.name || activeBrandName,
        url: organization.url || baseUrl,
        ...(organization.logo ? { logo: organization.logo } : {}),
        ...(organization.description
          ? { description: organization.description }
          : {}),
        ...(organization.sameAs && organization.sameAs.length > 0
          ? { sameAs: organization.sameAs }
          : {}),
      }
    : {
        "@type": "Organization",
        "@id": `${baseUrl}/#organization`,
        name: activeBrandName,
        url: baseUrl,
      };

  nodes.push(orgNode);

  nodes.push({
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    name: activeBrandName,
    url: `${baseUrl}/${lang}`,
    inLanguage: lang,
    publisher: {
      "@id": `${organization?.url || baseUrl}/#organization`,
    },
  });

  nodes.push({
    "@type": type,
    "@id": `${url}#webpage`,
    name: title,
    url,
    inLanguage: lang,
    ...(description ? { description } : {}),
    ...(imageUrl
      ? {
          image: imageUrl,
          primaryImageOfPage: {
            "@type": "ImageObject",
            url: imageUrl,
          },
        }
      : {}),
    ...(datePublished ? { datePublished } : {}),
    ...(dateModified ? { dateModified } : {}),
    isPartOf: {
      "@id": `${baseUrl}/#website`,
    },
    about: {
      "@id": `${organization?.url || baseUrl}/#organization`,
    },
    publisher: {
      "@id": `${organization?.url || baseUrl}/#organization`,
    },
  });

  return <JsonLd data={buildJsonLdGraph(nodes)} />;
}

export { JsonLdLocalBusiness } from "./JsonLdLocalBusiness";
export type {
  JsonLdLocalBusinessProps,
  LocalBusinessAddress,
  LocalBusinessGeo,
} from "./JsonLdLocalBusiness";
