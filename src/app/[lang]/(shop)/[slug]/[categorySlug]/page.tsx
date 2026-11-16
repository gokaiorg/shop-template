import { notFound, permanentRedirect } from "next/navigation";
import { Metadata } from "next";
import Image from "next/image";

import { getDictionary } from "@/lib/dictionaries";
import { getDefaultLocale, getSupportedLocales, Locale } from "@/app/i18n-config";
import { CategoryProductGrid } from "@/components/shop/CategoryProductGrid";
import { CategoryTranslationSync } from "@/components/shop/CategoryTranslationSync";
import { brandConfig } from "@/config/brand.config";
import { getLocalizedField } from "@/lib/i18n";
import { getStoreSettings } from "@/lib/services/settings";
import {
    getAllPublishedCategories,
    lookupCategoryBySlug,
} from "@/lib/services/categories";
import {
    getProductsByCategoryId,
    ProductWithExtras,
} from "@/lib/services/products";
import {
    constructLocalizedMetadata,
    resolveSiteBaseUrl,
    toAbsoluteUrl,
} from "@/lib/seo/metadata";
import { normalizeCountryCode } from "@/schemas/seo";
import { AdminEditBadge } from "@/components/admin/AdminEditBadge";
import { CategoryJsonLd } from "@/components/seo/JsonLd";

interface CategoryPageProps {
    params: Promise<{ lang: string; slug: string; categorySlug: string }>;
}

export async function generateMetadata(props: CategoryPageProps): Promise<Metadata> {
    const { lang, slug, categorySlug } = await props.params;
    const [storeSettings, lookupResult] = await Promise.all([
        getStoreSettings(),
        lookupCategoryBySlug(lang, categorySlug),
    ]);

    const localizedCatalogSlug = (
        getLocalizedField(storeSettings.catalogSlug, lang) ||
        (typeof storeSettings.catalogSlug === "string" ? storeSettings.catalogSlug : "shop")
    ).toLowerCase();

    if (slug.toLowerCase() !== localizedCatalogSlug) {
        return {};
    }

    const { category, shouldRedirect } = lookupResult;
    if (!category || shouldRedirect) {
        return {};
    }

    const brandName = storeSettings.brandName || brandConfig.identity.name || "Store";
    const categoryName = getLocalizedField(category.name, lang) || (lang === "fr" ? category.nameFr : category.nameEn) || "";
    const catalogName = getLocalizedField(storeSettings.catalogTitle, lang) || (lang === "fr" ? "Boutique" : "Shop");

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

    const baseUrl = resolveSiteBaseUrl(
        process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || brandConfig.identity.url
    );
    const supportedLocales = getSupportedLocales();
    const defaultLocale = getDefaultLocale();

    const categoryLanguages = Object.fromEntries(
        supportedLocales.map((loc) => {
            const locCatalogSlug =
                (typeof storeSettings.catalogSlug === "object"
                    ? getLocalizedField(storeSettings.catalogSlug, loc)
                    : storeSettings.catalogSlug) ||
                (loc === "fr" ? "boutique" : "shop");
            const fallbackLegacy = loc === "fr" ? category.slugFr : category.slugEn;
            const locCatSlug =
                (typeof category.slug === "object" && category.slug?.[loc]) ||
                fallbackLegacy ||
                getLocalizedField(category.slug, loc) ||
                categorySlug;
            return [loc, `/${loc}/${locCatalogSlug}/${locCatSlug}`];
        })
    );
    categoryLanguages["x-default"] =
        categoryLanguages[defaultLocale] || `/${defaultLocale}/${localizedCatalogSlug}/${categorySlug}`;

    return constructLocalizedMetadata({
        locale: lang,
        title: seoTitle,
        description: formattedDescription,
        siteName: brandName,
        baseUrl,
        canonicalPath: `/${lang}/${localizedCatalogSlug}/${categorySlug}`,
        languages: categoryLanguages,
        imageUrl: categoryImage || undefined,
        type: "website",
    });
}

export default async function CategoryPage(props: CategoryPageProps) {
    const { lang, slug, categorySlug } = await props.params;

    const [storeSettings, lookupResult, publishedCategories, dict] = await Promise.all([
        getStoreSettings(),
        lookupCategoryBySlug(lang, categorySlug),
        getAllPublishedCategories(),
        getDictionary(lang as Locale),
    ]);

    const localizedCatalogSlug = (
        getLocalizedField(storeSettings.catalogSlug, lang) ||
        (typeof storeSettings.catalogSlug === "string" ? storeSettings.catalogSlug : "shop")
    ).toLowerCase();

    if (slug.toLowerCase() !== localizedCatalogSlug) {
        notFound();
    }

    const { category, shouldRedirect, correctSlugForLang } = lookupResult;

    if (shouldRedirect && correctSlugForLang) {
        permanentRedirect(`/${lang}/${localizedCatalogSlug}/${correctSlugForLang}`);
    }

    if (!category) {
        notFound();
    }

    const categories = [...publishedCategories].sort((a, b) => {
        const orderDiff = (a.order ?? 0) - (b.order ?? 0);
        if (orderDiff !== 0) return orderDiff;
        const nameA = getLocalizedField(a.name, lang) || (lang === "fr" ? a.nameFr : a.nameEn) || "";
        const nameB = getLocalizedField(b.name, lang) || (lang === "fr" ? b.nameFr : b.nameEn) || "";
        return nameA.localeCompare(nameB, lang);
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const products = await getProductsByCategoryId(category.id, categoryMap);

    const catalogBanner = storeSettings.catalogBannerUrl || brandConfig.assets?.heroBanner || "";
    const bannerImageUrl = category.imageUrl || catalogBanner;
    const bannerTitle = getLocalizedField(category.name, lang) || (lang === "fr" ? category.nameFr : category.nameEn) || "";
    const bannerSubtitle = getLocalizedField(category.intro, lang) || (lang === "fr" ? category.introFr : category.introEn) || "";

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

    const baseUrl = resolveSiteBaseUrl(
        process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || brandConfig.identity.url
    );
    const catalogName = getLocalizedField(storeSettings.catalogTitle, lang) || (lang === "fr" ? "Boutique" : "Shop");
    const brandName = storeSettings.brandName || brandConfig.identity.name || "Store";
    const countryCode = normalizeCountryCode(
        storeSettings.seoCountry || brandConfig.contact?.address?.country
    );

    const categoryProductsList = products.map((p) => {
        const extra = p as ProductWithExtras;
        const pName = getLocalizedField(p.name, lang) || (lang === "fr" ? p.nameFr : p.nameEn) || p.id;
        const pSlug = (typeof p.slug === "object" && p.slug?.[lang]) ? p.slug[lang] : (lang === "fr" ? p.slugFr : p.slugEn) || p.id;
        const pUrl = `${baseUrl}/${lang}/${localizedCatalogSlug}/${categorySlug}/${pSlug}`;
        const rawImage = (p.images && p.images.length > 0) ? p.images[0] : (p.imageUrl || undefined);
        const pImage = rawImage ? toAbsoluteUrl(baseUrl, rawImage) : undefined;
        const pDesc = getLocalizedField(p.description, lang) || (lang === "fr" ? p.descriptionFr : p.descriptionEn) || undefined;
        const pSku = extra.sku || p.id;
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
                countryCode={countryCode}
            />
            <CategoryTranslationSync categorySlugs={Object.keys(categorySlugMap).length > 0 ? categorySlugMap : null} />

            <div className="w-full flex flex-col">
                <section className="relative isolate w-full min-h-[40vh] sm:min-h-[45vh] md:min-h-[50vh] py-20 sm:py-28 md:py-32 px-6 md:px-16 flex flex-col items-center justify-center text-center overflow-hidden mb-12">
                    <AdminEditBadge href={`/admin/categories/${category.id}/edit`} locale={lang} className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20" />
                    {bannerImageUrl ? (
                        <Image
                            src={bannerImageUrl}
                            alt={bannerTitle || "Category Banner"}
                            fill
                            priority
                            fetchPriority="high"
                            quality={75}
                            sizes="100vw"
                            className="object-cover pointer-events-none"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black z-0" />
                    )}
                    <div className="absolute inset-0 bg-black/50 pointer-events-none z-[1]" />

                    <div className="relative z-10 px-6 max-w-4xl mx-auto flex flex-col items-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight drop-shadow-md">
                            {bannerTitle}
                        </h1>
                        {bannerSubtitle && (
                            <p className="mt-4 text-lg text-white/95 max-w-2xl mx-auto drop-shadow-md text-center">
                                {bannerSubtitle}
                            </p>
                        )}
                    </div>
                </section>

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
