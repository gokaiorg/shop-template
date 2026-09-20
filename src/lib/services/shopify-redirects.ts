import { adminDb } from "@/lib/firebase-admin";
import { getLocalizedField } from "@/lib/i18n";
import { Category, Product } from "@/types/database";

// In-memory cache for fast lookups (5-minute TTL)
interface CacheEntry {
    destination: string;
    expiresAt: number;
}

const CACHE_TTL_MS = 5 * 60 * 1000;
const productRedirectCache = new Map<string, CacheEntry>();
const policyRedirectCache = new Map<string, CacheEntry>();

function createRedirectResponse(destination: string): Response {
    return new Response(null, {
        status: 301,
        headers: {
            Location: destination,
        },
    });
}

/**
 * Resolves orphan/direct Shopify product URLs (/products/:slug or /[lang]/products/:slug)
 * - Queries Firestore to find the product and its primary category
 * - Redirects to /en/artworks/:category/:slug if found
 * - Falls back to /en/artworks/painting if not found or on error
 */
export async function resolveProductRedirect(slug: string, _reqUrl?: string): Promise<Response> {
    const cleanSlug = (slug || "").trim().toLowerCase();
    const now = Date.now();

    // 1. Check in-memory cache
    const cached = productRedirectCache.get(cleanSlug);
    if (cached && cached.expiresAt > now) {
        return createRedirectResponse(cached.destination);
    }

    try {
        let product: Product | null = null;
        let matchedCategorySlug: string | null = null;

        // Query products by English slug
        const snap = await adminDb.collection("products").where("slug.en", "==", cleanSlug).limit(1).get();
        if (!snap.empty) {
            product = { id: snap.docs[0].id, ...snap.docs[0].data() } as Product;
        } else {
            // Check legacy flat slugEn field
            const snapLegacy = await adminDb.collection("products").where("slugEn", "==", cleanSlug).limit(1).get();
            if (!snapLegacy.empty) {
                product = { id: snapLegacy.docs[0].id, ...snapLegacy.docs[0].data() } as Product;
            } else {
                // Check all products for any matching slug (slug, slugFr, or ID)
                const allSnap = await adminDb.collection("products").get();
                for (const doc of allSnap.docs) {
                    const data = doc.data();
                    const sEn = typeof data.slug === "object" ? data.slug?.en : data.slug;
                    const sFr = typeof data.slug === "object" ? data.slug?.fr : data.slugFr;
                    if (
                        sEn?.toLowerCase() === cleanSlug ||
                        sFr?.toLowerCase() === cleanSlug ||
                        data.slugEn?.toLowerCase() === cleanSlug ||
                        doc.id.toLowerCase() === cleanSlug
                    ) {
                        product = { id: doc.id, ...data } as Product;
                        break;
                    }
                }
            }
        }

        // If product was found, construct the full silo URL
        if (product) {
            const catIds = product.categoryIds || (product.categoryId ? [product.categoryId] : []);
            if (catIds.length > 0) {
                const catDoc = await adminDb.collection("categories").doc(catIds[0]).get();
                if (catDoc.exists) {
                    const catData = catDoc.data() as Category;
                    const rawCatSlug = (typeof catData.slug === "object" && catData.slug?.en)
                        ? catData.slug.en
                        : catData.slugEn || getLocalizedField(catData.slug, "en") || catDoc.id;
                    matchedCategorySlug = rawCatSlug?.toLowerCase().trim() || null;
                }
            }

            const finalCatSlug = matchedCategorySlug || "painting";
            const finalProductSlug = (typeof product.slug === "object" && product.slug?.en) || product.slugEn || cleanSlug;
            const destination = `/en/artworks/${finalCatSlug}/${finalProductSlug}`;

            productRedirectCache.set(cleanSlug, { destination, expiresAt: now + CACHE_TTL_MS });
            return createRedirectResponse(destination);
        }

        // Fallback: If not found, redirect to /en/artworks/painting
        const fallback = `/en/artworks/painting`;
        productRedirectCache.set(cleanSlug, { destination: fallback, expiresAt: now + CACHE_TTL_MS });
        return createRedirectResponse(fallback);
    } catch (error) {
        console.error("Error resolving product redirect for slug:", cleanSlug, error);
        // Fallback: /en/artworks/painting
        const fallback = `/en/artworks/painting`;
        return createRedirectResponse(fallback);
    }
}

/**
 * Resolves legacy Shopify legal/policy pages (/policies/:slug)
 * - Queries Firestore pages collection to check if the page exists
 * - Redirects to /en/:slug if page exists
 * - Falls back to /en/artworks if not found or on error
 */
export async function resolvePolicyRedirect(slug: string, _reqUrl?: string): Promise<Response> {
    const cleanSlug = (slug || "").trim().toLowerCase();
    const now = Date.now();

    // 1. Check in-memory cache
    const cached = policyRedirectCache.get(cleanSlug);
    if (cached && cached.expiresAt > now) {
        return createRedirectResponse(cached.destination);
    }

    try {
        let pageExists = false;

        // Check if page exists by slug.en
        const snap = await adminDb.collection("pages").where("slug.en", "==", cleanSlug).limit(1).get();
        if (!snap.empty) {
            pageExists = true;
        } else {
            // Check direct string slug or legacy fields
            const snap2 = await adminDb.collection("pages").where("slug", "==", cleanSlug).limit(1).get();
            if (!snap2.empty) {
                pageExists = true;
            } else {
                // Check doc ID
                const docSnap = await adminDb.collection("pages").doc(cleanSlug).get();
                if (docSnap.exists) {
                    pageExists = true;
                }
            }
        }

        const destination = pageExists ? `/en/${cleanSlug}` : `/en/about`;
        policyRedirectCache.set(cleanSlug, { destination, expiresAt: now + CACHE_TTL_MS });

        return createRedirectResponse(destination);
    } catch (error) {
        console.error("Error resolving policy redirect for slug:", cleanSlug, error);
        // Fallback: /en/about
        return createRedirectResponse(`/en/about`);
    }
}
