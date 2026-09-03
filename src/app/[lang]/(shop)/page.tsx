import { adminDb } from "@/lib/firebase-admin";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { Category, Product } from "@/types/database";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { CategoryPillsNav } from "@/components/shop/CategoryPillsNav";
import { ShopProductCard } from "@/components/shop/ShopProductCard";
import { ArrowRight } from "lucide-react";
import { brandConfig } from "@/config/brand.config";
import { getStoreSettings } from "@/lib/services/settings";
import { getLocalizedField } from "@/lib/i18n";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // Fetch dictionary, categories, products, and store settings in parallel
  const [dict, categoriesSnap, productsSnap, storeSettings] = await Promise.all([
    getDictionary(lang as Locale),
    adminDb.collection("categories").get(),
    adminDb.collection("products")
      .orderBy("createdAt", "desc")
      .get(),
    getStoreSettings()
  ]);

  const categories = categoriesSnap.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || null),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data.updatedAt || null)
    };
  }) as Category[];

  const categoryMap = new Map(categories.map(c => [c.id, c]));

  const allProducts = productsSnap.docs.map(doc => {
    const data = doc.data();
    const catIds = data.categoryIds || (data.categoryId ? [data.categoryId] : []);
    const assignedCats = catIds.map((id: string) => categoryMap.get(id)).filter(Boolean) as Category[];
    return {
      ...data,
      id: doc.id,
      categoryIds: catIds,
      categories: assignedCats,
      category: assignedCats[0] || (data.categoryId ? categoryMap.get(data.categoryId) : null) || null,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || null),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data.updatedAt || null)
    };
  }) as Product[];

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
  const catalogName = getLocalizedField(storeSettings.catalogTitle, lang) || (isFr ? "Boutique" : "Shop");
  const catalogSlug = storeSettings.catalogSlug || "shop";
  const shopByCategoryTitle = isFr ? `${catalogName} par catégorie` : `${catalogName}`;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black w-full">
      {/* Hero Section with Dynamic Parallax Background & Glassmorphic Card */}
      <section
        className={`relative flex w-full flex-col items-center justify-center min-h-[60vh] py-24 sm:py-32 px-6 md:px-16 text-center bg-center bg-cover bg-no-repeat ${
          heroBackgroundImageUrl ? "bg-fixed" : "bg-white dark:bg-black"
        }`}
        style={heroBackgroundImageUrl ? { backgroundImage: `url("${heroBackgroundImageUrl}")` } : undefined}
      >
        {/* Subtle contrast overlay when background image is present */}
        {heroBackgroundImageUrl && (
          <div className="absolute inset-0 bg-black/20 dark:bg-black/40 pointer-events-none" />
        )}

        {/* Glassmorphic Central Wrapper for optimal text contrast and readability */}
        <div className="relative z-10 bg-white/70 dark:bg-black/70 backdrop-blur-md p-8 sm:p-12 rounded-2xl max-w-3xl mx-auto shadow-xl border border-white/20 dark:border-white/10 flex flex-col items-center">
          <h1 className="max-w-2xl text-4xl md:text-5xl font-bold tracking-tight text-black dark:text-zinc-50 mb-6">
            {heroTitle}
          </h1>
          <p className="max-w-2xl text-lg md:text-xl text-zinc-700 dark:text-zinc-300 mb-10">
            {heroSubtitle}
          </p>
          <Link href={`/${lang}/${catalogSlug}`}>
            <Button size="lg" className="rounded-full px-8 shadow-md">
              {homeDict.explore_all || "Explore All"}
            </Button>
          </Link>
        </div>
      </section>

      {/* Unified Shop Section */}
      <section className="w-full max-w-7xl mx-auto py-16 px-6 md:px-16 mb-16">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-3xl font-bold tracking-tight">{shopByCategoryTitle}</h2>
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
            const categoryHref = catSlug ? `/${lang}/${catalogSlug}?category=${catSlug}` : `/${lang}/${catalogSlug}`;

            return (
              <TabsContent key={category.id} value={category.id} className="mt-0 outline-none focus-visible:ring-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {categoryProducts.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      {shopDict.empty_state || "No products in this category"}
                    </div>
                  ) : (
                    categoryProducts.slice(0, 4).map((product) => (
                      <ShopProductCard key={product.id} product={product} lang={lang} dict={shopDict} />
                    ))
                  )}
                </div>
                {categoryProducts.length > 0 && (
                  <div className="mt-12 flex justify-center">
                    <Link href={categoryHref}>
                      <Button variant="outline" size="lg" className="rounded-full px-8 shadow-xs hover:bg-primary hover:text-primary-foreground transition-all cursor-pointer group">
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
    </div>
  );
}
