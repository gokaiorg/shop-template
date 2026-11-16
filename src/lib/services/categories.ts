import { cache } from "react";
import { unstable_cache } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { getActiveBrandKey } from "@/config/brand.config";
import { getLocalizedField } from "@/lib/i18n";
import { Category } from "@/types/database";

interface TimestampLike {
  toDate?: () => Date;
  _seconds?: number;
}

function getCacheScopeKey(): string {
  const brandKey = getActiveBrandKey();
  const projectId =
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "default";
  const dbId =
    process.env.FIREBASE_DATABASE_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_ID ||
    "default";
  return `${brandKey}:${projectId}:${dbId}`;
}

export const serializeCategoryTimestamp = (ts: unknown): string | null => {
  if (!ts) return null;
  if (typeof ts === "string") return ts;
  if (ts instanceof Date) {
    return isNaN(ts.getTime()) ? null : ts.toISOString();
  }
  if (typeof ts === "object") {
    const candidate = ts as TimestampLike;
    if (typeof candidate.toDate === "function") {
      const converted = candidate.toDate();
      return isNaN(converted.getTime()) ? null : converted.toISOString();
    }
    if (typeof candidate._seconds === "number") {
      const converted = new Date(candidate._seconds * 1000);
      return isNaN(converted.getTime()) ? null : converted.toISOString();
    }
  }
  return null;
};

export const serializeCategoryDoc = (
  docId: string,
  data: Record<string, unknown>
): Category => {
  return {
    ...(data as unknown as Omit<Category, "id">),
    id: docId,
    name:
      data.name && typeof data.name === "object"
        ? (data.name as Record<string, string>)
        : {},
    slug:
      data.slug && typeof data.slug === "object"
        ? (data.slug as Record<string, string>)
        : {},
    description:
      data.description && typeof data.description === "object"
        ? (data.description as Record<string, string>)
        : {},
    showInHeader: Boolean(data.showInHeader),
    enableProductZoom: data.enableProductZoom !== false,
    hideSoldOutByDefault: Boolean(data.hideSoldOutByDefault),
    order: typeof data.order === "number" ? data.order : 0,
    status: typeof data.status === "string" ? data.status : "published",
    createdAt: serializeCategoryTimestamp(data.createdAt) ?? "",
    updatedAt: serializeCategoryTimestamp(data.updatedAt) ?? "",
  };
};

async function fetchHeaderCategoriesFromFirestore(
  _scopeKey: string
): Promise<Category[]> {
  void _scopeKey;
  try {
    const snapshot = await adminDb
      .collection("categories")
      .where("showInHeader", "==", true)
      .get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs
      .map((doc) =>
        serializeCategoryDoc(doc.id, (doc.data() || {}) as Record<string, unknown>)
      )
      .filter((cat) => cat.status !== "draft")
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  } catch (error) {
    console.error("[GET_HEADER_CATEGORIES_ERROR]", error);
    return [];
  }
}

async function fetchAllPublishedCategoriesFromFirestore(
  _scopeKey: string
): Promise<Category[]> {
  void _scopeKey;
  try {
    const snapshot = await adminDb
      .collection("categories")
      .orderBy("order", "asc")
      .get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs
      .map((doc) =>
        serializeCategoryDoc(doc.id, (doc.data() || {}) as Record<string, unknown>)
      )
      .filter((cat) => (cat.status ?? "published") === "published");
  } catch (error) {
    console.error("[GET_ALL_PUBLISHED_CATEGORIES_ERROR]", error);
    return [];
  }
}

const getCachedHeaderCategories = unstable_cache(
  fetchHeaderCategoriesFromFirestore,
  ["header-categories"],
  {
    revalidate: 300,
    tags: ["categories"],
  }
);

const getCachedAllPublishedCategories = unstable_cache(
  fetchAllPublishedCategoriesFromFirestore,
  ["published-categories"],
  {
    revalidate: 300,
    tags: ["categories"],
  }
);

export const getHeaderCategories = cache(async (): Promise<Category[]> => {
  return getCachedHeaderCategories(getCacheScopeKey());
});

export const getAllPublishedCategories = cache(
  async (): Promise<Category[]> => {
    return getCachedAllPublishedCategories(getCacheScopeKey());
  }
);

export interface CategoryLookupResult {
  category: Category | null;
  correctSlugForLang?: string;
  shouldRedirect?: boolean;
}

export const lookupCategoryBySlug = cache(
  async (lang: string, categorySlug: string): Promise<CategoryLookupResult> => {
    const categories = await getAllPublishedCategories();

    for (const cat of categories) {
      const directSlug =
        typeof cat.slug === "object" && cat.slug?.[lang]
          ? cat.slug[lang]
          : undefined;
      const legacyFieldSlug = lang === "fr" ? cat.slugFr : cat.slugEn;
      const localizedSlug =
        directSlug ||
        legacyFieldSlug ||
        getLocalizedField(cat.slug, lang) ||
        (typeof cat.slug === "string" ? cat.slug : undefined);

      if (localizedSlug === categorySlug) {
        return { category: cat, shouldRedirect: false };
      }

      const allCatSlugs = [
        ...(typeof cat.slug === "object" && cat.slug
          ? Object.values(cat.slug)
          : []),
        cat.slugEn,
        cat.slugFr,
        cat.id,
      ].filter((s): s is string => typeof s === "string" && Boolean(s));

      if (
        allCatSlugs.includes(categorySlug) &&
        localizedSlug &&
        localizedSlug !== categorySlug
      ) {
        return {
          category: cat,
          correctSlugForLang: localizedSlug,
          shouldRedirect: true,
        };
      }
    }

    return { category: null };
  }
);
