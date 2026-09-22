import React from "react";

// =============================================================================
// 1. BASE JSON-LD COMPONENT
// =============================================================================

export interface JsonLdProps {
    data: Record<string, any> | Record<string, any>[];
}

/**
 * Universal JSON-LD Script tag renderer for Next.js App Router
 */
export function JsonLd({ data }: JsonLdProps) {
    if (!data || (Array.isArray(data) && data.length === 0)) {
        return null;
    }

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}

// =============================================================================
// 2. GLOBAL SCHEMA (WebSite & Organization)
// =============================================================================

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
    searchActionUrl,
}: GlobalJsonLdProps) {
    const brandName = name || process.env.NEXT_PUBLIC_BRAND || "Store";
    const rawBaseUrl = url || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const baseUrl = rawBaseUrl.replace(/\/+$/, "");

    const absoluteLogoUrl = logoUrl
        ? logoUrl.startsWith("http")
            ? logoUrl
            : `${baseUrl}${logoUrl.startsWith("/") ? "" : "/"}${logoUrl}`
        : undefined;

    const websiteSchema: Record<string, any> = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: brandName,
        url: `${baseUrl}/${lang}`,
        inLanguage: lang,
        ...(description ? { description } : {}),
        ...(searchActionUrl
            ? {
                  potentialAction: {
                      "@type": "SearchAction",
                      target: `${baseUrl}/${lang}/${searchActionUrl}?q={search_term_string}`,
                      "query-input": "required name=search_term_string",
                  },
              }
            : {}),
    };

    const organizationSchema: Record<string, any> = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: brandName,
        url: baseUrl,
        ...(absoluteLogoUrl ? { logo: absoluteLogoUrl } : {}),
        ...(socialLinks && socialLinks.length > 0
            ? { sameAs: socialLinks.filter(Boolean) }
            : {}),
    };

    return <JsonLd data={[websiteSchema, organizationSchema]} />;
}

// =============================================================================
// 3. CATEGORY / COLLECTION SCHEMA (ItemList & CollectionPage)
// =============================================================================

export interface ItemListProduct {
    name: string;
    url: string;
    image?: string;
    description?: string;
    price?: number;
    priceCurrency?: string;
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
}

export function CategoryJsonLd({
    categoryName,
    categoryUrl,
    categoryDescription,
    products = [],
    breadcrumbs = [],
}: CategoryJsonLdProps) {
    const schemas: Record<string, any>[] = [];

    // 1. Breadcrumbs Schema
    if (breadcrumbs.length > 0) {
        schemas.push({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: breadcrumbs.map((b, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: b.name,
                item: b.url,
            })),
        });
    }

    // 2. CollectionPage & ItemList Schema
    const itemListElement = products.map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: product.name,
        url: product.url,
        ...(product.image ? { image: product.image } : {}),
        ...(product.description ? { description: product.description } : {}),
    }));

    const collectionPageSchema: Record<string, any> = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: categoryName,
        url: categoryUrl,
        ...(categoryDescription ? { description: categoryDescription } : {}),
        mainEntity: {
            "@type": "ItemList",
            name: categoryName,
            numberOfItems: products.length,
            itemListElement,
        },
    };

    schemas.push(collectionPageSchema);

    return <JsonLd data={schemas} />;
}

// =============================================================================
// 4. PRODUCT SCHEMA (Google Merchant Listings Enriched)
// =============================================================================

export interface ProductShippingDetailsProps {
    shippingRate?: number;
    currency?: string;
    addressCountry?: string;
    handlingTimeMin?: number;
    handlingTimeMax?: number;
    transitTimeMin?: number;
    transitTimeMax?: number;
}

export interface ProductReturnPolicyProps {
    applicableCountry?: string;
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
    const schemas: Record<string, any>[] = [];

    // Default Shipping Policy for Merchant Listings (Free Standard Shipping)
    const activeShippingRate = shippingDetails?.shippingRate ?? 0;
    const activeShippingCurrency = shippingDetails?.currency || currency;
    const activeShippingCountry = shippingDetails?.addressCountry || "FR";
    const handlingMin = shippingDetails?.handlingTimeMin ?? 0;
    const handlingMax = shippingDetails?.handlingTimeMax ?? 1;
    const transitMin = shippingDetails?.transitTimeMin ?? 1;
    const transitMax = shippingDetails?.transitTimeMax ?? 3;

    // Default Return Policy for Merchant Listings (30 days return by mail, free return)
    const returnCountry = returnPolicy?.applicableCountry || "FR";
    const returnDays = returnPolicy?.returnDays ?? 30;
    const returnMethod = returnPolicy?.returnMethod || "https://schema.org/ReturnByMail";
    const returnFees = returnPolicy?.returnFees || "https://schema.org/FreeReturn";

    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const priceValidUntil = nextYear.toISOString().split("T")[0];

    const offerSchema: Record<string, any> = {
        "@type": "Offer",
        price: price ?? 0,
        priceCurrency: currency,
        availability: isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        url: productUrl,
        itemCondition: "https://schema.org/NewCondition",
        priceValidUntil,
        shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingRate: {
                "@type": "MonetaryAmount",
                value: activeShippingRate,
                currency: activeShippingCurrency,
            },
            shippingDestination: {
                "@type": "DefinedRegion",
                addressCountry: activeShippingCountry,
            },
            deliveryTime: {
                "@type": "ShippingDeliveryTime",
                handlingTime: {
                    "@type": "QuantitativeValue",
                    minValue: handlingMin,
                    maxValue: handlingMax,
                    unitCode: "d",
                },
                transitTime: {
                    "@type": "QuantitativeValue",
                    minValue: transitMin,
                    maxValue: transitMax,
                    unitCode: "d",
                },
            },
        },
        hasMerchantReturnPolicy: {
            "@type": "MerchantReturnPolicy",
            applicableCountry: returnCountry,
            returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
            merchantReturnDays: returnDays,
            returnMethod,
            returnFees,
        },
    };

    const productSchema: Record<string, any> = {
        "@context": "https://schema.org",
        "@type": "Product",
        name,
        ...(description ? { description } : {}),
        ...(images.length > 0 ? { image: images } : {}),
        ...(sku ? { sku } : {}),
        brand: {
            "@type": "Brand",
            name: activeBrandName,
        },
        ...(!hidePrice ? { offers: offerSchema } : {}),
    };

    schemas.push(productSchema);

    // Breadcrumbs
    if (breadcrumbs.length > 0) {
        schemas.push({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: breadcrumbs.map((b, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: b.name,
                item: b.url,
            })),
        });
    }

    return <JsonLd data={schemas} />;
}
