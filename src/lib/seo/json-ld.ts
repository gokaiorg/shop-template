import {
  BreadcrumbListInputSchema,
  FaqListInputSchema,
  OrganizationSeoConfig,
  OrganizationSeoConfigSchema,
  ProductSeoInput,
  ProductSeoInputSchema,
} from "@/schemas/seo";
import { getSupportedLocales } from "@/app/i18n-config";

export interface BreadcrumbItemInput {
  name: string;
  url: string;
}

export interface FaqItemInput {
  question: string;
  answer: string;
}

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export function buildOrganizationNode(
  config: OrganizationSeoConfig
): Record<string, unknown> {
  const parsed = OrganizationSeoConfigSchema.parse(config);
  const cleanUrl = stripTrailingSlash(parsed.url);
  const availableLanguages = getSupportedLocales();
  const entityType =
    parsed.entityType === "Organization"
      ? "Organization"
      : ["Organization", parsed.entityType];

  return {
    "@type": entityType,
    "@id": `${cleanUrl}/#organization`,
    name: parsed.name,
    legalName: parsed.legalName,
    url: cleanUrl,
    logo: {
      "@type": "ImageObject",
      "@id": `${cleanUrl}/#logo`,
      url: parsed.logo,
    },
    image: parsed.logo,
    email: parsed.email,
    telephone: parsed.telephone,
    ...(parsed.priceRange ? { priceRange: parsed.priceRange } : {}),
    ...(parsed.openingHours ? { openingHours: parsed.openingHours } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: parsed.address.streetAddress,
      addressLocality: parsed.address.addressLocality,
      postalCode: parsed.address.postalCode,
      addressCountry: parsed.address.addressCountry,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: parsed.geo.latitude,
      longitude: parsed.geo.longitude,
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: parsed.telephone,
      email: parsed.email,
      contactType: "customer service",
      availableLanguage: availableLanguages,
    },
    ...(parsed.sameAs.length > 0 ? { sameAs: parsed.sameAs } : {}),
    ...(parsed.aggregateRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: parsed.aggregateRating.ratingValue.toFixed(1),
            reviewCount: String(parsed.aggregateRating.reviewCount),
            bestRating: String(parsed.aggregateRating.bestRating),
            worstRating: String(parsed.aggregateRating.worstRating),
          },
        }
      : {}),
  };
}

export function buildWebsiteNode(
  baseUrl: string,
  siteName: string,
  locale: string
): Record<string, unknown> {
  const cleanBaseUrl = stripTrailingSlash(baseUrl);

  return {
    "@type": "WebSite",
    "@id": `${cleanBaseUrl}/#website`,
    url: `${cleanBaseUrl}/${locale}`,
    name: siteName,
    inLanguage: locale,
    publisher: {
      "@id": `${cleanBaseUrl}/#organization`,
    },
  };
}

export function buildBreadcrumbNode(
  pageUrl: string,
  items: Array<BreadcrumbItemInput>
): Record<string, unknown> {
  const parsed = BreadcrumbListInputSchema.parse({ pageUrl, items });

  return {
    "@type": "BreadcrumbList",
    "@id": `${parsed.pageUrl}#breadcrumb`,
    itemListElement: parsed.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildProductNode(
  input: ProductSeoInput,
  baseUrl: string
): Record<string, unknown> {
  const parsed = ProductSeoInputSchema.parse(input);
  const cleanBaseUrl = stripTrailingSlash(baseUrl);
  const countryCode = parsed.offer.countryCode.toUpperCase();

  return {
    "@type": "Product",
    "@id": `${parsed.url}#product`,
    name: parsed.name,
    description: parsed.description,
    sku: parsed.sku,
    mpn: parsed.sku,
    image: parsed.images,
    category: parsed.categoryName,
    brand: {
      "@type": "Brand",
      name: parsed.brandName,
    },
    offers: {
      "@type": "Offer",
      "@id": `${parsed.url}#offer`,
      url: parsed.url,
      priceCurrency: parsed.offer.priceCurrency,
      price: parsed.offer.price.toFixed(2),
      availability: `https://schema.org/${parsed.offer.availability}`,
      itemCondition: "https://schema.org/NewCondition",
      validFrom: parsed.offer.validFrom,
      priceValidUntil: parsed.offer.priceValidUntil,
      seller: {
        "@id": `${cleanBaseUrl}/#organization`,
      },
      hasMerchantReturnPolicy: {
        "@type": "MerchantReturnPolicy",
        applicableCountry: countryCode,
        returnPolicyCategory:
          "https://schema.org/MerchantReturnFiniteReturnWindow",
        merchantReturnDays: parsed.offer.returnDays,
        returnMethod: "https://schema.org/ReturnByMail",
        returnFees: "https://schema.org/FreeReturn",
      },
      shippingDetails: {
        "@type": "OfferShippingDetails",
        shippingRate: {
          "@type": "MonetaryAmount",
          value: parsed.offer.shippingRate.toFixed(2),
          currency: parsed.offer.priceCurrency,
        },
        shippingDestination: {
          "@type": "DefinedRegion",
          addressCountry: countryCode,
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
  };
}

export function buildFaqNode(
  pageUrl: string,
  faqs: Array<FaqItemInput>
): Record<string, unknown> {
  const parsed = FaqListInputSchema.parse({ pageUrl, faqs });

  return {
    "@type": "FAQPage",
    "@id": `${parsed.pageUrl}#faq`,
    mainEntity: parsed.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildJsonLdGraph(
  nodes: Array<Record<string, unknown>>
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}

export function serializeJsonLd(
  data: Record<string, unknown> | Array<Record<string, unknown>>
): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
