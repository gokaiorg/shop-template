import { GoogleReview } from "@/types/database";

export interface GooglePlaceDetailsResponse {
    success: boolean;
    name?: string;
    rating?: number;
    userRatingsTotal?: number;
    reviews: GoogleReview[];
    error?: string;
}

/**
 * Free fallback translation helper using standard Google endpoint.
 * Only invoked if Google Places API returns text in a different language than requested.
 */
async function translateTextFallback(text: string, targetLang: string): Promise<string> {
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
        const data = await res.json();
        if (Array.isArray(data) && Array.isArray(data[0])) {
            const translated = data[0].map((item: any) => item?.[0] || "").join("");
            return translated || text;
        }
    } catch (err) {
        console.warn("[REVIEW_TRANSLATE_FALLBACK_ERROR]", err);
    }
    return text;
}

/**
 * Deduplicate reviews strictly by author name (and snippet if generic name)
 * to ensure that no duplicate reviews are ever displayed.
 */
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

function parseClassicReviews(rawReviews: any[]): GoogleReview[] {
    if (!Array.isArray(rawReviews)) return [];
    return rawReviews.map((r) => ({
        author_name: r.author_name || "Client Google",
        rating: typeof r.rating === "number" ? r.rating : 5,
        text: r.text || "",
        profile_photo_url: r.profile_photo_url || "",
        relative_time_description: r.relative_time_description || undefined,
    }));
}

async function parseNewReviews(rawReviews: any[], targetLang: string = "fr"): Promise<GoogleReview[]> {
    if (!Array.isArray(rawReviews)) return [];
    const parsed: GoogleReview[] = [];

    for (const r of rawReviews) {
        const authorName = r.authorAttribution?.displayName || "Client Google";
        const rating = typeof r.rating === "number" ? r.rating : 5;
        let text = typeof r.text === "object" ? r.text?.text || "" : (r.text || "");
        const textLang = typeof r.text === "object" ? r.text?.languageCode : undefined;
        const photoUrl = r.authorAttribution?.photoUri || "";
        const relativeTime = r.relativePublishTimeDescription || undefined;

        // If the review language is present and differs from requested targetLang, auto-translate it
        if (text && textLang && textLang.toLowerCase() !== targetLang.toLowerCase()) {
            text = await translateTextFallback(text, targetLang);
        }

        parsed.push({
            author_name: authorName,
            rating,
            text,
            profile_photo_url: photoUrl,
            relative_time_description: relativeTime,
        });
    }

    return parsed;
}

/**
 * Server-only service to securely query Google Places API (Place Details).
 * Extracts author_name, rating, text, and profile_photo_url.
 * Strictly queries the requested language without cross-language fallbacks
 * and deduplicates reviews without artificial padding.
 * Cached using Next.js fetch cache (1 hour).
 */
export async function getGooglePlaceReviews(
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
            error: "Google Places API key is not configured. Please set GOOGLE_PLACES_API_KEY in your environment.",
        };
    }

    // 1. Attempt Classic Place Details API
    try {
        const classicUrl = new URL("https://maps.googleapis.com/maps/api/place/details/json");
        classicUrl.searchParams.set("place_id", cleanPlaceId);
        classicUrl.searchParams.set("fields", "name,rating,reviews,user_ratings_total");
        classicUrl.searchParams.set("key", apiKey);
        classicUrl.searchParams.set("language", lang);

        const res = await fetch(classicUrl.toString(), {
            next: { revalidate: 3600 },
        });

        if (res.ok) {
            const data = await res.json();

            if (data.status === "OK") {
                const rawReviews = parseClassicReviews(data.result?.reviews);
                const reviews = deduplicateReviews(rawReviews).slice(0, 6);

                return {
                    success: true,
                    name: data.result?.name,
                    rating: data.result?.rating,
                    userRatingsTotal: data.result?.user_ratings_total,
                    reviews,
                };
            }

            // If error is related to Legacy API not activated, fallback to Places API (New)
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

    // 2. Fallback / Modern Standard: Places API (New)
    try {
        const newUrl = `https://places.googleapis.com/v1/places/${encodeURIComponent(cleanPlaceId)}?fields=id,displayName,rating,reviews,userRatingCount&key=${encodeURIComponent(apiKey)}&languageCode=${encodeURIComponent(lang)}`;

        const resNew = await fetch(newUrl, {
            next: { revalidate: 3600 },
        });

        if (resNew.ok) {
            const dataNew = await resNew.json();
            const rawReviews = await parseNewReviews(dataNew?.reviews, lang);
            const reviews = deduplicateReviews(rawReviews).slice(0, 6);

            return {
                success: true,
                name: dataNew.displayName?.text,
                rating: dataNew.rating,
                userRatingsTotal: dataNew.userRatingCount,
                reviews,
            };
        } else {
            const errData = await resNew.json().catch(() => null);
            const errMsg = errData?.error?.message || `HTTP ${resNew.status}`;
            console.error(`[GOOGLE_PLACES_API_NEW_ERROR] ${errMsg}`);
            return {
                success: false,
                reviews: [],
                error: errMsg,
            };
        }
    } catch (newErr: any) {
        console.error("[GOOGLE_PLACES_API_NEW_FETCH_ERROR]", newErr);
        return {
            success: false,
            reviews: [],
            error: newErr?.message || "Failed to fetch Google reviews",
        };
    }
}
