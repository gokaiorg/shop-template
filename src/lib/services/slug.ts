import { adminDb } from "@/lib/firebase-admin";
import { slugify } from "@/lib/slug";

export interface ResolveUniqueSlugOptions {
    collectionName: "products" | "categories" | "pages" | string;
    baseSlug: string;
    locale: string;
    excludeId?: string;
}

/**
 * Checks if a specific slug is already utilized by another document in Firestore.
 * Performs scoped equality checks against nested and legacy flat slug fields.
 */
export async function isSlugTaken(
    collectionName: string,
    slugCandidate: string,
    locale: string,
    excludeId?: string
): Promise<boolean> {
    if (!slugCandidate) return false;
    const colRef = adminDb.collection(collectionName);

    // 1. Check nested map field: slug.<locale> == slugCandidate
    const nestedSnap = await colRef
        .where(`slug.${locale}`, "==", slugCandidate)
        .limit(2)
        .get();

    for (const doc of nestedSnap.docs) {
        if (!excludeId || doc.id !== excludeId) {
            return true;
        }
    }

    // 2. Check legacy flat locale fields (slugEn, slugFr)
    const legacyField = locale === "fr" ? "slugFr" : locale === "en" ? "slugEn" : null;
    if (legacyField) {
        const legacySnap = await colRef
            .where(legacyField, "==", slugCandidate)
            .limit(2)
            .get();

        for (const doc of legacySnap.docs) {
            if (!excludeId || doc.id !== excludeId) {
                return true;
            }
        }
    }

    // 3. Check legacy flat string field (slug)
    const flatSnap = await colRef
        .where("slug", "==", slugCandidate)
        .limit(2)
        .get();

    for (const doc of flatSnap.docs) {
        if (!excludeId || doc.id !== excludeId) {
            return true;
        }
    }

    return false;
}

/**
 * Generates and guarantees a strictly unique slug in Firestore.
 * If the base slug is available, it is returned as-is.
 * If a conflict is detected, appends a two-digit incremental suffix: -01, -02, etc.
 */
export async function resolveUniqueSlug({
    collectionName,
    baseSlug,
    locale,
    excludeId,
}: ResolveUniqueSlugOptions): Promise<string> {
    const sanitized = slugify(baseSlug) || "item";

    // 1. Initial check: is the sanitized base slug free?
    const isBaseTaken = await isSlugTaken(collectionName, sanitized, locale, excludeId);
    if (!isBaseTaken) {
        return sanitized;
    }

    // 2. Conflict detected: extract root and starting counter
    const match = sanitized.match(/^(.+)-(\d{2,})$/);
    const root = match ? match[1] : sanitized;
    let counter = match ? parseInt(match[2], 10) + 1 : 1;

    // 3. Incremental validation loop
    while (true) {
        const suffix = String(counter).padStart(2, "0");
        const candidate = `${root}-${suffix}`;

        const candidateTaken = await isSlugTaken(collectionName, candidate, locale, excludeId);
        if (!candidateTaken) {
            return candidate;
        }

        counter++;
        if (counter > 999) {
            // Safety fallback to prevent infinite loops in extreme circumstances
            return `${root}-${Date.now()}`;
        }
    }
}

export interface ResolveUniqueSlugMapOptions {
    collectionName: "products" | "categories" | "pages" | string;
    slugMap: Record<string, string>;
    nameMap?: Record<string, string>;
    locales: string[];
    defaultLocale: string;
    excludeId?: string;
}

/**
 * Resolves unique slugs across all requested locales for a document.
 */
export async function resolveUniqueSlugMap({
    collectionName,
    slugMap,
    nameMap = {},
    locales,
    defaultLocale,
    excludeId,
}: ResolveUniqueSlugMapOptions): Promise<Record<string, string>> {
    const resolved: Record<string, string> = {};
    const allLocales = Array.from(
        new Set([...locales, ...Object.keys(slugMap || {}), ...Object.keys(nameMap || {})])
    ).filter(Boolean);

    for (const loc of allLocales) {
        const rawBase =
            slugMap?.[loc] ||
            slugMap?.[defaultLocale] ||
            nameMap?.[loc] ||
            nameMap?.[defaultLocale] ||
            (slugMap ? Object.values(slugMap)[0] : "") ||
            (nameMap ? Object.values(nameMap)[0] : "") ||
            "item";

        resolved[loc] = await resolveUniqueSlug({
            collectionName,
            baseSlug: rawBase,
            locale: loc,
            excludeId,
        });
    }

    return resolved;
}
