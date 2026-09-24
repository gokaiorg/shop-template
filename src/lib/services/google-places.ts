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
 * Server-only service to securely query Google Places API (Place Details).
 * Extracts author_name, rating, text, and profile_photo_url.
 * Supports both standard Google Place Details endpoint and Places API (New).
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
                const rawReviews: any[] = Array.isArray(data.result?.reviews) ? data.result.reviews : [];
                const reviews: GoogleReview[] = rawReviews.map((r) => ({
                    author_name: r.author_name || "Client Google",
                    rating: typeof r.rating === "number" ? r.rating : 5,
                    text: r.text || "",
                    profile_photo_url: r.profile_photo_url || "",
                    relative_time_description: r.relative_time_description || undefined,
                }));

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

    // 2. Fallback / Alternative: Places API (New)
    try {
        const newUrl = `https://places.googleapis.com/v1/places/${encodeURIComponent(cleanPlaceId)}?fields=id,displayName,rating,reviews,userRatingCount&key=${encodeURIComponent(apiKey)}&languageCode=${encodeURIComponent(lang)}`;

        const resNew = await fetch(newUrl, {
            next: { revalidate: 3600 },
        });

        if (resNew.ok) {
            const dataNew = await resNew.json();
            const rawReviewsNew: any[] = Array.isArray(dataNew?.reviews) ? dataNew.reviews : [];

            const reviews: GoogleReview[] = rawReviewsNew.map((r) => ({
                author_name: r.authorAttribution?.displayName || "Client Google",
                rating: typeof r.rating === "number" ? r.rating : 5,
                text: typeof r.text === "object" ? r.text?.text || "" : (r.text || ""),
                profile_photo_url: r.authorAttribution?.photoUri || "",
                relative_time_description: r.relativePublishTimeDescription || undefined,
            }));

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
