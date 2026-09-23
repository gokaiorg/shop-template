import type { Metadata } from "next";
import { adminDb } from "@/lib/firebase-admin";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { Category, Product } from "@/types/database";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { CategoryPillsNav } from "@/components/shop/CategoryPillsNav";
import { ShopProductCard } from "@/components/shop/ShopProductCard";
import { FeaturedCategories } from "@/components/shop/FeaturedCategories";
import { CmsBlockRenderer } from "@/components/shop/CmsBlockRenderer";
import { HeroHeader } from "@/components/shop/HeroHeader";
import { ArrowRight } from "lucide-react";
import { AdminQuickEdit } from "@/components/admin/AdminQuickEdit";
import { brandConfig, getActiveBrand } from "@/config/brand.config";
import { getStoreSettings } from "@/lib/services/settings";
import { getLocalizedField } from "@/lib/i18n";

import { GlobalJsonLd, CategoryJsonLd } from "@/components/seo/JsonLd";
import { cn } from "@/lib/utils";

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>?/gm, "").replace(/\s+/g, " ").trim();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const storeSettings = await getStoreSettings();
  const rawBrand = getActiveBrand();
  const isFr = lang === "fr";

  const rawTitle = getLocalizedField(storeSettings.heroTitle, lang)
    || getLocalizedField(rawBrand.identity.tagline as any, lang)
    || (isFr ? rawBrand.seo.defaultDescription?.fr : rawBrand.seo.defaultDescription?.en)
    || "Home";
  const title = stripHtml(rawTitle);

  const rawDescription = getLocalizedField(storeSettings.heroDescription, lang)
    || getLocalizedField(storeSettings.footerDescription, lang)
    || getLocalizedField(rawBrand.identity.description as any, lang)
    || (isFr ? rawBrand.seo.defaultDescription?.fr : rawBrand.seo.defaultDescription?.en)
    || "";
  const description = stripHtml(rawDescription);

  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || rawBrand.identity.url || "http://localhost:3000";
  const baseUrl = rawBaseUrl.replace(/\/+$/, "");
  const canonicalUrl = `${baseUrl}/${lang}`;

  const heroImage = storeSettings.heroBackgroundImageUrl
    || rawBrand.assets?.heroBanner
    || rawBrand.assets?.placeholderImage
    || "";
  const absoluteImageUrl = heroImage
    ? (heroImage.startsWith("http://") || heroImage.startsWith("https://")
      ? heroImage
      : `${baseUrl}${heroImage.startsWith("/") ? "" : "/"}${heroImage}`)
    : undefined;

  const languagesAlternate: Record<string, string> = {
    en: `${baseUrl}/en`,
    fr: `${baseUrl}/fr`,
    "x-default": `${baseUrl}/en`,
  };

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: languagesAlternate,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "website",
      ...(absoluteImageUrl ? { images: [{ url: absoluteImageUrl }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(absoluteImageUrl ? { images: [absoluteImageUrl] } : {}),
    },
  };
}

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // Fetch dictionary, categories, products, and store settings in parallel
  const [dict, categoriesSnap, productsSnap, storeSettings] = await Promise.all([
    getDictionary(lang as Locale),
    adminDb.collection("categories").orderBy("order", "asc").get(),
    adminDb.collection("products")
      .orderBy("createdAt", "desc")
      .get(),
    getStoreSettings()
  ]);

  const rawCategories = categoriesSnap.docs
    .map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        order: typeof data.order === 'number' ? data.order : 0,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || null),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data.updatedAt || null)
      } as Category;
    })
    .filter(cat => (cat.status ?? "published") === "published");

  const categories = rawCategories.sort((a, b) => {
    const orderDiff = (a.order ?? 0) - (b.order ?? 0);
    if (orderDiff !== 0) return orderDiff;
    const nameA = getLocalizedField(a.name, lang) || (lang === "fr" ? a.nameFr : a.nameEn) || "";
    const nameB = getLocalizedField(b.name, lang) || (lang === "fr" ? b.nameFr : b.nameEn) || "";
    return nameA.localeCompare(nameB, lang);
  });

  const featuredCategories = categories.slice(0, 4);

  const categoryMap = new Map(categories.map(c => [c.id, c]));

  const rawProducts = productsSnap.docs.map(doc => {
    const data = doc.data();
    const catIds = data.categoryIds || (data.categoryId ? [data.categoryId] : []);
    const assignedCats = catIds.map((id: string) => categoryMap.get(id)).filter(Boolean) as Category[];
    return {
      ...data,
      id: doc.id,
      order: typeof data.order === 'number' ? data.order : 0,
      categoryIds: catIds,
      categories: assignedCats,
      category: assignedCats[0] || (data.categoryId ? categoryMap.get(data.categoryId) : null) || null,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || null),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data.updatedAt || null)
    };
  }) as Product[];

  const allProducts = rawProducts.sort((a, b) => {
    const orderDiff = (a.order ?? 0) - (b.order ?? 0);
    if (orderDiff !== 0) return orderDiff;
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });

  const isFr = lang === "fr";
  const homeDict = dict.home || {};
  const shopDict = dict.shop || {};

  const heroTitle = getLocalizedField(storeSettings.heroTitle, lang)
    || getLocalizedField(brandConfig.identity.tagline as any, lang)
    || homeDict.hero_title;
  const heroSubtitle = getLocalizedField(storeSettings.heroDescription, lang)
    || getLocalizedField(brandConfig.identity.description as any, lang)
    || homeDict.hero_subtitle;

  const heroBackgroundImageUrl = storeSettings.heroBackgroundImageUrl;
  const categoriesTitle = getLocalizedField(storeSettings.categoriesTitle, lang);
  const categoriesSubtitle = getLocalizedField(storeSettings.categoriesSubtitle, lang);
  const productsTitle = getLocalizedField(storeSettings.productsTitle, lang) || "Solutions";
  const productsSubtitle = getLocalizedField(storeSettings.productsSubtitle, lang);
  const catalogName = getLocalizedField(storeSettings.catalogTitle, lang) || (isFr ? "Boutique" : "Shop");
  const catalogSlug = getLocalizedField(storeSettings.catalogSlug, lang) || (typeof storeSettings.catalogSlug === 'string' ? storeSettings.catalogSlug : "shop");
  const shopByCategoryTitle = catalogName;
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || brandConfig.identity.url || "http://localhost:3000";
  const baseUrl = rawBaseUrl.replace(/\/+$/, "");
  const brandName = storeSettings.brandName || brandConfig.identity.name || "Store";
  const logoUrl = storeSettings.logoUrl || brandConfig.assets?.logo?.src || "";
  const absoluteLogoUrl = logoUrl ? (logoUrl.startsWith("http") ? logoUrl : `${baseUrl}${logoUrl.startsWith("/") ? "" : "/"}${logoUrl}`) : undefined;

  const featuredProductsForJsonLd = allProducts.slice(0, 8).map((p) => {
    const pName = getLocalizedField(p.name, lang) || (isFr ? p.nameFr : p.nameEn) || p.id;
    const pSlug = (typeof p.slug === "object" && p.slug?.[lang]) ? p.slug[lang] : (isFr ? p.slugFr : p.slugEn) || p.id;
    const assignedCat = p.categories?.[0] || p.category;
    const catSlug = assignedCat ? (getLocalizedField(assignedCat.slug, lang) || (isFr ? assignedCat.slugFr : assignedCat.slugEn) || assignedCat.id) : "";
    const pUrl = catSlug ? `${baseUrl}/${lang}/${catalogSlug}/${catSlug}/${pSlug}` : `${baseUrl}/${lang}/${catalogSlug}`;
    const rawImg = (p.images && p.images.length > 0) ? p.images[0] : (p.imageUrl || undefined);
    const pImg = rawImg ? (rawImg.startsWith("http") ? rawImg : `${baseUrl}${rawImg.startsWith("/") ? "" : "/"}${rawImg}`) : undefined;
    const pDesc = getLocalizedField(p.description, lang) || (isFr ? p.descriptionFr : p.descriptionEn) || undefined;
    const pSku = (p as any).sku || p.id;

    return {
      name: pName,
      url: pUrl,
      image: pImg,
      description: pDesc,
      price: p.price,
      priceCurrency: storeSettings.defaultCurrency || "EUR",
      sku: pSku,
      brandName,
    };
  });

  // Determine if any CMS block has content and is active
  const hasAbout = Boolean(
    storeSettings.aboutSection?.enabled &&
    (storeSettings.aboutSection?.title ||
     storeSettings.aboutSection?.description ||
     (storeSettings.aboutSection?.images && storeSettings.aboutSection.images.length > 0))
  );
  const hasFaq = Boolean(
    (storeSettings.faqSection?.enabled || storeSettings.faqSection?.status === "active") &&
    Array.isArray(storeSettings.faqSection?.items) &&
    storeSettings.faqSection.items.length > 0
  );
  const hasContact = Boolean(storeSettings.contactSection?.enabled);
  const hasCmsBlocks = hasAbout || hasFaq || hasContact;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black w-full">
      <GlobalJsonLd
        name={brandName}
        url={baseUrl}
        description={heroSubtitle}
        logoUrl={absoluteLogoUrl}
        lang={lang}
        searchActionUrl={catalogSlug}
        socialLinks={storeSettings.socialLinks?.map((s: any) => s.url).filter(Boolean)}
      />
      {featuredProductsForJsonLd.length > 0 && (
        <CategoryJsonLd
          categoryName={shopByCategoryTitle}
          categoryUrl={`${baseUrl}/${lang}`}
          categoryDescription={heroSubtitle}
          products={featuredProductsForJsonLd}
          brandName={brandName}
        />
      )}
      {/* Spatial UI Hero Header */}
      <HeroHeader
        title={heroTitle}
        subtitle={heroSubtitle}
        backgroundImageUrl={heroBackgroundImageUrl}
        ctaLabel={homeDict.explore_all || (isFr ? "Découvrir tout" : "Explore All")}
        ctaHref={`/${lang}/${catalogSlug}`}
        lang={lang}
      />

      {/* Featured Categories Section */}
      {featuredCategories.length >= 2 && (
        <section aria-labelledby="featured-categories-heading" className="w-full">
          {!categoriesTitle && (
            <h2 id="featured-categories-heading" className="sr-only">
              {lang === "fr" ? "Nos Univers" : "Explore Collections"}
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

      {/* Unified Shop Section */}
      <section className={cn(
        "w-full max-w-7xl mx-auto pt-16 px-6 md:px-16",
        hasCmsBlocks ? "pb-8 md:pb-12" : "pb-28 md:pb-40"
      )}>
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight">{productsTitle}</h2>
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
              const categoryProducts = allProducts.filter(p => p.categoryIds?.includes(category.id) || p.categoryId === category.id);
              const catSlug = getLocalizedField(category.slug, lang) || (isFr ? category.slugFr : category.slugEn);
              const categoryHref = catSlug ? `/${lang}/${catalogSlug}/${catSlug}` : `/${lang}/${catalogSlug}`;

              return (
                <TabsContent key={category.id} value={category.id} className="mt-0 outline-none focus-visible:ring-0">
                  <ul role="list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {categoryProducts.length === 0 ? (
                      <li className="col-span-full text-center py-12 text-muted-foreground list-none">
                        {shopDict.empty_state || "No products in this category"}
                      </li>
                    ) : (
                      categoryProducts.slice(0, 6).map((product) => (
                        <li key={product.id} className="flex flex-col">
                          <ShopProductCard product={product} lang={lang} dict={shopDict} categorySlug={catSlug} />
                        </li>
                      ))
                    )}
                  </ul>
                  {categoryProducts.length > 0 && (
                    <div className="mt-12 flex justify-center">
                      <Link href={categoryHref}>
                        <Button variant="outline" size="lg" className="rounded-2xl px-8 shadow-soft hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer group">
                          <span>{homeDict.view_all || (isFr ? "Voir tout" : "View All")}</span>
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </section>

      {/* Dynamic CMS Page Blocks */}
      <CmsBlockRenderer
        storeSettings={storeSettings}
        lang={lang}
        dict={dict}
        className="mt-20 md:mt-32"
      />
    </div>
  );
}
