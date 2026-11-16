import { MetadataRoute } from "next";
import { getDefaultLocale, getSupportedLocales } from "@/app/i18n-config";
import { brandConfig } from "@/config/brand.config";
import { resolveSiteBaseUrl } from "@/lib/seo/metadata";
import { getStoreSettings } from "@/lib/services/settings";
import { getPublishedPages } from "@/lib/services/pages";
import { getAllPublishedCategories } from "@/lib/services/categories";
import { getAllProducts } from "@/lib/services/products";
import { getLocalizedField } from "@/lib/i18n";
import { Category, Product, Page } from "@/types/database";

export const dynamic = "force-dynamic";

interface FirestoreTimestampLike {
  toDate?: () => Date;
  _seconds?: number;
}

const FALLBACK_STATIC_DATE = new Date("2026-01-01T00:00:00.000Z");

const EXCLUDED_SLUGS = new Set([
  "cart",
  "panier",
  "checkout",
  "account",
  "compte",
  "admin",
  "login",
]);

function normalizeSlugSegment(value: string): string {
  return value.trim().replace(/^\/+|\/+$/g, "");
}

function parseFirestoreDate(timestampOrDate: unknown): Date | null {
  if (!timestampOrDate) return null;
  if (typeof timestampOrDate === "object" && timestampOrDate !== null) {
    const candidate = timestampOrDate as FirestoreTimestampLike;
    if (typeof candidate.toDate === "function") {
      const converted = candidate.toDate();
      return isNaN(converted.getTime()) ? null : converted;
    }
    if (typeof candidate._seconds === "number") {
      const converted = new Date(candidate._seconds * 1000);
      return isNaN(converted.getTime()) ? null : converted;
    }
  }
  if (timestampOrDate instanceof Date) {
    return isNaN(timestampOrDate.getTime()) ? null : timestampOrDate;
  }
  if (
    typeof timestampOrDate === "string" ||
    typeof timestampOrDate === "number"
  ) {
    const parsed = new Date(timestampOrDate);
    return isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function resolveLatestDate(
  candidates: ReadonlyArray<unknown>,
  fallback: Date = FALLBACK_STATIC_DATE
): Date {
  let latestTimestamp = -Infinity;
  for (const candidate of candidates) {
    const parsed = parseFirestoreDate(candidate);
    if (parsed) {
      const time = parsed.getTime();
      if (time > latestTimestamp) {
        latestTimestamp = time;
      }
    }
  }
  return latestTimestamp > -Infinity
    ? new Date(latestTimestamp)
    : fallback;
}

function isPublishedStatusValue(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return (
    normalized === "published" ||
    normalized === "publié" ||
    normalized === "publie"
  );
}

function isDraftStatusValue(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "draft" || normalized === "brouillon";
}

function isPagePublished(page: Page): boolean {
  const rawStatus: unknown = page.status;
  if (!rawStatus) return true;
  if (typeof rawStatus === "string") {
    const normalized = rawStatus.trim().toLowerCase();
    if (normalized.length === 0) return true;
    if (isDraftStatusValue(normalized)) return false;
    return isPublishedStatusValue(normalized) || normalized === "active";
  }
  if (typeof rawStatus === "object" && rawStatus !== null) {
    const values = Object.values(rawStatus as Record<string, unknown>).filter(
      (val): val is string => typeof val === "string" && val.trim().length > 0
    );
    if (values.length === 0) return true;
    if (values.some(isPublishedStatusValue)) return true;
    if (values.every(isDraftStatusValue)) return false;
  }
  return true;
}

function isCategoryPublished(category: Category): boolean {
  const rawStatus: unknown = category.status;
  if (!rawStatus) return true;
  if (typeof rawStatus === "string") {
    const normalized = rawStatus.trim().toLowerCase();
    if (normalized.length === 0) return true;
    if (isDraftStatusValue(normalized)) return false;
    return isPublishedStatusValue(normalized);
  }
  if (typeof rawStatus === "object" && rawStatus !== null) {
    const values = Object.values(rawStatus as Record<string, unknown>).filter(
      (val): val is string => typeof val === "string" && val.trim().length > 0
    );
    if (values.length === 0) return true;
    if (values.some(isPublishedStatusValue)) return true;
    if (values.every(isDraftStatusValue)) return false;
  }
  return true;
}

function isProductPublished(product: Product): boolean {
  const rawStatus: unknown = product.status;
  const candidates: unknown[] = [];
  if (typeof rawStatus === "object" && rawStatus !== null) {
    candidates.push(...Object.values(rawStatus as Record<string, unknown>));
  } else if (typeof rawStatus === "string" && rawStatus.trim().length > 0) {
    candidates.push(rawStatus);
  }
  if (product.statusEn) candidates.push(product.statusEn);
  if (product.statusFr) candidates.push(product.statusFr);

  const nonEmpty = candidates.filter(
    (val): val is string => typeof val === "string" && val.trim().length > 0
  );

  if (nonEmpty.length === 0) return true;
  if (nonEmpty.some(isPublishedStatusValue)) return true;
  if (nonEmpty.every(isDraftStatusValue)) return false;
  return true;
}

function isProductPublishedForLocale(
  product: Product,
  locale: string
): boolean {
  const rawStatus: unknown = product.status;
  if (typeof rawStatus === "object" && rawStatus !== null) {
    const map = rawStatus as Record<string, unknown>;
    if (locale in map) {
      if (isDraftStatusValue(map[locale])) return false;
      if (isPublishedStatusValue(map[locale])) return true;
    }
  } else if (typeof rawStatus === "string" && isDraftStatusValue(rawStatus)) {
    return false;
  }
  const legacyStatus = locale === "fr" ? product.statusFr : product.statusEn;
  if (isDraftStatusValue(legacyStatus)) return false;
  return isProductPublished(product);
}

function resolveCatalogSlug(
  rawCatalogSlug: Record<string, string> | string | undefined,
  locale: string
): string {
  const localized = getLocalizedField(rawCatalogSlug, locale);
  if (localized && localized.trim().length > 0) {
    return normalizeSlugSegment(localized).toLowerCase();
  }
  if (typeof rawCatalogSlug === "string" && rawCatalogSlug.trim().length > 0) {
    return normalizeSlugSegment(rawCatalogSlug).toLowerCase();
  }
  return locale === "fr" ? "boutique" : "shop";
}

function resolvePageSlug(page: Page, locale: string): string {
  const rawSlug: unknown = page.slug;
  if (typeof rawSlug === "object" && rawSlug !== null) {
    const slugMap = rawSlug as Record<string, string | undefined>;
    const direct = slugMap[locale]?.trim();
    if (direct) return normalizeSlugSegment(direct);
  }
  const legacy = (locale === "fr" ? page.slug_fr : page.slug_en)?.trim();
  if (legacy) return normalizeSlugSegment(legacy);
  const localized = getLocalizedField(page.slug, locale).trim();
  if (localized) return normalizeSlugSegment(localized);
  if (typeof rawSlug === "string" && rawSlug.trim().length > 0) {
    return normalizeSlugSegment(rawSlug);
  }
  const fallbackLegacy = (page.slug_en || page.slug_fr)?.trim();
  return normalizeSlugSegment(fallbackLegacy || page.id.trim());
}

function resolveCategorySlug(category: Category, locale: string): string {
  const rawSlug: unknown = category.slug;
  if (typeof rawSlug === "object" && rawSlug !== null) {
    const slugMap = rawSlug as Record<string, string | undefined>;
    const direct = slugMap[locale]?.trim();
    if (direct) return normalizeSlugSegment(direct);
  }
  const legacy = (locale === "fr" ? category.slugFr : category.slugEn)?.trim();
  if (legacy) return normalizeSlugSegment(legacy);
  const localized = getLocalizedField(category.slug, locale).trim();
  if (localized) return normalizeSlugSegment(localized);
  if (typeof rawSlug === "string" && rawSlug.trim().length > 0) {
    return normalizeSlugSegment(rawSlug);
  }
  const fallbackLegacy = (category.slugEn || category.slugFr)?.trim();
  return fallbackLegacy ? normalizeSlugSegment(fallbackLegacy) : "";
}

function resolveProductSlug(product: Product, locale: string): string {
  const rawSlug: unknown = product.slug;
  if (typeof rawSlug === "object" && rawSlug !== null) {
    const slugMap = rawSlug as Record<string, string | undefined>;
    const direct = slugMap[locale]?.trim();
    if (direct) return normalizeSlugSegment(direct);
  }
  const legacy = (locale === "fr" ? product.slugFr : product.slugEn)?.trim();
  if (legacy) return normalizeSlugSegment(legacy);
  const localized = getLocalizedField(product.slug, locale).trim();
  if (localized) return normalizeSlugSegment(localized);
  if (typeof rawSlug === "string" && rawSlug.trim().length > 0) {
    return normalizeSlugSegment(rawSlug);
  }
  const fallbackLegacy = (product.slugEn || product.slugFr)?.trim();
  return fallbackLegacy ? normalizeSlugSegment(fallbackLegacy) : "";
}

function buildLanguageAlternates(
  siteUrl: string,
  pathByLocale: Record<string, string>,
  defaultLocale: string
): NonNullable<MetadataRoute.Sitemap[number]["alternates"]> {
  const languages: Record<string, string> = {};
  for (const [loc, path] of Object.entries(pathByLocale)) {
    languages[loc] = `${siteUrl}${path}`;
  }
  const defaultPath =
    pathByLocale[defaultLocale] || Object.values(pathByLocale)[0] || "";
  languages["x-default"] = `${siteUrl}${defaultPath}`;
  return { languages };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = resolveSiteBaseUrl(
    process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      brandConfig.identity.url
  );
  const supportedLocales = getSupportedLocales();
  const defaultLocale = getDefaultLocale();

  const entries: MetadataRoute.Sitemap = [];
  const seenUrls = new Set<string>();

  const addEntry = (entry: MetadataRoute.Sitemap[number]) => {
    if (!seenUrls.has(entry.url)) {
      seenUrls.add(entry.url);
      entries.push(entry);
    }
  };

  try {
    const [storeSettings, rawPages, rawCategories, rawProducts] =
      await Promise.all([
        getStoreSettings(),
        getPublishedPages(),
        getAllPublishedCategories(),
        getAllProducts(),
      ]);

    const pages = rawPages.filter(isPagePublished);
    const categories = rawCategories.filter(isCategoryPublished);
    const categoryMap = new Map<string, Category>(
      categories.map((cat) => [cat.id, cat])
    );
    const publishedProducts = rawProducts.filter(isProductPublished);

    const productsByCategoryId = new Map<string, Product[]>();
    for (const product of publishedProducts) {
      const prodCatIds =
        Array.isArray(product.categoryIds) && product.categoryIds.length > 0
          ? product.categoryIds
          : product.categoryId
            ? [product.categoryId]
            : [];
      for (const catId of prodCatIds) {
        const list = productsByCategoryId.get(catId) ?? [];
        list.push(product);
        productsByCategoryId.set(catId, list);
      }
    }

    const homeLastModified = resolveLatestDate([
      storeSettings.updatedAt,
      ...pages.flatMap((p) => [p.updatedAt, p.createdAt]),
      ...categories.flatMap((c) => [c.updatedAt, c.createdAt]),
      ...publishedProducts.flatMap((p) => [p.updatedAt, p.createdAt]),
    ]);

    const catalogLastModified = resolveLatestDate([
      storeSettings.updatedAt,
      ...categories.flatMap((c) => [c.updatedAt, c.createdAt]),
      ...publishedProducts.flatMap((p) => [p.updatedAt, p.createdAt]),
    ]);

    const catalogSlugByLocale: Record<string, string> = {};
    for (const loc of supportedLocales) {
      catalogSlugByLocale[loc] = resolveCatalogSlug(
        storeSettings.catalogSlug,
        loc
      );
    }
    const catalogSlugsSet = new Set(Object.values(catalogSlugByLocale));

    const homePaths = Object.fromEntries(
      supportedLocales.map((loc) => [loc, `/${loc}`])
    );
    const catalogPaths = Object.fromEntries(
      supportedLocales.map((loc) => [loc, `/${loc}/${catalogSlugByLocale[loc]}`])
    );

    for (const locale of supportedLocales) {
      const catalogSlug = catalogSlugByLocale[locale];

      addEntry({
        url: `${siteUrl}/${locale}`,
        lastModified: homeLastModified,
        changeFrequency: "daily",
        priority: 1.0,
        alternates: buildLanguageAlternates(siteUrl, homePaths, defaultLocale),
      });

      addEntry({
        url: `${siteUrl}/${locale}/${catalogSlug}`,
        lastModified: catalogLastModified,
        changeFrequency: "daily",
        priority: 0.9,
        alternates: buildLanguageAlternates(
          siteUrl,
          catalogPaths,
          defaultLocale
        ),
      });

      for (const page of pages) {
        const pageSlug = resolvePageSlug(page, locale);
        if (
          !pageSlug ||
          EXCLUDED_SLUGS.has(pageSlug.toLowerCase()) ||
          catalogSlugsSet.has(pageSlug.toLowerCase())
        ) {
          continue;
        }

        const pagePaths: Record<string, string> = {};
        let hasInvalidAlternate = false;
        for (const loc of supportedLocales) {
          const locSlug = resolvePageSlug(page, loc);
          if (
            !locSlug ||
            EXCLUDED_SLUGS.has(locSlug.toLowerCase()) ||
            catalogSlugsSet.has(locSlug.toLowerCase())
          ) {
            hasInvalidAlternate = true;
            break;
          }
          pagePaths[loc] = `/${loc}/${locSlug}`;
        }
        if (hasInvalidAlternate) continue;

        addEntry({
          url: `${siteUrl}/${locale}/${pageSlug}`,
          lastModified: resolveLatestDate(
            [page.updatedAt, page.createdAt, storeSettings.updatedAt],
            homeLastModified
          ),
          changeFrequency: "monthly",
          priority: 0.7,
          alternates: buildLanguageAlternates(
            siteUrl,
            pagePaths,
            defaultLocale
          ),
        });
      }

      for (const category of categories) {
        const categorySlug = resolveCategorySlug(category, locale);
        if (!categorySlug) continue;

        const categoryPaths: Record<string, string> = {};
        let missingCatSlug = false;
        for (const loc of supportedLocales) {
          const locCatSlug = resolveCategorySlug(category, loc);
          if (!locCatSlug) {
            missingCatSlug = true;
            break;
          }
          categoryPaths[loc] = `/${loc}/${catalogSlugByLocale[loc]}/${locCatSlug}`;
        }
        if (missingCatSlug) continue;

        const categoryProducts = productsByCategoryId.get(category.id) ?? [];

        addEntry({
          url: `${siteUrl}/${locale}/${catalogSlug}/${categorySlug}`,
          lastModified: resolveLatestDate(
            [
              category.updatedAt,
              category.createdAt,
              ...categoryProducts.flatMap((p) => [p.updatedAt, p.createdAt]),
              storeSettings.updatedAt,
            ],
            catalogLastModified
          ),
          changeFrequency: "weekly",
          priority: 0.8,
          alternates: buildLanguageAlternates(
            siteUrl,
            categoryPaths,
            defaultLocale
          ),
        });
      }

      for (const product of publishedProducts) {
        if (!isProductPublishedForLocale(product, locale)) continue;

        const productSlug = resolveProductSlug(product, locale);
        if (!productSlug) continue;

        const prodCatIds =
          Array.isArray(product.categoryIds) && product.categoryIds.length > 0
            ? product.categoryIds
            : product.categoryId
              ? [product.categoryId]
              : [];

        const parentCat = prodCatIds
          .map((id) => categoryMap.get(id))
          .find((cat): cat is Category => Boolean(cat));

        if (!parentCat) continue;

        const parentCatSlug = resolveCategorySlug(parentCat, locale);
        if (!parentCatSlug) continue;

        const productPaths: Record<string, string> = {};
        for (const loc of supportedLocales) {
          if (!isProductPublishedForLocale(product, loc)) continue;
          const locProdSlug = resolveProductSlug(product, loc);
          const locCatSlug = resolveCategorySlug(parentCat, loc);
          if (!locProdSlug || !locCatSlug) continue;
          productPaths[loc] =
            `/${loc}/${catalogSlugByLocale[loc]}/${locCatSlug}/${locProdSlug}`;
        }
        if (!(locale in productPaths)) continue;

        addEntry({
          url: `${siteUrl}/${locale}/${catalogSlug}/${parentCatSlug}/${productSlug}`,
          lastModified: resolveLatestDate(
            [
              product.updatedAt,
              product.createdAt,
              parentCat.updatedAt,
              parentCat.createdAt,
              storeSettings.updatedAt,
            ],
            catalogLastModified
          ),
          changeFrequency: "weekly",
          priority: 0.6,
          alternates: buildLanguageAlternates(
            siteUrl,
            productPaths,
            defaultLocale
          ),
        });
      }
    }
  } catch {
    const homePaths = Object.fromEntries(
      supportedLocales.map((loc) => [loc, `/${loc}`])
    );
    for (const locale of supportedLocales) {
      addEntry({
        url: `${siteUrl}/${locale}`,
        lastModified: FALLBACK_STATIC_DATE,
        changeFrequency: "daily",
        priority: 1.0,
        alternates: buildLanguageAlternates(siteUrl, homePaths, defaultLocale),
      });
    }
  }

  return entries;
}
