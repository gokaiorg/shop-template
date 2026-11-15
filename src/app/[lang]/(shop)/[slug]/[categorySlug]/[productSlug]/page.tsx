import { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { Category, Product, ProductMetadata } from "@/types/database";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { Badge } from "@/components/ui/badge";
import { brandConfig, getIsCartEnabled } from "@/config/brand.config";
import { getLocalizedField } from "@/lib/i18n";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { getStoreSettings } from "@/lib/services/settings";
import { ProductPrice } from "@/components/shop/ProductPrice";
import { ProductTranslationSync } from "@/components/shop/ProductTranslationSync";
import { CategoryTranslationSync } from "@/components/shop/CategoryTranslationSync";
import { AdminQuickEdit } from "@/components/admin/AdminQuickEdit";
import { ProductSpecifications } from "@/components/product/ProductSpecifications";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import {
  buildBreadcrumbNode,
  buildJsonLdGraph,
  buildOrganizationNode,
  buildProductNode,
  buildWebsiteNode,
} from "@/lib/seo/json-ld";
import {
  constructLocalizedMetadata,
  resolveOrganizationSeoConfig,
  resolveSiteBaseUrl,
  toAbsoluteUrl,
} from "@/lib/seo/metadata";
import { ProductSeoInput } from "@/schemas/seo";

interface ProductPageProps {
  params: Promise<{
    lang: string;
    slug: string;
    categorySlug: string;
    productSlug: string;
  }>;
}

interface FirestoreDateLike {
  toDate?: () => Date;
}

type ProductWithExtras = Product & {
  sku?: string;
  brand?: string;
  customSpecs?: ProductMetadata;
};

function normalizeProduct(
  docId: string,
  data: Record<string, unknown>
): ProductWithExtras {
  const rawImages =
    data?.images && Array.isArray(data.images) && data.images.length > 0
      ? data.images.filter((img): img is string => typeof img === "string")
      : typeof data?.imageUrl === "string"
        ? [data.imageUrl]
        : [];

  const created = data?.createdAt as
    | FirestoreDateLike
    | string
    | null
    | undefined;
  const updated = data?.updatedAt as
    | FirestoreDateLike
    | string
    | null
    | undefined;

  return {
    ...(data as unknown as ProductWithExtras),
    id: docId,
    images: rawImages,
    imageUrl:
      typeof data?.imageUrl === "string"
        ? data.imageUrl
        : rawImages[0] || null,
    createdAt:
      created &&
      typeof created === "object" &&
      typeof created.toDate === "function"
        ? created.toDate().toISOString()
        : typeof created === "string"
          ? created
          : new Date().toISOString(),
    updatedAt:
      updated &&
      typeof updated === "object" &&
      typeof updated.toDate === "function"
        ? updated.toDate().toISOString()
        : typeof updated === "string"
          ? updated
          : new Date().toISOString(),
  };
}

interface ProductLookupResult {
  product: ProductWithExtras | null;
  correctSlugForLang?: string;
  shouldRedirect?: boolean;
}

async function lookupProductBySlug(
  lang: string,
  slug: string
): Promise<ProductLookupResult> {
  const snapshot = await adminDb
    .collection("products")
    .where(`slug.${lang}`, "==", slug)
    .limit(1)
    .get();
  if (!snapshot.empty) {
    const doc = snapshot.docs[0];
    return {
      product: normalizeProduct(doc.id, doc.data()),
      shouldRedirect: false,
    };
  }

  const legacyField = lang === "fr" ? "slugFr" : "slugEn";
  const legacySnapshot = await adminDb
    .collection("products")
    .where(legacyField, "==", slug)
    .limit(1)
    .get();
  if (!legacySnapshot.empty) {
    const doc = legacySnapshot.docs[0];
    return {
      product: normalizeProduct(doc.id, doc.data()),
      shouldRedirect: false,
    };
  }

  const allSnapshot = await adminDb.collection("products").get();
  let crossLocaleProduct: ProductWithExtras | null = null;

  for (const doc of allSnapshot.docs) {
    const normalized = normalizeProduct(doc.id, doc.data());
    const localizedSlug =
      getLocalizedField(normalized.slug, lang) ||
      (lang === "fr" ? normalized.slugFr : normalized.slugEn);

    if (localizedSlug === slug) {
      return { product: normalized, shouldRedirect: false };
    }

    const allProductSlugs = [
      ...(typeof normalized.slug === "object" && normalized.slug
        ? Object.values(normalized.slug)
        : []),
      normalized.slugEn,
      normalized.slugFr,
      normalized.id,
    ].filter((s): s is string => typeof s === "string" && Boolean(s));

    if (allProductSlugs.includes(slug) && !crossLocaleProduct) {
      crossLocaleProduct = normalized;
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

function cleanDescription(text?: string | null, maxLength = 160): string {
  if (!text) return "";
  const withoutHtml = text.replace(/<[^>]*>/g, " ");
  const singleLine = withoutHtml
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (singleLine.length <= maxLength) {
    return singleLine;
  }
  return singleLine.slice(0, maxLength).trim();
}

function ensureMinDescription(
  rawText: string,
  fallbackTitle: string,
  categoryName: string,
  brandName: string
): string {
  const cleaned = cleanDescription(rawText, 5000);
  if (cleaned.length >= 20) {
    return cleaned;
  }
  const composed = `${fallbackTitle} - ${categoryName} by ${brandName}. High quality solution and professional service.`;
  return composed.length >= 20 ? composed : composed.padEnd(25, ".");
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { lang, slug, categorySlug, productSlug } = await params;
  const [lookupResult, storeSettings] = await Promise.all([
    lookupProductBySlug(lang, productSlug),
    getStoreSettings(),
  ]);

  const localizedCatalogSlug = (
    getLocalizedField(storeSettings.catalogSlug, lang) ||
    (typeof storeSettings.catalogSlug === "string"
      ? storeSettings.catalogSlug
      : "shop")
  ).toLowerCase();

  if (slug.toLowerCase() !== localizedCatalogSlug) {
    return {};
  }

  const { product, shouldRedirect } = lookupResult;
  if (!product || shouldRedirect) {
    return { title: "Product Not Found" };
  }

  const brandName =
    storeSettings.brandName || brandConfig.identity.name || "Store";
  const productName =
    getLocalizedField(product.name, lang) ||
    (lang === "fr" ? product.nameFr : product.nameEn) ||
    "Product";
  const catalogName =
    getLocalizedField(storeSettings.catalogTitle, lang) ||
    (lang === "fr" ? "Boutique" : "Shop");

  const rawIntro =
    getLocalizedField(product.intro, lang) ||
    (lang === "fr" ? product.introFr : product.introEn);
  const rawDescription =
    getLocalizedField(product.description, lang) ||
    (lang === "fr" ? product.descriptionFr : product.descriptionEn) ||
    "";
  const chosenDescriptionText =
    rawIntro && rawIntro.trim().length > 0 ? rawIntro : rawDescription;

  const catIds =
    product.categoryIds || (product.categoryId ? [product.categoryId] : []);
  let categoryData: Category | null = product.category || null;
  if (!categoryData && catIds.length > 0) {
    try {
      const catDoc = await adminDb
        .collection("categories")
        .doc(catIds[0])
        .get();
      if (catDoc.exists) {
        categoryData = catDoc.data() as Category;
      }
    } catch {
      categoryData = null;
    }
  }
  if (!categoryData && categorySlug) {
    try {
      const snap = await adminDb
        .collection("categories")
        .where(`slug.${lang}`, "==", categorySlug)
        .limit(1)
        .get();
      if (!snap.empty) {
        categoryData = snap.docs[0].data() as Category;
      }
    } catch {
      categoryData = null;
    }
  }

  const categoryName = categoryData
    ? getLocalizedField(categoryData.name, lang) ||
      (lang === "fr" ? categoryData.nameFr : categoryData.nameEn) ||
      categorySlug
    : categorySlug;

  const formattedDescription = ensureMinDescription(
    chosenDescriptionText,
    productName,
    categoryName,
    brandName
  ).slice(0, 160);

  const titleParts = [productName, categoryName, catalogName]
    .filter(Boolean)
    .join(" ");
  const formattedTitle = titleParts
    ? `${titleParts} | ${brandName}`
    : `${productName} | ${brandName}`;

  const firstImage =
    product.images && product.images.length > 0
      ? product.images[0]
      : product.imageUrl || undefined;

  const baseUrl = resolveSiteBaseUrl(
    process.env.NEXT_PUBLIC_APP_URL || brandConfig.identity.url
  );

  const enCatalogSlug =
    (typeof storeSettings.catalogSlug === "object"
      ? storeSettings.catalogSlug?.en
      : "shop") || "shop";
  const frCatalogSlug =
    (typeof storeSettings.catalogSlug === "object"
      ? storeSettings.catalogSlug?.fr
      : "boutique") || "boutique";

  const enCatSlug =
    categoryData &&
    typeof categoryData.slug === "object" &&
    categoryData.slug?.en
      ? categoryData.slug.en
      : categoryData?.slugEn ||
        getLocalizedField(categoryData?.slug, "en") ||
        categorySlug;
  const frCatSlug =
    categoryData &&
    typeof categoryData.slug === "object" &&
    categoryData.slug?.fr
      ? categoryData.slug.fr
      : categoryData?.slugFr ||
        getLocalizedField(categoryData?.slug, "fr") ||
        categorySlug;

  const enProdSlug =
    typeof product.slug === "object" && product.slug?.en
      ? product.slug.en
      : product.slugEn ||
        getLocalizedField(product.slug, "en") ||
        productSlug;
  const frProdSlug =
    typeof product.slug === "object" && product.slug?.fr
      ? product.slug.fr
      : product.slugFr ||
        getLocalizedField(product.slug, "fr") ||
        productSlug;

  const artistOrVendor = product.artist?.trim() || product.vendor?.trim();
  const authorName = artistOrVendor || brandName;

  const baseMetadata = constructLocalizedMetadata({
    locale: lang,
    title: formattedTitle,
    description: formattedDescription,
    siteName: brandName,
    baseUrl,
    canonicalPath: `/${lang}/${localizedCatalogSlug}/${categorySlug}/${productSlug}`,
    languages: {
      en: `${baseUrl}/en/${enCatalogSlug}/${enCatSlug}/${enProdSlug}`,
      fr: `${baseUrl}/fr/${frCatalogSlug}/${frCatSlug}/${frProdSlug}`,
      "x-default": `${baseUrl}/en/${enCatalogSlug}/${enCatSlug}/${enProdSlug}`,
    },
    imageUrl: firstImage,
    type: "website",
    absoluteTitle: true,
  });

  return {
    ...baseMetadata,
    authors: [{ name: authorName }],
    creator: authorName,
    other: {
      "og:type": "product",
    },
  };
}

export default async function SiloProductPage({ params }: ProductPageProps) {
  const { lang, slug, categorySlug, productSlug } = await params;

  const storeSettings = await getStoreSettings();
  const localizedCatalogSlug = (
    getLocalizedField(storeSettings.catalogSlug, lang) ||
    (typeof storeSettings.catalogSlug === "string"
      ? storeSettings.catalogSlug
      : "shop")
  ).toLowerCase();

  if (slug.toLowerCase() !== localizedCatalogSlug) {
    notFound();
  }

  const { product, shouldRedirect, correctSlugForLang } =
    await lookupProductBySlug(lang, productSlug);

  if (!product) {
    notFound();
  }

  const catIds =
    product.categoryIds || (product.categoryId ? [product.categoryId] : []);
  let assignedCategories: Category[] = [];
  if (catIds.length > 0) {
    const catDocs = await Promise.all(
      catIds.map((id) => adminDb.collection("categories").doc(id).get())
    );
    assignedCategories = catDocs
      .filter((d) => d.exists)
      .map((d) => ({ id: d.id, ...(d.data() as Omit<Category, "id">) }))
      .filter((c) => (c.status ?? "published") === "published");
  }

  const activeCategory =
    assignedCategories.find((cat) => {
      const locSlug =
        typeof cat.slug === "object" && cat.slug?.[lang]
          ? cat.slug[lang]
          : (lang === "fr" ? cat.slugFr : cat.slugEn) ||
            getLocalizedField(cat.slug, lang);
      return (
        locSlug === categorySlug ||
        cat.slug?.[lang] === categorySlug ||
        cat.slugEn === categorySlug ||
        cat.slugFr === categorySlug ||
        cat.id === categorySlug
      );
    }) ||
    assignedCategories[0] ||
    null;

  const primaryCatSlug = activeCategory
    ? getLocalizedField(activeCategory.slug, lang) ||
      (lang === "fr" ? activeCategory.slugFr : activeCategory.slugEn) ||
      activeCategory.id
    : categorySlug;

  if (shouldRedirect && correctSlugForLang) {
    permanentRedirect(
      `/${lang}/${localizedCatalogSlug}/${primaryCatSlug}/${correctSlugForLang}`
    );
  }

  if (activeCategory && categorySlug !== primaryCatSlug) {
    permanentRedirect(
      `/${lang}/${localizedCatalogSlug}/${primaryCatSlug}/${productSlug}`
    );
  }

  const productSlugMap: Record<string, string> | null = (() => {
    const map: Record<string, string> = {};
    if (typeof product.slug === "object" && product.slug !== null) {
      Object.entries(product.slug).forEach(([loc, s]) => {
        if (typeof s === "string" && s) map[loc] = s;
      });
    } else if (typeof product.slug === "string" && product.slug) {
      map["en"] = product.slug;
    }
    if (product.slugEn && !map["en"]) map["en"] = product.slugEn;
    if (product.slugFr && !map["fr"]) map["fr"] = product.slugFr;
    return Object.keys(map).length > 0 ? map : null;
  })();

  const categorySlugMap: Record<string, string> | null = activeCategory
    ? (() => {
        const map: Record<string, string> = {};
        if (
          typeof activeCategory.slug === "object" &&
          activeCategory.slug !== null
        ) {
          Object.entries(activeCategory.slug).forEach(([loc, s]) => {
            if (typeof s === "string" && s) map[loc] = s;
          });
        } else if (
          typeof activeCategory.slug === "string" &&
          activeCategory.slug
        ) {
          map["en"] = activeCategory.slug;
        }
        if (activeCategory.slugEn && !map["en"]) {
          map["en"] = activeCategory.slugEn;
        }
        if (activeCategory.slugFr && !map["fr"]) {
          map["fr"] = activeCategory.slugFr;
        }
        return Object.keys(map).length > 0 ? map : null;
      })()
    : null;

  const dict = await getDictionary(lang as Locale);
  const shopDict = dict.shop;
  const rawCurrency = storeSettings.defaultCurrency || "EUR";
  const currency = rawCurrency.length === 3 ? rawCurrency.toUpperCase() : "EUR";

  const title =
    getLocalizedField(product.name, lang) ||
    (lang === "fr" ? product.nameFr : product.nameEn) ||
    "Product";
  const description =
    getLocalizedField(product.description, lang) ||
    (lang === "fr" ? product.descriptionFr : product.descriptionEn) ||
    "";
  const intro =
    getLocalizedField(product.intro, lang) ||
    (lang === "fr" ? product.introFr : product.introEn) ||
    "";

  const productImages =
    product.images && product.images.length > 0
      ? product.images
      : product.imageUrl
        ? [product.imageUrl]
        : [];
  const images =
    productImages.length > 0
      ? productImages
      : [brandConfig.assets.placeholderImage];
  const isCartEnabled =
    typeof storeSettings.cartEnabled === "boolean"
      ? storeSettings.cartEnabled
      : getIsCartEnabled();
  const isOutOfStock = (product.stock ?? 0) <= 0;

  const baseUrl = resolveSiteBaseUrl(
    process.env.NEXT_PUBLIC_APP_URL || brandConfig.identity.url
  );
  const catalogName =
    getLocalizedField(storeSettings.catalogTitle, lang) ||
    (lang === "fr" ? "Boutique" : "Shop");
  const categoryName = activeCategory
    ? getLocalizedField(activeCategory.name, lang) ||
      (lang === "fr" ? activeCategory.nameFr : activeCategory.nameEn) ||
      primaryCatSlug
    : primaryCatSlug;

  const absoluteImages = images.map((img) => toAbsoluteUrl(baseUrl, img));
  const brandName =
    product.brand ||
    product.vendor ||
    storeSettings.brandName ||
    brandConfig.identity.name ||
    "Store";
  const sku = product.sku || product.id;

  const productDescription = ensureMinDescription(
    description || intro || title,
    title,
    categoryName,
    brandName
  );

  const productUrl = `${baseUrl}/${lang}/${localizedCatalogSlug}/${primaryCatSlug}/${productSlug}`;

  const validFromDate =
    typeof product.createdAt === "string" && product.createdAt.length > 0
      ? new Date(product.createdAt).toISOString()
      : new Date().toISOString();
  const nextYearDate = new Date();
  nextYearDate.setFullYear(nextYearDate.getFullYear() + 1);
  const priceValidUntilDate = nextYearDate.toISOString();

  const productSeoInput: ProductSeoInput = {
    id: product.id,
    sku,
    name: title,
    description: productDescription,
    url: productUrl,
    images: absoluteImages,
    brandName,
    categoryName,
    offer: {
      price: Math.max(0, product.price ?? 0),
      priceCurrency: currency,
      availability: isOutOfStock ? "OutOfStock" : "InStock",
      validFrom: validFromDate,
      priceValidUntil: priceValidUntilDate,
      isDigitalOrService: false,
      shippingRate: 0,
      returnDays: 14,
    },
  };

  const productBreadcrumbs = [
    {
      name: lang === "fr" ? "Accueil" : "Home",
      url: `${baseUrl}/${lang}`,
    },
    {
      name: catalogName,
      url: `${baseUrl}/${lang}/${localizedCatalogSlug}`,
    },
    {
      name: categoryName,
      url: `${baseUrl}/${lang}/${localizedCatalogSlug}/${primaryCatSlug}`,
    },
    {
      name: title,
      url: productUrl,
    },
  ];

  const orgConfig = resolveOrganizationSeoConfig(storeSettings, baseUrl);
  const graphNodes: Array<Record<string, unknown>> = [
    buildOrganizationNode(orgConfig),
    buildWebsiteNode(baseUrl, brandName, lang),
    buildBreadcrumbNode(productUrl, productBreadcrumbs),
    buildProductNode(productSeoInput, baseUrl),
  ];

  const jsonLdGraph = buildJsonLdGraph(graphNodes);
  const specs = product.metadata || product.customSpecs;

  return (
    <div className="w-full max-w-7xl mx-auto px-6 md:px-16 py-8">
      <JsonLdScript data={jsonLdGraph} />
      <ProductTranslationSync productSlugs={productSlugMap} />
      <CategoryTranslationSync categorySlugs={categorySlugMap} />

      <section
        aria-labelledby="product-overview-heading"
        className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start"
      >
        <div className="w-full">
          <ProductGallery
            images={images}
            title={title}
            isOutOfStock={isOutOfStock}
            enableZoom={activeCategory?.enableProductZoom !== false}
          />
          <div className="hidden md:block">
            <ProductSpecifications
              specifications={specs}
              lang={lang}
              id="desktop-product-specifications"
            />
          </div>
        </div>

        <div className="flex flex-col space-y-6">
          <div>
            <div className="flex items-center justify-between gap-4 mb-3">
              {assignedCategories.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {assignedCategories.map((cat) => {
                    const catName =
                      getLocalizedField(cat.name, lang) ||
                      (lang === "fr" ? cat.nameFr : cat.nameEn);
                    const catSlug =
                      typeof cat.slug === "object" && cat.slug?.[lang]
                        ? cat.slug[lang]
                        : (lang === "fr" ? cat.slugFr : cat.slugEn) ||
                          getLocalizedField(cat.slug, lang) ||
                          (typeof cat.slug === "string" ? cat.slug : cat.id);
                    return (
                      <Link
                        key={cat.id}
                        href={`/${lang}/${localizedCatalogSlug}/${catSlug}`}
                      >
                        <Badge
                          variant="secondary"
                          className="hover:bg-primary/85 hover:text-primary-foreground transition-colors text-xs font-normal cursor-pointer"
                        >
                          {catName}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div />
              )}
              <AdminQuickEdit
                entityType="product"
                id={product.id}
                locale={lang}
              />
            </div>
            <h1
              id="product-overview-heading"
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground"
            >
              {title}
            </h1>
            {!product.hidePrice && (
              <div className="mt-4">
                <ProductPrice
                  price={product.price}
                  locale={lang}
                  className="text-3xl font-semibold text-foreground"
                />
              </div>
            )}
          </div>

          {intro && (
            <p className="text-lg text-muted-foreground font-medium -mt-2 leading-relaxed">
              {intro}
            </p>
          )}

          {isCartEnabled && !product.hidePrice && (
            <div className="pt-2 pb-2">
              <AddToCartButton
                product={product}
                lang={lang}
                label={shopDict.add_to_cart || "Add to cart"}
                title={title}
                size="lg"
                className="w-full md:w-auto px-12"
              />
            </div>
          )}

          {description && (
            <section
              aria-labelledby="product-details-heading"
              className="pt-6 border-t"
            >
              <h2 id="product-details-heading" className="sr-only">
                {lang === "fr" ? "Détails du produit" : "Product Details"}
              </h2>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {description}
                </p>
              </div>
            </section>
          )}

          <div className="block md:hidden mt-8 pt-8 border-t border-zinc-200/80 dark:border-zinc-800">
            <ProductSpecifications
              specifications={specs}
              lang={lang}
              id="mobile-product-specifications"
              className="mt-0"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
