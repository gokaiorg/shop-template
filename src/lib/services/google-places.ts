import { cache } from "react";
import { unstable_cache } from "next/cache";
import { GoogleReview } from "@/types/database";

export interface GooglePlaceDetailsResponse {
  success: boolean;
  name?: string;
  rating?: number;
  userRatingsTotal?: number;
  reviews: GoogleReview[];
  error?: string;
}

interface ClassicReviewItem {
  author_name?: string;
  rating?: number;
  text?: string;
  profile_photo_url?: string;
  relative_time_description?: string;
  time?: number;
}

interface NewReviewTextField {
  text?: string;
  languageCode?: string;
}

interface NewReviewItem {
  authorAttribution?: {
    displayName?: string;
    photoUri?: string;
  };
  rating?: number;
  originalText?: NewReviewTextField | string;
  text?: NewReviewTextField | string;
  relativePublishTimeDescription?: string;
  publishTime?: string;
}

async function translateTextFallback(
  text: string,
  targetLang: string
): Promise<string> {
  if (!text || !targetLang) return text;
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(
      targetLang
    )}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return text;
    const data: unknown = await res.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const translated = (data[0] as unknown[])
        .map((item) => (Array.isArray(item) && typeof item[0] === "string" ? item[0] : ""))
        .join("");
      return translated || text;
    }
  } catch (err) {
    console.warn("[REVIEW_TRANSLATE_FALLBACK_ERROR]", err);
  }
  return text;
}

function deduplicateReviews(reviews: GoogleReview[]): GoogleReview[] {
  const seen = new Set<string>();
  const genericNames = new Set([
    "client google",
    "a google user",
    "google user",
    "utilisateur google",
    "un utilisateur de google",
  ]);
  const result: GoogleReview[] = [];

  for (const r of reviews) {
    const authorNormalized = (r.author_name || "").trim().toLowerCase();
    const key =
      genericNames.has(authorNormalized) || !authorNormalized
        ? `${authorNormalized}_${(r.text || "").trim().slice(0, 50).toLowerCase()}`
        : authorNormalized;

    if (!seen.has(key)) {
      seen.add(key);
      result.push(r);
    }
  }
  return result;
}

function parseClassicReviews(rawReviews: unknown): GoogleReview[] {
  if (!Array.isArray(rawReviews)) return [];
  return (rawReviews as ClassicReviewItem[]).map((r) => ({
    author_name: r.author_name || "Client Google",
    rating: typeof r.rating === "number" ? r.rating : 5,
    text: r.text || "",
    profile_photo_url: r.profile_photo_url || "",
    relative_time_description: r.relative_time_description || undefined,
    publish_time: r.time ? new Date(r.time * 1000).toISOString() : undefined,
  }));
}

function sortReviewsByDate(reviews: GoogleReview[]): GoogleReview[] {
  return [...reviews].sort((a, b) => {
    if (!a.publish_time && !b.publish_time) return 0;
    if (!a.publish_time) return 1;
    if (!b.publish_time) return -1;
    return (
      new Date(b.publish_time).getTime() - new Date(a.publish_time).getTime()
    );
  });
}

async function parseNewReviews(
  rawReviews: unknown,
  targetLang: string = "fr"
): Promise<GoogleReview[]> {
  if (!Array.isArray(rawReviews)) return [];

  const parsedEntries = await Promise.all(
    (rawReviews as NewReviewItem[]).map(async (r) => {
      const authorName = r.authorAttribution?.displayName || "Client Google";
      const rating = typeof r.rating === "number" ? r.rating : 5;
      const origText =
        typeof r.originalText === "object" ? r.originalText?.text : undefined;
      const origLang =
        typeof r.originalText === "object"
          ? r.originalText?.languageCode
          : undefined;
      const textObj =
        typeof r.text === "object" ? r.text?.text : r.text || "";
      const textLang =
        typeof r.text === "object" ? r.text?.languageCode : undefined;

      const photoUrl = r.authorAttribution?.photoUri || "";
      const relativeTime = r.relativePublishTimeDescription || undefined;
      const publishTime = r.publishTime || undefined;

      const isNative = Boolean(
        origLang && origLang.toLowerCase() === targetLang.toLowerCase()
      );

      if (isNative) {
        return {
          isNative: true,
          review: {
            author_name: authorName,
            rating,
            text: origText || textObj || "",
            profile_photo_url: photoUrl,
            relative_time_description: relativeTime,
            publish_time: publishTime,
          } satisfies GoogleReview,
        };
      }

      let text = textObj || origText || "";
      if (!textLang || textLang.toLowerCase() !== targetLang.toLowerCase()) {
        text = await translateTextFallback(origText || text, targetLang);
      }

      return {
        isNative: false,
        review: {
          author_name: authorName,
          rating,
          text,
          profile_photo_url: photoUrl,
          relative_time_description: relativeTime,
          publish_time: publishTime,
        } satisfies GoogleReview,
      };
    })
  );

  const nativeReviews = parsedEntries
    .filter((entry) => entry.isNative)
    .map((entry) => entry.review);
  const translatedReviews = parsedEntries
    .filter((entry) => !entry.isNative)
    .map((entry) => entry.review);

  const nativeSorted = sortReviewsByDate(deduplicateReviews(nativeReviews));
  const translatedSorted = sortReviewsByDate(
    deduplicateReviews(translatedReviews)
  );

  if (nativeSorted.length >= 3) {
    return nativeSorted.slice(0, 3);
  }

  return [...nativeSorted, ...translatedSorted].slice(0, 3);
}

async function fetchGooglePlaceReviews(
  placeId: string,
  lang: string = "fr"
): Promise<GooglePlaceDetailsResponse> {
  const cleanPlaceId = (placeId || "").trim();

  if (!cleanPlaceId) {
    return {
      success: false,
      reviews: [],
      error: "Place ID is required",
    };
  }

  const apiKey =
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "";

  if (!apiKey) {
    console.warn(
      "[GOOGLE_PLACES_API] Neither GOOGLE_PLACES_API_KEY nor NEXT_PUBLIC_FIREBASE_API_KEY is configured."
    );
    return {
      success: false,
      reviews: [],
      error:
        "Google Places API key is not configured. Please set GOOGLE_PLACES_API_KEY in your environment.",
    };
  }

  try {
    const classicUrl = new URL(
      "https://maps.googleapis.com/maps/api/place/details/json"
    );
    classicUrl.searchParams.set("place_id", cleanPlaceId);
    classicUrl.searchParams.set(
      "fields",
      "name,rating,reviews,user_ratings_total"
    );
    classicUrl.searchParams.set("key", apiKey);
    classicUrl.searchParams.set("language", lang);

    const res = await fetch(classicUrl.toString(), {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const data = (await res.json()) as {
        status?: string;
        error_message?: string;
        result?: {
          name?: string;
          rating?: number;
          user_ratings_total?: number;
          reviews?: unknown;
        };
      };

      if (data.status === "OK") {
        const rawReviews = parseClassicReviews(data.result?.reviews);
        const reviews = sortReviewsByDate(deduplicateReviews(rawReviews)).slice(
          0,
          3
        );

        return {
          success: true,
          name: data.result?.name,
          rating: data.result?.rating,
          userRatingsTotal: data.result?.user_ratings_total,
          reviews,
        };
      }

      const isLegacyNotActivated =
        typeof data.error_message === "string" &&
        data.error_message.toLowerCase().includes("legacy");

      if (!isLegacyNotActivated && data.status !== "INVALID_REQUEST") {
        console.warn(
          `[GOOGLE_PLACES_API_CLASSIC] Status: ${data.status} for placeId: ${cleanPlaceId}`,
          data.error_message || ""
        );
      }
    }
  } catch (classicErr) {
    console.warn("[GOOGLE_PLACES_API_CLASSIC_ERROR]", classicErr);
  }

  try {
    const newUrl = `https://places.googleapis.com/v1/places/${encodeURIComponent(cleanPlaceId)}?fields=id,displayName,rating,reviews,userRatingCount&key=${encodeURIComponent(apiKey)}&languageCode=${encodeURIComponent(lang)}`;

    const resNew = await fetch(newUrl, {
      next: { revalidate: 3600 },
    });

    if (resNew.ok) {
      const dataNew = (await resNew.json()) as {
        displayName?: { text?: string };
        rating?: number;
        userRatingCount?: number;
        reviews?: unknown;
      };
      const reviews = await parseNewReviews(dataNew?.reviews, lang);

      return {
        success: true,
        name: dataNew.displayName?.text,
        rating: dataNew.rating,
        userRatingsTotal: dataNew.userRatingCount,
        reviews,
      };
    } else {
      const errData = (await resNew.json().catch(() => null)) as {
        error?: { message?: string };
      } | null;
      const errMsg = errData?.error?.message || `HTTP ${resNew.status}`;
      console.error(`[GOOGLE_PLACES_API_NEW_ERROR] ${errMsg}`);
      return {
        success: false,
        reviews: [],
        error: errMsg,
      };
    }
  } catch (newErr: unknown) {
    console.error("[GOOGLE_PLACES_API_NEW_FETCH_ERROR]", newErr);
    return {
      success: false,
      reviews: [],
      error:
        newErr instanceof Error
          ? newErr.message
          : "Failed to fetch Google reviews",
    };
  }
}

const getCachedGooglePlaceReviews = unstable_cache(
  fetchGooglePlaceReviews,
  ["google-place-reviews"],
  {
    revalidate: 3600,
    tags: ["google-reviews"],
  }
);

export const getGooglePlaceReviews = cache(
  async (
    placeId: string,
    lang: string = "fr"
  ): Promise<GooglePlaceDetailsResponse> => {
    return getCachedGooglePlaceReviews(placeId, lang);
  }
);
