import { MetadataRoute } from "next";
import { brandConfig } from "@/config/brand.config";
import { getStoreSettings } from "@/lib/services/settings";
import { getLocalizedField } from "@/lib/i18n";
import { adminDb } from "@/lib/firebase-admin";
import { Category, Product, Page } from "@/types/database";
import { SupportedLocale } from "@/schemas/seo";

export const dynamic = "force-dynamic";

interface FirestoreTimestampLike {
  toDate?: () => Date;
}

const SUPPORTED_LOCALES: ReadonlyArray<SupportedLocale> = ["en", "fr"];

const EXCLUDED_SLUGS = new Set([
  "cart",
  "panier",
  "checkout",
  "account",
  "compte",
  "admin",
  "login",
]);

function toDate(timestampOrDate: unknown): Date {
  if (!timestampOrDate) return new Date();
  if (
    typeof timestampOrDate === "object" &&
    timestampOrDate !== null &&
    "toDate" in timestampOrDate &&
    typeof (timestampOrDate as FirestoreTimestampLike).toDate === "function"
  ) {
    return (timestampOrDate as Required<FirestoreTimestampLike>).toDate();
  }
  if (timestampOrDate instanceof Date) {
    return isNaN(timestampOrDate.getTime()) ? new Date() : timestampOrDate;
  }
  if (typeof timestampOrDate === "string" || typeof timestampOrDate === "number") {
    const parsed = new Date(timestampOrDate);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  return new Date();
}

function resolveCatalogSlug(
  rawCatalogSlug: Record<string, string> | string | undefined,
  locale: SupportedLocale
): string {
  const localized = getLocalizedField(rawCatalogSlug, locale);
  if (localized && localized.trim().length > 0) {
    return localized.trim().toLowerCase();
  }
  if (typeof rawCatalogSlug === "string" && rawCatalogSlug.trim().length > 0) {
    return rawCatalogSlug.trim().toLowerCase();
  }
  return locale === "fr" ? "boutique" : "shop";
}

function resolvePageSlug(page: Page, locale: SupportedLocale): string {
  if (typeof page.slug === "object" && page.slug?.[locale]) {
    return page.slug[locale];
  }
  const legacy = locale === "fr" ? page.slug_fr : page.slug_en;
  if (legacy) return legacy;
  const localized = getLocalizedField(page.slug, locale);
  if (localized) return localized;
  return typeof page.slug === "string" ? page.slug : page.id;
}

function resolveCategorySlug(category: Category, locale: SupportedLocale): string {
  if (typeof category.slug === "object" && category.slug?.[locale]) {
    return category.slug[locale];
  }
  const legacy = locale === "fr" ? category.slugFr : category.slugEn;
  if (legacy) return legacy;
  const localized = getLocalizedField(category.slug, locale);
  if (localized) return localized;
  return typeof category.slug === "string" ? category.slug : category.id;
}

function resolveProductSlug(product: Product, locale: SupportedLocale): string {
  if (typeof product.slug === "object" && product.slug?.[locale]) {
    return product.slug[locale];
  }
  const legacy = locale === "fr" ? product.slugFr : product.slugEn;
  if (legacy) return legacy;
  const localized = getLocalizedField(product.slug, locale);
  if (localized) return localized;
  return typeof product.slug === "string" ? product.slug : product.id;
}

function isProductPublishedForLocale(
  product: Product,
  locale: SupportedLocale
): boolean {
  const rawStatus =
    typeof product.status === "object" && product.status?.[locale]
      ? product.status[locale]
      : (locale === "fr" ? product.statusFr : product.statusEn) ||
        getLocalizedField(product.status, locale) ||
        (typeof product.status === "string" ? product.status : "draft");
  const normalized = rawStatus.trim().toLowerCase();
  return normalized === "published" || normalized === "publié";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const rawBaseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    brandConfig.identity.url ||
    "https://gokai.org";
  const siteUrl = rawBaseUrl.replace(/\/+$/, "");

  const entries: MetadataRoute.Sitemap = [];
  const seenUrls = new Set<string>();

  const addEntry = (entry: MetadataRoute.Sitemap[number]) => {
    if (!seenUrls.has(entry.url)) {
      seenUrls.add(entry.url);
      entries.push(entry);
    }
  };

  try {
    const [storeSettings, pagesSnap, categoriesSnap, productsSnap] =
      await Promise.all([
        getStoreSettings(),
        adminDb.collection("pages").get(),
        adminDb.collection("categories").get(),
        adminDb.collection("products").get(),
      ]);

    const pages = pagesSnap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Page, "id">) }))
      .filter((p) => p.status === "published");

    const categories = categoriesSnap.docs
      .map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Category, "id">) }))
      .filter((c) => (c.status ?? "published") === "published");

    const categoryMap = new Map<string, Category>(
      categories.map((c) => [c.id, c])
    );

    const rawProducts = productsSnap.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Product, "id">),
    }));

    const enCatalogSlug = resolveCatalogSlug(storeSettings.catalogSlug, "en");
    const frCatalogSlug = resolveCatalogSlug(storeSettings.catalogSlug, "fr");

    for (const locale of SUPPORTED_LOCALES) {
      const catalogSlug = locale === "fr" ? frCatalogSlug : enCatalogSlug;

      addEntry({
        url: `${siteUrl}/${locale}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1.0,
        alternates: {
          languages: {
            en: `${siteUrl}/en`,
            fr: `${siteUrl}/fr`,
            "x-default": `${siteUrl}/en`,
          },
        },
      });

      addEntry({
        url: `${siteUrl}/${locale}/${catalogSlug}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
        alternates: {
          languages: {
            en: `${siteUrl}/en/${enCatalogSlug}`,
            fr: `${siteUrl}/fr/${frCatalogSlug}`,
            "x-default": `${siteUrl}/en/${enCatalogSlug}`,
          },
        },
      });

      for (const page of pages) {
        const pageSlug = resolvePageSlug(page, locale);
        const enPageSlug = resolvePageSlug(page, "en");
        const frPageSlug = resolvePageSlug(page, "fr");

        if (
          !pageSlug ||
          EXCLUDED_SLUGS.has(pageSlug.toLowerCase()) ||
          EXCLUDED_SLUGS.has(enPageSlug.toLowerCase()) ||
          EXCLUDED_SLUGS.has(frPageSlug.toLowerCase())
        ) {
          continue;
        }

        addEntry({
          url: `${siteUrl}/${locale}/${pageSlug}`,
          lastModified: toDate(page.updatedAt || page.createdAt),
          changeFrequency: "monthly",
          priority: 0.7,
          alternates: {
            languages: {
              en: `${siteUrl}/en/${enPageSlug}`,
              fr: `${siteUrl}/fr/${frPageSlug}`,
              "x-default": `${siteUrl}/en/${enPageSlug}`,
            },
          },
        });
      }

      for (const category of categories) {
        const categorySlug = resolveCategorySlug(category, locale);
        const enCategorySlug = resolveCategorySlug(category, "en");
        const frCategorySlug = resolveCategorySlug(category, "fr");

        if (!categorySlug) continue;

        addEntry({
          url: `${siteUrl}/${locale}/${catalogSlug}/${categorySlug}`,
          lastModified: toDate(category.updatedAt || category.createdAt),
          changeFrequency: "weekly",
          priority: 0.8,
          alternates: {
            languages: {
              en: `${siteUrl}/en/${enCatalogSlug}/${enCategorySlug}`,
              fr: `${siteUrl}/fr/${frCatalogSlug}/${frCategorySlug}`,
              "x-default": `${siteUrl}/en/${enCatalogSlug}/${enCategorySlug}`,
            },
          },
        });
      }

      for (const product of rawProducts) {
        if (!isProductPublishedForLocale(product, locale)) continue;

        const productSlug = resolveProductSlug(product, locale);
        const enProductSlug = resolveProductSlug(product, "en");
        const frProductSlug = resolveProductSlug(product, "fr");

        if (!productSlug) continue;

        const prodCatIds =
          product.categoryIds ||
          (product.categoryId ? [product.categoryId] : []);
        const parentCat = prodCatIds
          .map((id) => categoryMap.get(id))
          .find((cat): cat is Category => Boolean(cat));

        if (!parentCat) continue;

        const parentCatSlug = resolveCategorySlug(parentCat, locale);
        const enParentCatSlug = resolveCategorySlug(parentCat, "en");
        const frParentCatSlug = resolveCategorySlug(parentCat, "fr");

        addEntry({
          url: `${siteUrl}/${locale}/${catalogSlug}/${parentCatSlug}/${productSlug}`,
          lastModified: toDate(product.updatedAt || product.createdAt),
          changeFrequency: "weekly",
          priority: 0.6,
          alternates: {
            languages: {
              en: `${siteUrl}/en/${enCatalogSlug}/${enParentCatSlug}/${enProductSlug}`,
              fr: `${siteUrl}/fr/${frCatalogSlug}/${frParentCatSlug}/${frProductSlug}`,
              "x-default": `${siteUrl}/en/${enCatalogSlug}/${enParentCatSlug}/${enProductSlug}`,
            },
          },
        });
      }
    }
  } catch {
    for (const locale of SUPPORTED_LOCALES) {
      addEntry({
        url: `${siteUrl}/${locale}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1.0,
        alternates: {
          languages: {
            en: `${siteUrl}/en`,
            fr: `${siteUrl}/fr`,
            "x-default": `${siteUrl}/en`,
          },
        },
      });
    }
  }

  return entries;
}
