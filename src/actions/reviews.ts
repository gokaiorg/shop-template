"use server";

import { getGooglePlaceReviews, GooglePlaceDetailsResponse } from "@/lib/services/google-places";
import { getStoreSettings } from "@/lib/services/settings";

/**
 * Server Action to fetch Google Reviews safely from the server.
 */
export async function getGoogleReviewsAction(
    placeId?: string,
    lang: string = "fr"
): Promise<GooglePlaceDetailsResponse> {
    try {
        let targetPlaceId = (placeId || "").trim();

        if (!targetPlaceId) {
            const settings = await getStoreSettings();
            targetPlaceId = settings.reviewSection?.placeId || "";
        }

        if (!targetPlaceId) {
            return {
                success: false,
                reviews: [],
                error: "Google Place ID is missing",
            };
        }

        return await getGooglePlaceReviews(targetPlaceId, lang);
    } catch (error: any) {
        console.error("[SERVER_ACTION_REVIEWS_ERROR]", error);
        return {
            success: false,
            reviews: [],
            error: error?.message || "Failed to load reviews",
        };
    }
}
