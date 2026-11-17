import React from "react";
import { getActiveBrand } from "@/config/brand.config";
import { getStoreSettings } from "@/lib/services/settings";
import { getGooglePlaceReviews } from "@/lib/services/google-places";
import { serializeJsonLd } from "@/lib/seo/json-ld";
import { resolveSiteBaseUrl, toAbsoluteUrl } from "@/lib/seo/metadata";

export interface LocalBusinessAddress {
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
  street?: string;
  city?: string;
  country?: string;
}

export interface LocalBusinessGeo {
  latitude?: number | string;
  longitude?: number | string;
}

export interface JsonLdLocalBusinessProps {
  type?: string;
  name?: string;
  url?: string;
  description?: string;
  image?: string;
  logo?: string;
  telephone?: string;
  email?: string;
  address?: LocalBusinessAddress;
  geo?: LocalBusinessGeo;
  priceRange?: string;
  currenciesAccepted?: string;
  paymentAccepted?: string;
  openingHours?: string | string[];
  ratingValue?: number | string;
  reviewCount?: number | string;
  bestRating?: number | string;
  worstRating?: number | string;
  socialLinks?: string[];
  lang?: string;
}

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

  const defaultType =
    brand.identity.id === "green-ghost"
      ? "Dispensary"
      : brand.identity.id === "art-fate"
        ? "ArtGallery"
        : "Store";
  const entityType = type || storeSettings?.seoEntityType || defaultType;

  const brandName =
    name || storeSettings?.brandName || brand.identity.name || "Store";
  const baseUrl = resolveSiteBaseUrl(brand.identity.url);
  const resolvedUrl = url ? url.replace(/\/+$/, "") : `${baseUrl}/${lang}`;

  const resolvedLogoUrl =
    logo ||
    image ||
    storeSettings?.logoUrl ||
    brand.assets.logo.src ||
    brand.assets.icon;
  const absoluteLogoUrl = resolvedLogoUrl
    ? toAbsoluteUrl(baseUrl, resolvedLogoUrl)
    : undefined;

  const isFr = lang.startsWith("fr");
  const localizedDesc = isFr
    ? storeSettings?.heroDescription?.fr || storeSettings?.footerDescription?.fr
    : storeSettings?.heroDescription?.en || storeSettings?.footerDescription?.en;
  const resolvedDescription = description || localizedDesc || undefined;

  const resolvedTelephone =
    telephone || storeSettings?.contactPhone || brand.contact?.phone;
  const resolvedEmail =
    email || storeSettings?.contactEmail || brand.contact?.email;

  const settingsAddress: LocalBusinessAddress | undefined =
    storeSettings?.seoAddressStreet ||
    storeSettings?.seoAddressLocality ||
    storeSettings?.seoPostalCode ||
    storeSettings?.seoCountry
      ? {
          streetAddress: storeSettings.seoAddressStreet || undefined,
          addressLocality: storeSettings.seoAddressLocality || undefined,
          postalCode: storeSettings.seoPostalCode || undefined,
          addressCountry: storeSettings.seoCountry || undefined,
        }
      : undefined;
  const brandAddress = brand.contact?.address;
  const resolvedAddress: LocalBusinessAddress | undefined =
    address ||
    settingsAddress ||
    (brandAddress
      ? {
          streetAddress: brandAddress.street,
          addressLocality: brandAddress.city,
          postalCode: brandAddress.postalCode,
          addressCountry: brandAddress.country,
        }
      : undefined);

  const resolvedSocials =
    socialLinks ||
    storeSettings?.socialLinks
      ?.map((s) => s.url)
      .filter((u): u is string => Boolean(u)) ||
    brand.navigation?.socials?.map((s) => s.url).filter(Boolean) ||
    [];

  let activeRatingValue = ratingValue;
  let activeReviewCount = reviewCount;

  const hasExplicitRating =
    activeRatingValue !== undefined &&
    activeRatingValue !== null &&
    activeRatingValue !== "" &&
    activeReviewCount !== undefined &&
    activeReviewCount !== null &&
    activeReviewCount !== "";

  if (!hasExplicitRating && storeSettings?.reviewSection) {
    const isReviewsEnabled = Boolean(
      storeSettings.reviewSection.enabled ||
        storeSettings.reviewSection.status === "active"
    );
    const placeId = storeSettings.reviewSection.placeId?.trim();

    if (isReviewsEnabled && placeId) {
      try {
        const placeData = await getGooglePlaceReviews(placeId, lang);
        if (
          placeData.success &&
          typeof placeData.rating === "number" &&
          typeof placeData.userRatingsTotal === "number"
        ) {
          activeRatingValue = placeData.rating;
          activeReviewCount = placeData.userRatingsTotal;
        }
      } catch (err) {
        console.warn(
          "[JSON_LD_LOCAL_BUSINESS] Failed to auto-resolve Google Place ratings:",
          err
        );
      }
    }
  }

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": entityType,
    "@id": `${resolvedUrl}#localbusiness`,
    name: brandName,
    url: resolvedUrl,
    ...(resolvedDescription ? { description: resolvedDescription } : {}),
    ...(absoluteLogoUrl
      ? { image: absoluteLogoUrl, logo: absoluteLogoUrl }
      : {}),
    ...(resolvedTelephone ? { telephone: resolvedTelephone } : {}),
    ...(resolvedEmail ? { email: resolvedEmail } : {}),
    ...(priceRange ? { priceRange } : {}),
    ...(currenciesAccepted || storeSettings?.defaultCurrency
      ? {
          currenciesAccepted:
            currenciesAccepted || storeSettings?.defaultCurrency || "EUR",
        }
      : {}),
    ...(paymentAccepted ? { paymentAccepted } : {}),
    ...(resolvedSocials.length > 0 ? { sameAs: resolvedSocials } : {}),
  };

  const street = resolvedAddress?.streetAddress || resolvedAddress?.street;
  const city = resolvedAddress?.addressLocality || resolvedAddress?.city;
  const postalCode = resolvedAddress?.postalCode;
  const country = resolvedAddress?.addressCountry || resolvedAddress?.country;

  if (street || city || postalCode || country) {
    schema.address = {
      "@type": "PostalAddress",
      ...(street ? { streetAddress: street } : {}),
      ...(city ? { addressLocality: city } : {}),
      ...(resolvedAddress?.addressRegion
        ? { addressRegion: resolvedAddress.addressRegion }
        : {}),
      ...(postalCode ? { postalCode } : {}),
      ...(country ? { addressCountry: country } : {}),
    };
  }

  if (geo?.latitude && geo?.longitude) {
    schema.geo = {
      "@type": "GeoCoordinates",
      latitude: Number(geo.latitude),
      longitude: Number(geo.longitude),
    };
  }

  const supportHours =
    (isFr ? storeSettings?.supportHoursFr : storeSettings?.supportHoursEn) ||
    brand.contact?.supportHours?.[isFr ? "fr" : "en"];
  const effectiveOpeningHours = openingHours || supportHours;
  if (effectiveOpeningHours) {
    schema.openingHours = effectiveOpeningHours;
  }

  const numRating =
    activeRatingValue !== undefined &&
    activeRatingValue !== null &&
    activeRatingValue !== ""
      ? Number(activeRatingValue)
      : null;
  const numReviews =
    activeReviewCount !== undefined &&
    activeReviewCount !== null &&
    activeReviewCount !== ""
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
      ratingValue:
        numRating % 1 === 0 ? numRating.toFixed(1) : String(numRating),
      reviewCount: String(numReviews),
      bestRating: String(bestRating),
      worstRating: String(worstRating),
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  );
}

export default JsonLdLocalBusiness;
