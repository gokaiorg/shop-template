import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getDictionary } from "@/lib/dictionaries";
import { getDefaultLocale, getSupportedLocales, Locale } from "@/app/i18n-config";
import { Category, Product } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { CategoryPillsNav } from "@/components/shop/CategoryPillsNav";
import { ShopProductCard } from "@/components/shop/ShopProductCard";
import { FeaturedCategories } from "@/components/shop/FeaturedCategories";
import { CmsBlockRenderer } from "@/components/shop/CmsBlockRenderer";
import { HeroHeader } from "@/components/shop/HeroHeader";
import { AdminQuickEdit } from "@/components/admin/AdminQuickEdit";
import { brandConfig, getActiveBrand } from "@/config/brand.config";
import { getStoreSettings } from "@/lib/services/settings";
import { getAllPublishedCategories } from "@/lib/services/categories";
import {
  getAllProducts,
  isProductInStock,
} from "@/lib/services/products";
import {
  getGooglePlaceReviews,
  GooglePlaceDetailsResponse,
} from "@/lib/services/google-places";
import { getLocalizedField } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import {
  buildBreadcrumbNode,
  buildFaqNode,
  buildJsonLdGraph,
  buildOrganizationNode,
  buildWebsiteNode,
  FaqItemInput,
} from "@/lib/seo/json-ld";
import {
  constructLocalizedMetadata,
  resolveOrganizationSeoConfig,
  resolveSiteBaseUrl,
} from "@/lib/seo/metadata";

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]*>?/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function fetchInitialReviews(
  lang: string
): Promise<GooglePlaceDetailsResponse | null> {
  const settings = await getStoreSettings();
  const isEnabled = Boolean(
    settings.reviewSection?.enabled ||
      settings.reviewSection?.status === "active"
  );
  const placeId = (settings.reviewSection?.placeId || "").trim();
  if (!isEnabled || !placeId) {
    return null;
  }
  return getGooglePlaceReviews(placeId, lang);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const [{ lang }, storeSettings] = await Promise.all([
    params,
    getStoreSettings(),
  ]);
  const rawBrand = getActiveBrand();
  const brandName =
    storeSettings.brandName || rawBrand.identity.name || "Shop Template";
  const baseUrl = resolveSiteBaseUrl(
    process.env.NEXT_PUBLIC_APP_URL || rawBrand.identity.url
  );

  const rawTitle =
    getLocalizedField(storeSettings.heroTitle, lang) ||
    storeSettings.brandName ||
    rawBrand.identity.name ||
    "Home";
  const title = stripHtml(rawTitle);

  const rawDescription =
    getLocalizedField(storeSettings.heroDescription, lang) ||
    getLocalizedField(storeSettings.footerDescription, lang) ||
    `${brandName} - ${title}`;
  const description = stripHtml(rawDescription);

  const heroImage =
    storeSettings.heroBackgroundImageUrl ||
    rawBrand.assets?.heroBanner ||
    rawBrand.assets?.placeholderImage ||
    undefined;

  const supportedLocales = getSupportedLocales();
  const defaultLocale = getDefaultLocale();
  const languageAlternates = Object.fromEntries([
    ...supportedLocales.map((locale) => [locale, `${baseUrl}/${locale}`]),
    ["x-default", `${baseUrl}/${defaultLocale}`],
  ]);

  return constructLocalizedMetadata({
    locale: lang,
    title,
    description,
    siteName: brandName,
    baseUrl,
    canonicalPath: `/${lang}`,
    languages: languageAlternates,
    imageUrl: heroImage,
    type: "website",
  });
}

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  const [dict, publishedCategories, cachedProducts, storeSettings, reviewsResult] =
    await Promise.all([
      getDictionary(lang as Locale),
      getAllPublishedCategories(),
      getAllProducts(),
      getStoreSettings(),
      fetchInitialReviews(lang),
    ]);

  const categories = [...publishedCategories].sort((a, b) => {
    const orderDiff = (a.order ?? 0) - (b.order ?? 0);
    if (orderDiff !== 0) return orderDiff;
    const nameA =
      getLocalizedField(a.name, lang) ||
      (lang === "fr" ? a.nameFr : a.nameEn) ||
      "";
    const nameB =
      getLocalizedField(b.name, lang) ||
      (lang === "fr" ? b.nameFr : b.nameEn) ||
      "";
    return nameA.localeCompare(nameB, lang);
  });

  const featuredCategories = categories.slice(0, 4);
  const categoryMap = new Map<string, Category>(
    categories.map((c) => [c.id, c])
  );

  const rawProducts: Product[] = cachedProducts.map((item) => {
    const rawCatIds =
      item.categoryIds && item.categoryIds.length > 0
        ? item.categoryIds
        : item.categoryId
          ? [item.categoryId]
          : [];
    const assignedCats = rawCatIds
      .map((id) => categoryMap.get(id))
      .filter((c): c is Category => Boolean(c));

    return {
      ...item,
      order: typeof item.order === "number" ? item.order : 0,
      categoryIds: rawCatIds,
      categories: assignedCats,
      category:
        assignedCats[0] ||
        (item.categoryId ? categoryMap.get(item.categoryId) || null : null),
    };
  });

  const inStockProducts = rawProducts.filter(isProductInStock);

  const allProducts = inStockProducts.sort((a, b) => {
    const orderDiff = (a.order ?? 0) - (b.order ?? 0);
    if (orderDiff !== 0) return orderDiff;
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  const isFr = lang === "fr";
  const homeDict = dict.home || {};
  const shopDict = dict.shop || {};

  const heroTitle =
    getLocalizedField(storeSettings.heroTitle, lang) ||
    storeSettings.brandName ||
    homeDict.hero_title ||
    "Shop Template";
  const heroSubtitle =
    getLocalizedField(storeSettings.heroDescription, lang) ||
    homeDict.hero_subtitle ||
    "";

  const heroBackgroundImageUrl = storeSettings.heroBackgroundImageUrl;
  const categoriesTitle = getLocalizedField(storeSettings.categoriesTitle, lang);
  const categoriesSubtitle = getLocalizedField(
    storeSettings.categoriesSubtitle,
    lang
  );
  const productsTitle =
    getLocalizedField(storeSettings.productsTitle, lang) || "Solutions";
  const productsSubtitle = getLocalizedField(
    storeSettings.productsSubtitle,
    lang
  );
  const catalogSlug =
    getLocalizedField(storeSettings.catalogSlug, lang) ||
    (typeof storeSettings.catalogSlug === "string"
      ? storeSettings.catalogSlug
      : "shop");

  const baseUrl = resolveSiteBaseUrl(
    process.env.NEXT_PUBLIC_APP_URL || brandConfig.identity.url
  );
  const brandName =
    storeSettings.brandName || brandConfig.identity.name || "Store";
  const pageUrl = `${baseUrl}/${lang}`;

  const rawFaqItems = storeSettings.faqSection?.items || [];
  const faqEnabled = Boolean(
    storeSettings.faqSection?.enabled ||
      storeSettings.faqSection?.status === "active"
  );
  const localizedFaqs: FaqItemInput[] = faqEnabled
    ? rawFaqItems
        .map((item) => ({
          question: getLocalizedField(item.question, lang).trim(),
          answer: getLocalizedField(item.answer, lang).trim(),
        }))
        .filter((item) => item.question.length > 0 && item.answer.length > 0)
    : [];

  const orgConfig = resolveOrganizationSeoConfig(storeSettings, baseUrl, {
    locale: lang,
    ratingValue: reviewsResult?.success ? reviewsResult.rating : undefined,
    reviewCount: reviewsResult?.success
      ? reviewsResult.userRatingsTotal
      : undefined,
  });
  const graphNodes: Array<Record<string, unknown>> = [
    buildOrganizationNode(orgConfig),
    buildWebsiteNode(baseUrl, brandName, lang),
    buildBreadcrumbNode(pageUrl, [
      {
        name: isFr ? "Accueil" : "Home",
        url: pageUrl,
      },
    ]),
  ];

  if (localizedFaqs.length > 0) {
    graphNodes.push(buildFaqNode(pageUrl, localizedFaqs));
  }

  const jsonLdGraph = buildJsonLdGraph(graphNodes);

  const hasAbout = Boolean(
    storeSettings.aboutSection?.enabled &&
      (storeSettings.aboutSection?.title ||
        storeSettings.aboutSection?.description ||
        (storeSettings.aboutSection?.images &&
          storeSettings.aboutSection.images.length > 0))
  );
  const hasReviews = Boolean(
    (storeSettings.reviewSection?.enabled ||
      storeSettings.reviewSection?.status === "active") &&
      storeSettings.reviewSection?.placeId?.trim()
  );
  const hasContact = Boolean(storeSettings.contactSection?.enabled);
  const hasCmsBlocks =
    hasAbout || hasReviews || localizedFaqs.length > 0 || hasContact;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black w-full">
      <JsonLdScript data={jsonLdGraph} />

      <HeroHeader
        title={heroTitle}
        subtitle={heroSubtitle}
        backgroundImageUrl={heroBackgroundImageUrl}
        ctaLabel={
          homeDict.explore_all || (isFr ? "Découvrir tout" : "Explore All")
        }
        ctaHref={`/${lang}/${catalogSlug}`}
        lang={lang}
      />

      {featuredCategories.length >= 2 && (
        <section
          aria-labelledby="featured-categories-heading"
          className="w-full"
        >
          {!categoriesTitle && (
            <h2 id="featured-categories-heading" className="sr-only">
              {isFr ? "Nos Univers" : "Explore Collections"}
            </h2>
          )}
          <FeaturedCategories
            categories={featuredCategories}
            locale={lang}
            catalogSlug={catalogSlug}
            title={categoriesTitle}
            subtitle={categoriesSubtitle}
          />
        </section>
      )}

      <section
        aria-labelledby="featured-solutions-heading"
        className={cn(
          "w-full max-w-7xl mx-auto pt-16 px-6 md:px-16",
          hasCmsBlocks ? "pb-8 md:pb-12" : "pb-28 md:pb-40"
        )}
      >
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h2
              id="featured-solutions-heading"
              className="text-3xl md:text-4xl font-semibold tracking-tight"
            >
              {productsTitle}
            </h2>
            <AdminQuickEdit
              entityType="settings"
              href={`/${lang}/admin/settings#products-title`}
              locale={lang}
              variant="badge"
            />
          </div>
          {productsSubtitle && (
            <p className="mt-2 text-base text-muted-foreground leading-relaxed">
              {productsSubtitle}
            </p>
          )}
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            {shopDict.empty_state || "No products available"}
          </div>
        ) : (
          <Tabs defaultValue={categories[0]?.id} className="w-full">
            <CategoryPillsNav
              categories={categories}
              lang={lang}
              asTabs={true}
            />

            {categories.map((category) => {
              const categoryProducts = allProducts.filter(
                (p) =>
                  p.categoryIds?.includes(category.id) ||
                  p.categoryId === category.id
              );
              const catSlug =
                getLocalizedField(category.slug, lang) ||
                (isFr ? category.slugFr : category.slugEn);
              const categoryHref = catSlug
                ? `/${lang}/${catalogSlug}/${catSlug}`
                : `/${lang}/${catalogSlug}`;

              return (
                <TabsContent
                  key={category.id}
                  value={category.id}
                  className="mt-0 outline-none focus-visible:ring-0"
                >
                  <ul
                    role="list"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                  >
                    {categoryProducts.length === 0 ? (
                      <li className="col-span-full text-center py-12 text-muted-foreground list-none">
                        {shopDict.empty_state || "No products in this category"}
                      </li>
                    ) : (
                      categoryProducts.slice(0, 6).map((product) => (
                        <li key={product.id} className="flex flex-col">
                          <ShopProductCard
                            product={product}
                            lang={lang}
                            dict={shopDict}
                            categorySlug={catSlug}
                          />
                        </li>
                      ))
                    )}
                  </ul>
                  {categoryProducts.length > 0 && (
                    <div className="mt-12 flex justify-center">
                      <Button
                        asChild
                        variant="outline"
                        size="lg"
                        className="rounded-2xl px-8 shadow-soft transition-all cursor-pointer group"
                      >
                        <Link href={categoryHref}>
                          <span>
                            {homeDict.view_all ||
                              (isFr ? "Voir tout" : "View All")}
                          </span>
                          <ArrowRight
                            className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1 text-muted-foreground group-hover:text-primary"
                            aria-hidden="true"
                          />
                        </Link>
                      </Button>
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </section>

      <CmsBlockRenderer
        storeSettings={storeSettings}
        lang={lang}
        dict={dict}
        className="mt-20 md:mt-32"
        initialReviews={reviewsResult?.reviews}
        initialRating={reviewsResult?.rating ?? null}
        initialTotalRatings={reviewsResult?.userRatingsTotal ?? null}
      />
    </div>
  );
}
