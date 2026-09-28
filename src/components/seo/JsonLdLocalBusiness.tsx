import React from "react";
import { getActiveBrand } from "@/config/brand.config";
import { getStoreSettings } from "@/lib/services/settings";
import { getGooglePlaceReviews } from "@/lib/services/google-places";

export interface LocalBusinessAddress {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
    // Fallback aliases for convenience
    street?: string;
    city?: string;
    country?: string;
}

export interface LocalBusinessGeo {
    latitude?: number | string;
    longitude?: number | string;
}

export interface JsonLdLocalBusinessProps {
    /**
     * Dynamic Schema.org entity type (e.g. "Store", "Dispensary", "LocalBusiness", "Organization").
     * Defaults to the brand-appropriate type (e.g. "Dispensary" for cannabis brands, "Store" for shops).
     */
    type?: string;

    /**
     * Exact business name.
     * Defaults to storeSettings.brandName or brandConfig.identity.name.
     */
    name?: string;

    /**
     * Canonical website URL.
     */
    url?: string;

    /**
     * Short business description.
     */
    description?: string;

    /**
     * Business logo or storefront image URL.
     */
    image?: string;
    logo?: string;

    /**
     * Direct telephone number (international format e.g. +33... or +66...).
     */
    telephone?: string;

    /**
     * Contact email address.
     */
    email?: string;

    /**
     * Physical postal address.
     */
    address?: LocalBusinessAddress;

    /**
     * Geographic coordinates (latitude & longitude).
     */
    geo?: LocalBusinessGeo;

    /**
     * Relative price level (e.g. "$", "$$", "€€").
     */
    priceRange?: string;

    /**
     * Currencies accepted by the store (e.g. "EUR", "THB", "USD").
     */
    currenciesAccepted?: string;

    /**
     * Accepted payment options (e.g. "Cash, Credit Card, PromptPay").
     */
    paymentAccepted?: string;

    /**
     * Human-readable or ISO opening hours specifications.
     */
    openingHours?: string | string[];

    /**
     * Average rating value (e.g. 5.0 or "5.0").
     * If provided or resolved from reviews module, injects aggregateRating rich snippet.
     */
    ratingValue?: number | string;

    /**
     * Total number of reviews (e.g. 133 or "133").
     * If provided or resolved from reviews module, injects aggregateRating rich snippet.
     */
    reviewCount?: number | string;

    /**
     * Maximum possible rating scale (defaults to 5).
     */
    bestRating?: number | string;

    /**
     * Minimum possible rating scale (defaults to 1).
     */
    worstRating?: number | string;

    /**
     * Official social media profile URLs.
     */
    socialLinks?: string[];

    /**
     * Current language/locale (e.g. "en", "fr").
     */
    lang?: string;
}

/**
 * Renders a Google-compliant Schema.org LocalBusiness / Store structured data script tag.
 * Dynamically resolves brand identity, contact, address, and Google Reviews aggregateRating.
 */
export async function JsonLdLocalBusiness({
    type,
    name,
    url,
    description,
    image,
    logo,
    telephone,
    email,
    address,
    geo,
    priceRange = "$$",
    currenciesAccepted,
    paymentAccepted,
    openingHours,
    ratingValue,
    reviewCount,
    bestRating = 5,
    worstRating = 1,
    socialLinks,
    lang = "en",
}: JsonLdLocalBusinessProps) {
    const brand = getActiveBrand();
    const storeSettings = await getStoreSettings().catch(() => null);

    // 1. Dynamic Business Type (@type)
    const defaultType =
        brand.identity.id === "green-ghost"
            ? "Dispensary"
            : brand.identity.id === "art-fate"
            ? "ArtGallery"
            : "Store";
    const entityType = type || storeSettings?.seoEntityType || defaultType;

    // 2. Base Identity & URLs
    const brandName = name || storeSettings?.brandName || brand.identity.name || "Store";
    const defaultAppUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        brand.identity.url ||
        "http://localhost:3000";
    const baseUrl = defaultAppUrl.replace(/\/+$/, "");
    const resolvedUrl = url
        ? url.replace(/\/+$/, "")
        : `${baseUrl}/${lang}`;

    // 3. Logo & Image resolution
    const resolvedLogoUrl =
        logo ||
        image ||
        storeSettings?.logoUrl ||
        brand.assets.logo.src ||
        brand.assets.icon;
    const absoluteLogoUrl = resolvedLogoUrl
        ? resolvedLogoUrl.startsWith("http")
            ? resolvedLogoUrl
            : `${baseUrl}${resolvedLogoUrl.startsWith("/") ? "" : "/"}${resolvedLogoUrl}`
        : undefined;

    // 4. Description
    const isFr = lang.startsWith("fr");
    const localizedDesc = isFr
        ? storeSettings?.heroDescription?.fr || storeSettings?.footerDescription?.fr
        : storeSettings?.heroDescription?.en || storeSettings?.footerDescription?.en;
    const resolvedDescription = description || localizedDesc || undefined;

    // 5. Contact Information (Phone & Email)
    const resolvedTelephone = telephone || storeSettings?.contactPhone || brand.contact?.phone;
    const resolvedEmail = email || storeSettings?.contactEmail || brand.contact?.email;

    // 6. Address Resolution
    const settingsAddress: LocalBusinessAddress | undefined = (storeSettings?.seoAddressStreet || storeSettings?.seoAddressLocality || storeSettings?.seoPostalCode || storeSettings?.seoCountry) ? {
        streetAddress: storeSettings.seoAddressStreet || undefined,
        addressLocality: storeSettings.seoAddressLocality || undefined,
        postalCode: storeSettings.seoPostalCode || undefined,
        addressCountry: storeSettings.seoCountry || undefined,
    } : undefined;
    const brandAddress = brand.contact?.address;
    const resolvedAddress: LocalBusinessAddress | undefined = address || settingsAddress || (brandAddress ? {
        streetAddress: brandAddress.street,
        addressLocality: brandAddress.city,
        postalCode: brandAddress.postalCode,
        addressCountry: brandAddress.country,
    } : undefined);

    // 7. Social Links
    const resolvedSocials =
        socialLinks ||
        storeSettings?.socialLinks?.map((s: any) => s.url).filter(Boolean) ||
        brand.navigation?.socials?.map((s) => s.url).filter(Boolean) ||
        [];

    // 8. Dynamic AggregateRating Resolution from Reviews Module
    let activeRatingValue = ratingValue;
    let activeReviewCount = reviewCount;

    const hasExplicitRating =
        activeRatingValue !== undefined &&
        activeRatingValue !== null &&
        activeRatingValue !== "" &&
        activeReviewCount !== undefined &&
        activeReviewCount !== null &&
        activeReviewCount !== "";

    // If rating was not passed explicitly in props, attempt resolution from Google Places reviews module
    if (!hasExplicitRating && storeSettings?.reviewSection) {
        const isReviewsEnabled = Boolean(
            storeSettings.reviewSection.enabled || storeSettings.reviewSection.status === "active"
        );
        const placeId = storeSettings.reviewSection.placeId?.trim();

        if (isReviewsEnabled && placeId) {
            try {
                const placeData = await getGooglePlaceReviews(placeId, lang);
                if (placeData.success && typeof placeData.rating === "number" && typeof placeData.userRatingsTotal === "number") {
                    activeRatingValue = placeData.rating;
                    activeReviewCount = placeData.userRatingsTotal;
                }
            } catch (err) {
                console.warn("[JSON_LD_LOCAL_BUSINESS] Failed to auto-resolve Google Place ratings:", err);
            }
        }
    }

    // 9. Assemble Schema.org LocalBusiness Object
    const schema: Record<string, any> = {
        "@context": "https://schema.org",
        "@type": entityType,
        "@id": `${resolvedUrl}#localbusiness`,
        name: brandName,
        url: resolvedUrl,
        ...(resolvedDescription ? { description: resolvedDescription } : {}),
        ...(absoluteLogoUrl ? { image: absoluteLogoUrl, logo: absoluteLogoUrl } : {}),
        ...(resolvedTelephone ? { telephone: resolvedTelephone } : {}),
        ...(resolvedEmail ? { email: resolvedEmail } : {}),
        ...(priceRange ? { priceRange } : {}),
        ...(currenciesAccepted || storeSettings?.defaultCurrency ? {
            currenciesAccepted: currenciesAccepted || storeSettings?.defaultCurrency || "EUR"
        } : {}),
        ...(paymentAccepted ? { paymentAccepted } : {}),
        ...(resolvedSocials.length > 0 ? { sameAs: resolvedSocials } : {}),
    };

    // Add PostalAddress if available
    const street = resolvedAddress?.streetAddress || resolvedAddress?.street;
    const city = resolvedAddress?.addressLocality || resolvedAddress?.city;
    const postalCode = resolvedAddress?.postalCode;
    const country = resolvedAddress?.addressCountry || resolvedAddress?.country;

    if (street || city || postalCode || country) {
        schema.address = {
            "@type": "PostalAddress",
            ...(street ? { streetAddress: street } : {}),
            ...(city ? { addressLocality: city } : {}),
            ...(resolvedAddress?.addressRegion ? { addressRegion: resolvedAddress.addressRegion } : {}),
            ...(postalCode ? { postalCode } : {}),
            ...(country ? { addressCountry: country } : {}),
        };
    }

    // Add GeoCoordinates if available
    if (geo?.latitude && geo?.longitude) {
        schema.geo = {
            "@type": "GeoCoordinates",
            latitude: Number(geo.latitude),
            longitude: Number(geo.longitude),
        };
    }

    // Add Opening Hours if available
    const supportHours = (isFr ? storeSettings?.supportHoursFr : storeSettings?.supportHoursEn) || brand.contact?.supportHours?.[isFr ? "fr" : "en"];
    const effectiveOpeningHours = openingHours || supportHours;
    if (effectiveOpeningHours) {
        schema.openingHours = effectiveOpeningHours;
    }

    // 10. Conditional AggregateRating Injection
    const numRating =
        activeRatingValue !== undefined && activeRatingValue !== null && activeRatingValue !== ""
            ? Number(activeRatingValue)
            : null;
    const numReviews =
        activeReviewCount !== undefined && activeReviewCount !== null && activeReviewCount !== ""
            ? Number(activeReviewCount)
            : null;

    if (
        numRating !== null &&
        !isNaN(numRating) &&
        numReviews !== null &&
        !isNaN(numReviews) &&
        numReviews > 0
    ) {
        schema.aggregateRating = {
            "@type": "AggregateRating",
            ratingValue: numRating % 1 === 0 ? numRating.toFixed(1) : String(numRating),
            reviewCount: String(numReviews),
            bestRating: String(bestRating),
            worstRating: String(worstRating),
        };
    }

    // 11. Secure DOM injection via dangerouslySetInnerHTML
    const jsonString = JSON.stringify(schema, null, 2).replace(/</g, "\\u003c");

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonString }}
        />
    );
}

export default JsonLdLocalBusiness;
