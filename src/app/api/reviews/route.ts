import { NextRequest, NextResponse } from "next/server";
import { getGooglePlaceReviews } from "@/lib/services/google-places";
import { getStoreSettings } from "@/lib/services/settings";

export const dynamic = "force-dynamic";

/**
 * Route Handler to securely serve Google Places reviews.
 * Usage: GET /api/reviews?placeId=...&lang=fr
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        let placeId = searchParams.get("placeId");
        const lang = searchParams.get("lang") || "fr";

        // If placeId is not provided in query param, fallback to active CMS block configuration
        if (!placeId) {
            const settings = await getStoreSettings();
            placeId = settings.reviewSection?.placeId || null;
        }

        if (!placeId) {
            return NextResponse.json(
                { success: false, reviews: [], error: "No placeId provided or configured." },
                { status: 400 }
            );
        }

        const data = await getGooglePlaceReviews(placeId, lang);

        return NextResponse.json(data, {
            status: data.success ? 200 : 502,
            headers: {
                "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
            },
        });
    } catch (error: any) {
        console.error("[ROUTE_API_REVIEWS_ERROR]", error);
        return NextResponse.json(
            { success: false, reviews: [], error: error?.message || "Internal server error" },
            { status: 500 }
        );
    }
}
