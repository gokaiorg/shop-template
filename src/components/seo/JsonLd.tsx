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
// 2. GLOBAL SCHEMA (WebSite & Organization with Sitelinks Searchbox)
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
    searchActionUrl = "shop",
}: GlobalJsonLdProps) {
    const brandName = name || process.env.NEXT_PUBLIC_BRAND || "Store";
    const rawBaseUrl = url || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const baseUrl = rawBaseUrl.replace(/\/+$/, "");

    const absoluteLogoUrl = logoUrl
        ? logoUrl.startsWith("http")
            ? logoUrl
            : `${baseUrl}${logoUrl.startsWith("/") ? "" : "/"}${logoUrl}`
        : undefined;

    const cleanSearchPath = searchActionUrl.replace(/^\/+/, "");

    const websiteSchema: Record<string, any> = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: brandName,
        url: `${baseUrl}/${lang}`,
        inLanguage: lang,
        ...(description ? { description } : {}),
        potentialAction: {
            "@type": "SearchAction",
            target: {
                "@type": "EntryPoint",
                urlTemplate: `${baseUrl}/${lang}/${cleanSearchPath}?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
        },
    };

    const organizationSchema: Record<string, any> = {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: brandName,
        url: baseUrl,
        ...(absoluteLogoUrl ? { logo: absoluteLogoUrl, image: absoluteLogoUrl } : {}),
        ...(description ? { description } : {}),
        ...(socialLinks && socialLinks.length > 0
            ? { sameAs: socialLinks.filter(Boolean) }
            : {}),
    };

    return <JsonLd data={[websiteSchema, organizationSchema]} />;
}

// =============================================================================
// 3. CATEGORY / COLLECTION SCHEMA (ItemList, Breadcrumbs & Product Snippets)
// =============================================================================

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
}

export function CategoryJsonLd({
    categoryName,
    categoryUrl,
    categoryDescription,
    products = [],
    breadcrumbs = [],
    brandName,
}: CategoryJsonLdProps) {
    const activeBrandName = brandName || process.env.NEXT_PUBLIC_BRAND || "Store";
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

    // 2. CollectionPage Schema with encapsulated ItemList (prevents Carousels validator misinterpretation)
    const itemListElement = products.map((product, index) => {
        const itemSku = product.sku || product.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
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
                ...(product.description ? { description: product.description } : {}),
                ...(product.price !== undefined
                    ? {
                          offers: {
                              "@type": "Offer",
                              price: product.price,
                              priceCurrency: product.priceCurrency || "EUR",
                              availability: "https://schema.org/InStock",
                              url: product.url,
                              itemCondition: "https://schema.org/NewCondition",
                          },
                      }
                    : {}),
            },
        };
    });

    const collectionPageSchema: Record<string, any> = {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
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
    };

    schemas.push(collectionPageSchema);

    return <JsonLd data={schemas} />;
}

// =============================================================================
// 4. PRODUCT SCHEMA (Google Merchant Listings & Snippets Enriched)
// =============================================================================

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
    const rawBaseUrl = productUrl.startsWith("http")
        ? new URL(productUrl).origin
        : (process.env.NEXT_PUBLIC_APP_URL || "https://gokai.org");
    const baseUrl = rawBaseUrl.replace(/\/+$/, "");
    const schemas: Record<string, any>[] = [];

    // Default Shipping Policy for Merchant Listings (Free Standard Shipping)
    const activeShippingRate = shippingDetails?.shippingRate ?? 0;
    const activeShippingCurrency = shippingDetails?.currency || currency;
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

    // Default Return Policy for Merchant Listings (30 days return by mail, free return)
    const rawReturnCountry = returnPolicy?.applicableCountry;
    const returnCountries = Array.isArray(rawReturnCountry)
        ? rawReturnCountry
        : rawReturnCountry
        ? [rawReturnCountry]
        : defaultCountries;

    const returnDays = returnPolicy?.returnDays ?? 30;
    const returnMethod = returnPolicy?.returnMethod || "https://schema.org/ReturnByMail";
    const returnFees = returnPolicy?.returnFees || "https://schema.org/FreeReturn";

    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const priceValidUntil = nextYear.toISOString().split("T")[0];

    const effectiveSku = sku || name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const offerSchema: Record<string, any> = {
        "@type": "Offer",
        price: price ?? 0,
        priceCurrency: currency,
        availability: isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
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
                value: activeShippingRate,
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
            applicableCountry: returnCountries,
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
        sku: effectiveSku,
        mpn: effectiveSku,
        brand: {
            "@type": "Brand",
            name: activeBrandName,
            url: baseUrl,
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

// =============================================================================
// 5. CATALOG SCHEMA (BreadcrumbList & ItemList of Categories/Offerings)
// =============================================================================

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
    const schemas: Record<string, any>[] = [];

    // 1. Breadcrumbs
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

    // 2. CollectionPage with mainEntity ItemList of categories/services
    if (categories.length > 0) {
        schemas.push({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
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

    return <JsonLd data={schemas} />;
}
