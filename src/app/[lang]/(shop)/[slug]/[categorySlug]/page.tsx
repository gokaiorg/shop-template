import { notFound, permanentRedirect } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";

import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { adminDb } from "@/lib/firebase-admin";
import { Category, Product } from "@/types/database";
import { CategoryProductGrid } from "@/components/shop/CategoryProductGrid";
import { CategoryTranslationSync } from "@/components/shop/CategoryTranslationSync";
import { brandConfig } from "@/config/brand.config";
import { getLocalizedField } from "@/lib/i18n";
import { getStoreSettings } from "@/lib/services/settings";
import { AdminQuickEdit, AdminEditBadge } from "@/components/admin/AdminQuickEdit";
import { CategoryJsonLd } from "@/components/seo/JsonLd";

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
    const categoryName = getLocalizedField(category.name, lang) || (lang === "fr" ? category.nameFr : category.nameEn) || "";
    const catalogName = getLocalizedField(storeSettings.catalogTitle, lang) || (lang === "fr" ? "Boutique" : "Shop");

    // Dynamic SEO title: prioritize localized intro, fallback to category name (+ catalog)
    const localizedIntro = (
        getLocalizedField(category.intro, lang) ||
        (lang === "fr" ? category.introFr : category.introEn) ||
        (typeof category.intro === "string" ? category.intro : "") ||
        ""
    ).trim();
    const defaultTitle = [categoryName, catalogName].filter(Boolean).join(" ") || categoryName;
    const seoTitle = localizedIntro || defaultTitle;

    const catDesc = getLocalizedField(category.description, lang) || (lang === "fr" ? category.descriptionFr : category.descriptionEn) || "";
    const formattedDescription = catDesc || localizedIntro || (lang === "fr" ? `Découvrez nos produits ${categoryName}.` : `Explore our ${categoryName} products.`);
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
        title: seoTitle,
        description: formattedDescription,
        alternates: {
            canonical: categoryCanonical,
            languages: languagesAlternate,
        },
        openGraph: {
            title: seoTitle,
            description: formattedDescription,
            url: categoryCanonical,
            type: "website",
            ...(categoryImage ? { images: [categoryImage] } : {}),
        },
        twitter: {
            card: "summary_large_image",
            title: seoTitle,
            description: formattedDescription,
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
    const enableProductZoom = category.enableProductZoom !== false;

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
    const brandName = storeSettings.brandName || brandConfig.identity.name || "Store";

    const categoryProductsList = products.map((p) => {
        const pName = getLocalizedField(p.name, lang) || (lang === "fr" ? p.nameFr : p.nameEn) || p.id;
        const pSlug = (typeof p.slug === "object" && p.slug?.[lang]) ? p.slug[lang] : (lang === "fr" ? p.slugFr : p.slugEn) || p.id;
        const pUrl = `${baseUrl}/${lang}/${localizedCatalogSlug}/${categorySlug}/${pSlug}`;
        const rawImage = (p.images && p.images.length > 0) ? p.images[0] : (p.imageUrl || undefined);
        const pImage = rawImage ? (rawImage.startsWith("http") ? rawImage : `${baseUrl}${rawImage.startsWith("/") ? "" : "/"}${rawImage}`) : undefined;
        const pDesc = getLocalizedField(p.description, lang) || (lang === "fr" ? p.descriptionFr : p.descriptionEn) || undefined;
        const pSku = (p as any).sku || p.id;
        return {
            name: pName,
            url: pUrl,
            image: pImage,
            description: pDesc,
            price: p.price,
            priceCurrency: storeSettings.defaultCurrency || "EUR",
            sku: pSku,
            brandName,
        };
    });

    const categoryBreadcrumbs = [
        {
            name: lang === "fr" ? "Accueil" : "Home",
            url: `${baseUrl}/${lang}`,
        },
        {
            name: catalogName,
            url: `${baseUrl}/${lang}/${localizedCatalogSlug}`,
        },
        {
            name: bannerTitle,
            url: `${baseUrl}/${lang}/${localizedCatalogSlug}/${categorySlug}`,
        },
    ];

    return (
        <>
            <CategoryJsonLd
                categoryName={bannerTitle}
                categoryUrl={`${baseUrl}/${lang}/${localizedCatalogSlug}/${categorySlug}`}
                categoryDescription={bannerSubtitle}
                products={categoryProductsList}
                breadcrumbs={categoryBreadcrumbs}
                brandName={brandName}
            />
            <CategoryTranslationSync categorySlugs={Object.keys(categorySlugMap).length > 0 ? categorySlugMap : null} />

            <div className="w-full flex flex-col">
                {/* Edge-to-Edge Category Banner */}
                <section className="relative isolate w-full min-h-[40vh] sm:min-h-[45vh] md:min-h-[50vh] py-20 sm:py-28 md:py-32 px-6 md:px-16 flex flex-col items-center justify-center text-center overflow-hidden mb-12">
                    <AdminEditBadge href={`/admin/categories/${category.id}/edit`} locale={lang} className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20" />
                    {bannerImageUrl ? (
                        <Image
                            src={bannerImageUrl}
                            alt={bannerTitle || "Category Banner"}
                            fill
                            priority
                            unoptimized
                            sizes="100vw"
                            className="object-cover pointer-events-none"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black z-0" />
                    )}
                    <div className="absolute inset-0 bg-black/40 pointer-events-none z-[1]" />

                    <div className="relative z-10 px-6 max-w-4xl mx-auto flex flex-col items-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight drop-shadow-md">
                            {bannerTitle}
                        </h1>
                        {bannerSubtitle && (
                            <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto drop-shadow-md text-center">
                                {bannerSubtitle}
                            </p>
                        )}
                    </div>
                </section>

                {/* Categories Navigation, Filter Pills, Sort & Products Grid */}
                <div className="w-full max-w-7xl mx-auto px-6 md:px-16 mb-16">
                    <CategoryProductGrid
                        products={products}
                        categories={categories}
                        currentCategorySlug={categorySlug}
                        catalogSlug={localizedCatalogSlug}
                        initialHideSoldOut={Boolean(category.hideSoldOutByDefault)}
                        lang={lang}
                        dict={dict}
                        categorySlug={categorySlug}
                    />
                </div>
            </div>
        </>
    );
}
