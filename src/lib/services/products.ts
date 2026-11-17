import { cache } from "react";
import { unstable_cache } from "next/cache";
import { adminDb } from "@/lib/firebase-admin";
import { getActiveBrandKey } from "@/config/brand.config";
import { getLocalizedField } from "@/lib/i18n";
import { Product, Category, ProductMetadata } from "@/types/database";
import { isProductInStock } from "@/lib/products";

export { isProductInStock };

interface TimestampLike {
  toDate?: () => Date;
  _seconds?: number;
}

export type ProductWithExtras = Product & {
  sku?: string;
  brand?: string;
  customSpecs?: ProductMetadata;
};

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

export const serializeProductTimestamp = (ts: unknown): string | null => {
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

function serializeProductDoc(
  docId: string,
  data: Record<string, unknown>
): ProductWithExtras {
  const rawImages =
    Array.isArray(data.images) && data.images.length > 0
      ? data.images.filter((img): img is string => typeof img === "string")
      : typeof data.imageUrl === "string"
        ? [data.imageUrl]
        : [];
  const rawCatIds = Array.isArray(data.categoryIds)
    ? data.categoryIds.filter((id): id is string => typeof id === "string")
    : typeof data.categoryId === "string"
      ? [data.categoryId]
      : [];

  return {
    ...(data as unknown as Omit<ProductWithExtras, "id">),
    id: docId,
    order: typeof data.order === "number" ? data.order : 0,
    categoryIds: rawCatIds,
    images: rawImages,
    imageUrl:
      typeof data.imageUrl === "string" ? data.imageUrl : rawImages[0] || null,
    createdAt: serializeProductTimestamp(data.createdAt) ?? "",
    updatedAt: serializeProductTimestamp(data.updatedAt) ?? "",
  };
}

async function fetchAllProductsFromFirestore(
  _scopeKey: string
): Promise<ProductWithExtras[]> {
  void _scopeKey;
  try {
    const snapshot = await adminDb
      .collection("products")
      .orderBy("createdAt", "desc")
      .get();

    if (snapshot.empty) {
      return [];
    }

    return snapshot.docs.map((doc) =>
      serializeProductDoc(doc.id, (doc.data() || {}) as Record<string, unknown>)
    );
  } catch (error) {
    console.error("[GET_ALL_PRODUCTS_ERROR]", error);
    return [];
  }
}

const getCachedAllProducts = unstable_cache(
  fetchAllProductsFromFirestore,
  ["all-products"],
  {
    revalidate: 300,
    tags: ["products"],
  }
);

export const getAllProducts = cache(async (): Promise<ProductWithExtras[]> => {
  return getCachedAllProducts(getCacheScopeKey());
});

function enrichProductCategories(
  product: ProductWithExtras,
  categoryMap?: Map<string, Category>
): ProductWithExtras {
  if (!categoryMap) return product;
  const catIds =
    product.categoryIds && product.categoryIds.length > 0
      ? product.categoryIds
      : product.categoryId
        ? [product.categoryId]
        : [];
  const assignedCats = catIds
    .map((id) => categoryMap.get(id))
    .filter((c): c is Category => Boolean(c));

  return {
    ...product,
    categories: assignedCats,
    category:
      assignedCats[0] ||
      (product.categoryId ? categoryMap.get(product.categoryId) || null : null),
  };
}

function sortProductsByOrderAndDate(
  products: ProductWithExtras[]
): ProductWithExtras[] {
  return [...products].sort((a, b) => {
    const orderDiff = (a.order ?? 0) - (b.order ?? 0);
    if (orderDiff !== 0) return orderDiff;
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });
}

export const getHomeProducts = cache(
  async (categoryMap?: Map<string, Category>): Promise<Product[]> => {
    const rawProducts = await getAllProducts();
    const enriched = rawProducts.map((p) =>
      enrichProductCategories(p, categoryMap)
    );
    const inStockProducts = enriched.filter(isProductInStock);
    return sortProductsByOrderAndDate(inStockProducts);
  }
);

export const getProductsByCategoryId = cache(
  async (
    categoryId: string,
    categoryMap?: Map<string, Category>
  ): Promise<Product[]> => {
    const rawProducts = await getAllProducts();
    const filtered = rawProducts.filter(
      (p) => p.categoryIds?.includes(categoryId) || p.categoryId === categoryId
    );
    const enriched = filtered.map((p) =>
      enrichProductCategories(p, categoryMap)
    );
    return sortProductsByOrderAndDate(enriched);
  }
);

export interface ProductLookupResult {
  product: ProductWithExtras | null;
  correctSlugForLang?: string;
  shouldRedirect?: boolean;
}

export const lookupProductBySlug = cache(
  async (lang: string, slug: string): Promise<ProductLookupResult> => {
    const products = await getAllProducts();
    let crossLocaleProduct: ProductWithExtras | null = null;

    for (const item of products) {
      const directSlug =
        typeof item.slug === "object" && item.slug?.[lang]
          ? item.slug[lang]
          : undefined;
      const legacySlug = lang === "fr" ? item.slugFr : item.slugEn;
      const localizedSlug =
        directSlug || legacySlug || getLocalizedField(item.slug, lang);

      if (localizedSlug === slug) {
        return { product: item, shouldRedirect: false };
      }

      const allProductSlugs = [
        ...(typeof item.slug === "object" && item.slug
          ? Object.values(item.slug)
          : []),
        item.slugEn,
        item.slugFr,
        item.id,
      ].filter((s): s is string => typeof s === "string" && Boolean(s));

      if (allProductSlugs.includes(slug) && !crossLocaleProduct) {
        crossLocaleProduct = item;
      }
    }

    if (crossLocaleProduct) {
      const correctSlug =
        getLocalizedField(crossLocaleProduct.slug, lang) ||
        (lang === "fr" ? crossLocaleProduct.slugFr : crossLocaleProduct.slugEn);
      if (correctSlug && correctSlug !== slug) {
        return {
          product: crossLocaleProduct,
          correctSlugForLang: correctSlug,
          shouldRedirect: true,
        };
      }
    }

    return { product: null };
  }
);
