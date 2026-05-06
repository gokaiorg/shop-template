import { adminDb } from "@/lib/firebase-admin";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { Category, Product } from "@/types/database";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShopProductCard } from "@/components/shop/ShopProductCard";

export default async function Home({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  
  // Fetch dictionary, categories, and products in parallel
  const [dict, categoriesSnap, productsSnap] = await Promise.all([
    getDictionary(lang as Locale),
    adminDb.collection("categories").get(),
    adminDb.collection("products")
      .orderBy("createdAt", "desc")
      .get()
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

  const allProducts = productsSnap.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      id: doc.id,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || null),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data.updatedAt || null)
    };
  }) as Product[];

  const isFr = lang === "fr";
  const homeDict = dict.home;
  const shopDict = dict.shop;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 font-sans dark:bg-black w-full">
      {/* Hero Section */}
      <section className="flex w-full flex-col items-center justify-center py-24 px-6 md:px-16 bg-white dark:bg-black text-center">
        <h1 className="max-w-2xl text-4xl md:text-5xl font-bold tracking-tight text-black dark:text-zinc-50 mb-6">
          {homeDict.hero_title}
        </h1>
        <p className="max-w-2xl text-lg md:text-xl text-zinc-600 dark:text-zinc-400 mb-10">
          {homeDict.hero_subtitle}
        </p>
        <Link href={`/${lang}/shop`}>
          <Button size="lg" className="rounded-full px-8">
            {homeDict.explore_all}
          </Button>
        </Link>
      </section>

      {/* Unified Shop Section */}
      <section className="w-full max-w-7xl mx-auto py-16 px-6 md:px-16 mb-16">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-3xl font-bold tracking-tight">{homeDict.shop_by_category}</h2>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <div className="w-full overflow-x-auto pb-4 mb-4 scrollbar-hide">
            <TabsList className="inline-flex h-10 items-center justify-start sm:justify-center rounded-md bg-muted p-1 text-muted-foreground w-max min-w-full">
              <TabsTrigger value="all" className="min-w-[100px]">
                {isFr ? "Tout" : "All"}
              </TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id} className="min-w-[100px]">
                  {isFr ? category.nameFr : category.nameEn}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-0 outline-none focus-visible:ring-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {allProducts.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  {shopDict.empty_state}
                </div>
              ) : (
                allProducts.map((product) => (
                  <ShopProductCard key={product.id} product={product} lang={lang} dict={shopDict} />
                ))
              )}
            </div>
          </TabsContent>

          {categories.map((category) => {
            const categoryProducts = allProducts.filter(p => p.categoryId === category.id);
            return (
              <TabsContent key={category.id} value={category.id} className="mt-0 outline-none focus-visible:ring-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {categoryProducts.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      {shopDict.empty_state}
                    </div>
                  ) : (
                    categoryProducts.map((product) => (
                      <ShopProductCard key={product.id} product={product} lang={lang} dict={shopDict} />
                    ))
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </section>
    </div>
  );
}
