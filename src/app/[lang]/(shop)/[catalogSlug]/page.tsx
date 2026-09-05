import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { adminDb } from "@/lib/firebase-admin";
import { Category, Product } from "@/types/database";
import { ShopCategoryFilter } from "@/components/shop/ShopCategoryFilter";
import { ShopProductCard } from "@/components/shop/ShopProductCard";
import { Metadata } from "next";
import { brandConfig } from "@/config/brand.config";
import { getLocalizedField } from "@/lib/i18n";
import { getStoreSettings } from "@/lib/services/settings";

interface CatalogPageProps {
    params: Promise<{ lang: string; catalogSlug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(props: CatalogPageProps): Promise<Metadata> {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const { lang, catalogSlug } = params;

    const storeSettings = await getStoreSettings();
    const activeCatalogSlug = (storeSettings.catalogSlug || 'shop').toLowerCase();

    if (catalogSlug.toLowerCase() !== activeCatalogSlug) {
        return {};
    }

    const brandName = storeSettings.brandName || brandConfig.identity.name || "Store";
    const rawCatalogDisplayTitle = getLocalizedField(storeSettings.catalogTitle, lang) || (lang === 'fr' ? 'Boutique' : 'Shop');
    const catalogDisplayTitle = rawCatalogDisplayTitle.replace(new RegExp(`\\s*[|\\-]\\s*${brandName}$`, 'i'), '').trim();
    const rawCatalogDesc = getLocalizedField(storeSettings.catalogDescription, lang);
    const catalogDescription = (rawCatalogDesc && rawCatalogDesc.trim().length > 0)
        ? rawCatalogDesc.trim()
        : (lang === 'fr' ? brandConfig.identity.description?.fr : brandConfig.identity.description?.en) || `Browse our complete collection of ${brandName} products.`;
    
    const catalogBannerUrl = storeSettings.catalogBannerUrl || brandConfig.assets?.heroBanner || '';

    const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || brandConfig.identity.url || '';
    const baseUrl = rawBaseUrl.replace(/\/+$/, '');
    const canonicalUrl = `${baseUrl}/${lang}/${activeCatalogSlug}`;

    const categoryQuery = searchParams.category;
    const currentCategorySlug = typeof categoryQuery === 'string' ? categoryQuery : null;

    if (currentCategorySlug) {
        const catSnap = await adminDb.collection('categories').get();
        const categoryDoc = catSnap.docs.find(d => {
            const data = d.data() as Category;
            return getLocalizedField(data.slug, lang) === currentCategorySlug || data.slugEn === currentCategorySlug || data.slugFr === currentCategorySlug;
        });
        
        if (categoryDoc) {
            const category = categoryDoc.data() as Category;
            const catName = getLocalizedField(category.name, lang) || (lang === 'fr' ? category.nameFr : category.nameEn) || '';
            const catIntro = getLocalizedField(category.intro, lang) || (lang === 'fr' ? category.introFr : category.introEn) || '';
            const catDesc = getLocalizedField(category.description, lang) || (lang === 'fr' ? category.descriptionFr : category.descriptionEn) || '';
            const rawCatTitle = catIntro || catName;
            const categoryTitle = rawCatTitle.replace(new RegExp(`\\s*[|\\-]\\s*${brandName}$`, 'i'), '').trim();
            const pageDescription = catDesc || `Explore our ${categoryTitle} products.`;
            const categoryImage = category.imageUrl || catalogBannerUrl;
            const categoryCanonical = `${canonicalUrl}?category=${currentCategorySlug}`;

            return {
                title: categoryTitle,
                description: pageDescription,
                alternates: {
                    canonical: categoryCanonical,
                },
                openGraph: {
                    title: categoryTitle,
                    description: pageDescription,
                    url: categoryCanonical,
                    type: "website",
                    ...(categoryImage ? { images: [categoryImage] } : {}),
                },
                twitter: {
                    card: "summary_large_image",
                    title: categoryTitle,
                    description: pageDescription,
                    ...(categoryImage ? { images: [categoryImage] } : {}),
                },
            };
        }
    }

    return {
        title: catalogDisplayTitle,
        description: catalogDescription,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title: catalogDisplayTitle,
            description: catalogDescription,
            url: canonicalUrl,
            type: "website",
            ...(catalogBannerUrl ? { images: [catalogBannerUrl] } : {}),
        },
        twitter: {
            card: "summary_large_image",
            title: catalogDisplayTitle,
            description: catalogDescription,
            ...(catalogBannerUrl ? { images: [catalogBannerUrl] } : {}),
        },
    };
}

export default async function CatalogPage(props: CatalogPageProps) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const { lang, catalogSlug } = params;

    const storeSettings = await getStoreSettings();
    const activeCatalogSlug = (storeSettings.catalogSlug || 'shop').toLowerCase();

    // Enforce dynamic slug match from Firestore settings
    if (catalogSlug.toLowerCase() !== activeCatalogSlug) {
        notFound();
    }

    // Safety map to convert Firestore Timestamps to strings
    const serializeFirestoreData = (docId: string, data: Record<string, any>) => {
        const result = { ...data, id: docId } as any;
        
        if (result.createdAt) {
            result.createdAt = typeof result.createdAt.toDate === 'function' 
                ? result.createdAt.toDate().toISOString() 
                : new Date(result.createdAt).toISOString();
        } else {
            result.createdAt = null;
        }
        
        if (result.updatedAt) {
            result.updatedAt = typeof result.updatedAt.toDate === 'function' 
                ? result.updatedAt.toDate().toISOString() 
                : new Date(result.updatedAt).toISOString();
        } else {
            result.updatedAt = null;
        }

        return result;
    };

    // Parse the category from search parameters
    const categoryQuery = searchParams.category;
    const currentCategorySlug = typeof categoryQuery === 'string' ? categoryQuery : null;

    // Initiate independent fetch requests concurrently
    const dictPromise = getDictionary(lang as Locale);
    const categoriesPromise = adminDb.collection('categories').orderBy('order', 'asc').get();

    const [dict, categoriesSnapshot] = await Promise.all([
        dictPromise,
        categoriesPromise
    ]);

    const rawCategories = categoriesSnapshot.docs.map(doc => 
        serializeFirestoreData(doc.id, doc.data()) as Category
    );

    const categories = rawCategories.sort((a, b) => {
        const orderDiff = (a.order ?? 0) - (b.order ?? 0);
        if (orderDiff !== 0) return orderDiff;
        const nameA = getLocalizedField(a.name, lang) || (lang === 'fr' ? a.nameFr : a.nameEn) || '';
        const nameB = getLocalizedField(b.name, lang) || (lang === 'fr' ? b.nameFr : b.nameEn) || '';
        return nameA.localeCompare(nameB, lang);
    });

    const catalogTitle = getLocalizedField(storeSettings.catalogTitle, lang) || (lang === 'fr' ? 'Boutique' : 'Shop');
    const catalogBanner = storeSettings.catalogBannerUrl || brandConfig.assets?.heroBanner || '';

    // If a category is selected, find it and fetch its products
    let selectedCategory: Category | null = null;
    let products: Product[] = [];

    if (currentCategorySlug) {
        selectedCategory = categories.find(c => 
            getLocalizedField(c.slug, lang) === currentCategorySlug || 
            (lang === 'fr' ? c.slugFr === currentCategorySlug : c.slugEn === currentCategorySlug)
        ) || null;

        if (selectedCategory) {
            let productsSnapshot;
            try {
                productsSnapshot = await adminDb.collection('products')
                    .where('categoryIds', 'array-contains', selectedCategory.id)
                    .orderBy('order', 'asc')
                    .get();
                if (productsSnapshot.empty) {
                    productsSnapshot = await adminDb.collection('products')
                        .where('categoryIds', 'array-contains', selectedCategory.id)
                        .orderBy('createdAt', 'desc')
                        .get();
                }
            } catch {
                productsSnapshot = await adminDb.collection('products')
                    .where('categoryIds', 'array-contains', selectedCategory.id)
                    .orderBy('createdAt', 'desc')
                    .get();
            }

            const categoryMap = new Map(categories.map(c => [c.id, c]));

            const rawProducts = productsSnapshot.docs.map(doc => {
                const p = serializeFirestoreData(doc.id, doc.data()) as Product;
                const catIds = p.categoryIds || (p.categoryId ? [p.categoryId] : []);
                const assignedCategories = catIds.map(id => categoryMap.get(id)).filter(Boolean) as Category[];
                return {
                    ...p,
                    order: typeof p.order === 'number' ? p.order : 0,
                    categoryIds: catIds,
                    categories: assignedCategories,
                    category: assignedCategories[0] || (p.categoryId ? categoryMap.get(p.categoryId) : null) || null
                };
            });

            products = rawProducts.sort((a, b) => {
                const orderDiff = (a.order ?? 0) - (b.order ?? 0);
                if (orderDiff !== 0) return orderDiff;
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });
        }
    }

    // Determine banner configuration
    const bannerImageUrl = currentCategorySlug
        ? (selectedCategory?.imageUrl || catalogBanner)
        : catalogBanner;

    const bannerTitle = currentCategorySlug
        ? (selectedCategory ? (getLocalizedField(selectedCategory.name, lang) || (lang === 'fr' ? selectedCategory.nameFr : selectedCategory.nameEn)) : catalogTitle)
        : catalogTitle;

    const catalogDescription = getLocalizedField(storeSettings.catalogDescription, lang) || '';

    const bannerSubtitle = currentCategorySlug
        ? (selectedCategory ? (getLocalizedField(selectedCategory.intro, lang) || (lang === 'fr' ? selectedCategory.introFr : selectedCategory.introEn)) : '')
        : catalogDescription;

    return (
        <div className="w-full flex flex-col">
            {/* Edge-to-Edge Illustrated Catalog / Category Banner */}
            <section
                className={`relative w-full min-h-[40vh] sm:min-h-[45vh] md:min-h-[50vh] py-20 sm:py-28 md:py-32 px-6 md:px-16 flex flex-col items-center justify-center text-center bg-center bg-cover bg-no-repeat mb-12 ${
                    bannerImageUrl ? "bg-fixed" : "bg-gradient-to-br from-zinc-800 via-zinc-900 to-black"
                }`}
                style={bannerImageUrl ? { backgroundImage: `url("${bannerImageUrl}")` } : undefined}
            >
                {/* Fallback gradient if no image */}
                {!bannerImageUrl && (
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black" />
                )}

                {/* Dark overlay for readability */}
                <div className="absolute inset-0 bg-black/40 pointer-events-none" />

                {/* Centered Content */}
                <div className="relative z-10 px-6 max-w-4xl mx-auto flex flex-col items-center">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight drop-shadow-md">
                        {bannerTitle}
                    </h1>
                    {bannerSubtitle && (
                        <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto drop-shadow-md text-center">
                            {bannerSubtitle}
                        </p>
                    )}
                </div>
            </section>

            {/* Main Content Container (Categories or Filtered Products) */}
            <div className="container mx-auto px-4 md:px-8">
                {/* Content view based on whether category is selected */}
                {!currentCategorySlug ? (
                    /* Main Catalog "All" View: Category Cards Grid (No products grid) */
                    <div className="space-y-6 mb-16">
                        <div className="flex items-center justify-between border-b pb-4">
                            <h2 className="text-2xl font-bold tracking-tight">
                                {lang === 'fr' ? 'Catégories' : 'Categories'}
                            </h2>
                            <span className="text-sm text-muted-foreground">
                                {categories.length} {lang === 'fr' ? (categories.length > 1 ? 'catégories' : 'catégorie') : (categories.length > 1 ? 'categories' : 'category')}
                            </span>
                        </div>

                        {categories.length === 0 ? (
                            <div className="text-center py-16 text-muted-foreground">
                                {dict.shop?.empty_state || "No categories found."}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                                {categories.map((category) => {
                                    const catSlug = getLocalizedField(category.slug, lang) || (lang === 'fr' ? category.slugFr : category.slugEn) || "";
                                    const catName = getLocalizedField(category.name, lang) || (lang === 'fr' ? category.nameFr : category.nameEn) || "";
                                    const catIntro = getLocalizedField(category.intro, lang) || (lang === 'fr' ? category.introFr : category.introEn) || "";
                                    const catImg = category.imageUrl || brandConfig.assets?.placeholderImage || "";

                                    return (
                                        <Link
                                            key={category.id}
                                            href={`/${lang}/${activeCatalogSlug}?category=${catSlug}`}
                                            className="group relative block aspect-[16/10] sm:aspect-[4/3] rounded-2xl overflow-hidden border bg-muted shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer"
                                        >
                                            {/* Category Background Image */}
                                            {catImg ? (
                                                <Image
                                                    src={catImg}
                                                    alt={catName}
                                                    fill
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900" />
                                            )}

                                            {/* Gradient Overlay for text readability */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 group-hover:from-black/90 transition-colors duration-300" />

                                            {/* Content */}
                                            <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h3 className="text-2xl font-bold tracking-tight group-hover:translate-x-1 transition-transform duration-300">
                                                        {catName}
                                                    </h3>
                                                    <span className="h-9 w-9 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-80 group-hover:opacity-100 group-hover:bg-white group-hover:text-black transition-all duration-300">
                                                        <ArrowRight className="h-4 w-4" />
                                                    </span>
                                                </div>
                                                {catIntro && (
                                                    <p className="mt-2 text-sm text-zinc-300 line-clamp-2">
                                                        {catIntro}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    /* Category Selected View: Tabs + Filtered Products Grid */
                    <div className="space-y-8 mb-16">
                        <ShopCategoryFilter
                            categories={categories}
                            currentCategorySlug={currentCategorySlug}
                            lang={lang}
                            catalogSlug={activeCatalogSlug}
                        />

                        {products.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-lg border border-dashed">
                                <p className="text-muted-foreground text-lg">
                                    {dict.shop?.empty_state || "No products found in this category."}
                                </p>
                            </div>
                        ) : (
                            <div>
                                <h2 className="sr-only">
                                    {dict.shop?.products_list || (lang === 'fr' ? "Liste des produits" : "Products list")}
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {products.map((product) => (
                                        <ShopProductCard
                                            key={product.id}
                                            product={product}
                                            lang={lang}
                                            dict={dict.shop || dict}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
