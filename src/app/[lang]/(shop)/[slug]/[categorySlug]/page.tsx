import { notFound, permanentRedirect } from "next/navigation";
import { Metadata } from "next";

import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { adminDb } from "@/lib/firebase-admin";
import { Category, Product } from "@/types/database";
import { ShopCategoryFilter } from "@/components/shop/ShopCategoryFilter";
import { ShopProductCard } from "@/components/shop/ShopProductCard";
import { CategoryTranslationSync } from "@/components/shop/CategoryTranslationSync";
import { brandConfig } from "@/config/brand.config";
import { getLocalizedField } from "@/lib/i18n";
import { getStoreSettings } from "@/lib/services/settings";

interface CategoryPageProps {
    params: Promise<{ lang: string; slug: string; categorySlug: string }>;
}

const serializeFirestoreData = (docId: string, data: Record<string, any>) => {
    const result = { ...data, id: docId } as any;
    if (result.createdAt) {
        result.createdAt = typeof result.createdAt.toDate === "function"
            ? result.createdAt.toDate().toISOString()
            : new Date(result.createdAt).toISOString();
    } else {
        result.createdAt = null;
    }
    if (result.updatedAt) {
        result.updatedAt = typeof result.updatedAt.toDate === "function"
            ? result.updatedAt.toDate().toISOString()
            : new Date(result.updatedAt).toISOString();
    } else {
        result.updatedAt = null;
    }
    return result;
};

async function lookupCategory(lang: string, categorySlug: string): Promise<{
    category: Category | null;
    correctSlugForLang?: string;
    shouldRedirect?: boolean;
}> {
    // 1. Exact match on slug.[lang]
    try {
        const snap = await adminDb.collection("categories")
            .where(`slug.${lang}`, "==", categorySlug)
            .get();
        if (!snap.empty) {
            const cat = serializeFirestoreData(snap.docs[0].id, snap.docs[0].data()) as Category;
            if ((cat.status ?? "published") === "published") {
                return { category: cat, shouldRedirect: false };
            }
        }
    } catch (e) {
        console.error("Error querying category by slug in Firestore:", e);
    }

    // 2. Legacy flat slug fields
    const legacyField = lang === "fr" ? "slugFr" : "slugEn";
    try {
        const snap = await adminDb.collection("categories")
            .where(legacyField, "==", categorySlug)
            .get();
        if (!snap.empty) {
            const cat = serializeFirestoreData(snap.docs[0].id, snap.docs[0].data()) as Category;
            if ((cat.status ?? "published") === "published") {
                return { category: cat, shouldRedirect: false };
            }
        }
    } catch (e) {
        console.error("Error querying category by legacy slug:", e);
    }

    // 3. Scan all categories to find matching category in any language (for redirect)
    try {
        const allSnap = await adminDb.collection("categories").get();
        for (const doc of allSnap.docs) {
            const cat = serializeFirestoreData(doc.id, doc.data()) as Category;
            if ((cat.status ?? "published") !== "published") continue;

            const localizedSlug = (typeof cat.slug === "object" && cat.slug?.[lang])
                ? cat.slug[lang]
                : (lang === "fr" ? cat.slugFr : cat.slugEn) ||
                  getLocalizedField(cat.slug, lang) ||
                  (typeof cat.slug === "string" ? cat.slug : null);

            if (localizedSlug === categorySlug) {
                return { category: cat, shouldRedirect: false };
            }

            // Check if slug matches this category in another language
            const allCatSlugs = [
                ...(typeof cat.slug === "object" && cat.slug ? Object.values(cat.slug) : []),
                cat.slugEn,
                cat.slugFr,
                cat.id,
            ].filter((s): s is string => typeof s === "string" && Boolean(s));

            if (allCatSlugs.includes(categorySlug) && localizedSlug && localizedSlug !== categorySlug) {
                return {
                    category: cat,
                    correctSlugForLang: localizedSlug,
                    shouldRedirect: true,
                };
            }
        }
    } catch (e) {
        console.error("Error in fallback category lookup:", e);
    }

    return { category: null };
}

export async function generateMetadata(props: CategoryPageProps): Promise<Metadata> {
    const { lang, slug, categorySlug } = await props.params;
    const storeSettings = await getStoreSettings();

    const localizedCatalogSlug = (
        getLocalizedField(storeSettings.catalogSlug, lang) ||
        (typeof storeSettings.catalogSlug === "string" ? storeSettings.catalogSlug : "shop")
    ).toLowerCase();

    if (slug.toLowerCase() !== localizedCatalogSlug) {
        return {};
    }

    const { category, shouldRedirect } = await lookupCategory(lang, categorySlug);
    if (!category || shouldRedirect) {
        return {};
    }

    const brandName = storeSettings.brandName || brandConfig.identity.name || "Store";
    const catName = getLocalizedField(category.name, lang) || (lang === "fr" ? category.nameFr : category.nameEn) || "";
    const catIntro = getLocalizedField(category.intro, lang) || (lang === "fr" ? category.introFr : category.introEn) || "";
    const catDesc = getLocalizedField(category.description, lang) || (lang === "fr" ? category.descriptionFr : category.descriptionEn) || "";
    const rawCatTitle = catIntro || catName;
    const categoryTitle = rawCatTitle.replace(new RegExp(`\\s*[|\\-]\\s*${brandName}$`, "i"), "").trim();
    const pageDescription = catDesc || `Explore our ${categoryTitle} products.`;
    const catalogBannerUrl = storeSettings.catalogBannerUrl || brandConfig.assets?.heroBanner || "";
    const categoryImage = category.imageUrl || catalogBannerUrl;

    const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || brandConfig.identity.url || "http://localhost:3000";
    const baseUrl = rawBaseUrl.replace(/\/+$/, "");
    const categoryCanonical = `${baseUrl}/${lang}/${localizedCatalogSlug}/${categorySlug}`;
    const enCatalogSlug = (typeof storeSettings.catalogSlug === "object" ? storeSettings.catalogSlug?.en : "shop") || "shop";
    const frCatalogSlug = (typeof storeSettings.catalogSlug === "object" ? storeSettings.catalogSlug?.fr : "boutique") || "boutique";

    const enCatSlug = (typeof category.slug === "object" && category.slug?.en)
        ? category.slug.en
        : (category.slugEn || getLocalizedField(category.slug, "en") || categorySlug);
    const frCatSlug = (typeof category.slug === "object" && category.slug?.fr)
        ? category.slug.fr
        : (category.slugFr || getLocalizedField(category.slug, "fr") || categorySlug);

    const languagesAlternate: Record<string, string> = {
        en: `${baseUrl}/en/${enCatalogSlug}/${enCatSlug}`,
        fr: `${baseUrl}/fr/${frCatalogSlug}/${frCatSlug}`,
        "x-default": `${baseUrl}/en/${enCatalogSlug}/${enCatSlug}`,
    };

    return {
        title: categoryTitle,
        description: pageDescription,
        alternates: {
            canonical: categoryCanonical,
            languages: languagesAlternate,
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

export default async function CategoryPage(props: CategoryPageProps) {
    const { lang, slug, categorySlug } = await props.params;

    const storeSettings = await getStoreSettings();
    const localizedCatalogSlug = (
        getLocalizedField(storeSettings.catalogSlug, lang) ||
        (typeof storeSettings.catalogSlug === "string" ? storeSettings.catalogSlug : "shop")
    ).toLowerCase();

    // Enforce silo hierarchy: slug must match the catalog
    if (slug.toLowerCase() !== localizedCatalogSlug) {
        notFound();
    }

    const { category, shouldRedirect, correctSlugForLang } = await lookupCategory(lang, categorySlug);

    if (shouldRedirect && correctSlugForLang) {
        permanentRedirect(`/${lang}/${localizedCatalogSlug}/${correctSlugForLang}`);
    }

    if (!category) {
        notFound();
    }

    const [dict, categoriesSnapshot] = await Promise.all([
        getDictionary(lang as Locale),
        adminDb.collection("categories").orderBy("order", "asc").get(),
    ]);

    const rawCategories = categoriesSnapshot.docs
        .map((doc) => serializeFirestoreData(doc.id, doc.data()) as Category)
        .filter((c) => (c.status ?? "published") === "published");

    const categories = rawCategories.sort((a, b) => {
        const orderDiff = (a.order ?? 0) - (b.order ?? 0);
        if (orderDiff !== 0) return orderDiff;
        const nameA = getLocalizedField(a.name, lang) || (lang === "fr" ? a.nameFr : a.nameEn) || "";
        const nameB = getLocalizedField(b.name, lang) || (lang === "fr" ? b.nameFr : b.nameEn) || "";
        return nameA.localeCompare(nameB, lang);
    });

    // Fetch products belonging to this category
    let productsSnapshot;
    try {
        productsSnapshot = await adminDb.collection("products")
            .where("categoryIds", "array-contains", category.id)
            .orderBy("order", "asc")
            .get();
        if (productsSnapshot.empty) {
            productsSnapshot = await adminDb.collection("products")
                .where("categoryIds", "array-contains", category.id)
                .orderBy("createdAt", "desc")
                .get();
        }
    } catch {
        productsSnapshot = await adminDb.collection("products")
            .where("categoryIds", "array-contains", category.id)
            .orderBy("createdAt", "desc")
            .get();
    }

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const rawProducts = productsSnapshot.docs.map((doc) => {
        const p = serializeFirestoreData(doc.id, doc.data()) as Product;
        const catIds = p.categoryIds || (p.categoryId ? [p.categoryId] : []);
        const assignedCategories = catIds.map((id) => categoryMap.get(id)).filter(Boolean) as Category[];
        return {
            ...p,
            order: typeof p.order === "number" ? p.order : 0,
            categoryIds: catIds,
            categories: assignedCategories,
            category: assignedCategories[0] || (p.categoryId ? categoryMap.get(p.categoryId) : null) || null,
        };
    });

    const products = rawProducts.sort((a, b) => {
        const orderDiff = (a.order ?? 0) - (b.order ?? 0);
        if (orderDiff !== 0) return orderDiff;
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
    });

    // Banner details
    const catalogBanner = storeSettings.catalogBannerUrl || brandConfig.assets?.heroBanner || "";
    const bannerImageUrl = category.imageUrl || catalogBanner;
    const bannerTitle = getLocalizedField(category.name, lang) || (lang === "fr" ? category.nameFr : category.nameEn) || "";
    const bannerSubtitle = getLocalizedField(category.intro, lang) || (lang === "fr" ? category.introFr : category.introEn) || "";

    // Build multilingual category slug map for LanguageSwitcher
    const categorySlugMap: Record<string, string> = {};
    if (typeof category.slug === "object" && category.slug !== null) {
        Object.entries(category.slug).forEach(([loc, s]) => {
            if (typeof s === "string" && s) categorySlugMap[loc] = s;
        });
    } else if (typeof category.slug === "string" && category.slug) {
        categorySlugMap["en"] = category.slug;
    }
    if (category.slugEn && !categorySlugMap["en"]) categorySlugMap["en"] = category.slugEn;
    if (category.slugFr && !categorySlugMap["fr"]) categorySlugMap["fr"] = category.slugFr;
    const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || brandConfig.identity.url || "http://localhost:3000";
    const baseUrl = rawBaseUrl.replace(/\/+$/, "");
    const catalogName = getLocalizedField(storeSettings.catalogTitle, lang) || (lang === "fr" ? "Boutique" : "Shop");

    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: lang === "fr" ? "Accueil" : "Home",
                item: `${baseUrl}/${lang}`,
            },
            {
                "@type": "ListItem",
                position: 2,
                name: catalogName,
                item: `${baseUrl}/${lang}/${localizedCatalogSlug}`,
            },
            {
                "@type": "ListItem",
                position: 3,
                name: bannerTitle,
                item: `${baseUrl}/${lang}/${localizedCatalogSlug}/${categorySlug}`,
            },
        ],
    };

    return (
        <div className="w-full flex flex-col">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
            <CategoryTranslationSync categorySlugs={Object.keys(categorySlugMap).length > 0 ? categorySlugMap : null} />

            {/* Edge-to-Edge Category Banner */}
            <section
                className={`relative w-full min-h-[40vh] sm:min-h-[45vh] md:min-h-[50vh] py-20 sm:py-28 md:py-32 px-6 md:px-16 flex flex-col items-center justify-center text-center bg-center bg-cover bg-no-repeat mb-12 ${
                    bannerImageUrl ? "bg-fixed" : "bg-gradient-to-br from-zinc-800 via-zinc-900 to-black"
                }`}
                style={bannerImageUrl ? { backgroundImage: `url("${bannerImageUrl}")` } : undefined}
            >
                {!bannerImageUrl && (
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black" />
                )}
                <div className="absolute inset-0 bg-black/40 pointer-events-none" />

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

            {/* Filter Pills & Products Grid */}
            <div className="container mx-auto px-4 md:px-8 mb-16">
                <ShopCategoryFilter
                    categories={categories}
                    currentCategorySlug={categorySlug}
                    lang={lang}
                    catalogSlug={localizedCatalogSlug}
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
                            {dict.shop?.products_list || (lang === "fr" ? "Liste des produits" : "Products list")}
                        </h2>
                        <ul role="list" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {products.map((product) => (
                                <li key={product.id} className="flex flex-col">
                                    <ShopProductCard
                                        product={product}
                                        lang={lang}
                                        dict={dict.shop || dict}
                                        categorySlug={categorySlug}
                                    />
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
