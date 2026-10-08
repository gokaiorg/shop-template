import { notFound, permanentRedirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import parse from "html-react-parser";
import DOMPurify from "isomorphic-dompurify";
import { ArrowRight } from "lucide-react";
import { Metadata } from "next";

import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { adminDb } from "@/lib/firebase-admin";
import { Category } from "@/types/database";
import { brandConfig } from "@/config/brand.config";
import { getLocalizedField } from "@/lib/i18n";
import { getStoreSettings } from "@/lib/services/settings";
import { getPageBySlug } from "@/lib/services/pages";
import { CmsBlockRenderer } from "@/components/shop/CmsBlockRenderer";
import { PageTranslationSync } from "@/components/shop/PageTranslationSync";
import { AdminEditBadge } from "@/components/admin/AdminEditBadge";
import { CatalogJsonLd, PageJsonLd } from "@/components/seo/JsonLd";

interface SlugPageProps {
    params: Promise<{ lang: string; slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

// Convert Firestore Timestamps to strings for safe serialization
const serializeCategoryData = (docId: string, data: Record<string, any>): Category => {
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

export async function generateMetadata(props: SlugPageProps): Promise<Metadata> {
    const { lang, slug } = await props.params;
    const storeSettings = await getStoreSettings();

    const localizedCatalogSlug = (
        getLocalizedField(storeSettings.catalogSlug, lang) ||
        (typeof storeSettings.catalogSlug === "string" ? storeSettings.catalogSlug : "shop")
    ).toLowerCase();

    const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || brandConfig.identity.url || "http://localhost:3000";
    const baseUrl = rawSiteUrl.replace(/\/+$/, "");

    // 1. Is it the Catalog?
    if (slug.toLowerCase() === localizedCatalogSlug) {
        const brandName = storeSettings.brandName || brandConfig.identity.name || "Store";
        const rawCatalogDisplayTitle = getLocalizedField(storeSettings.catalogTitle, lang) || (lang === "fr" ? "Boutique" : "Shop");
        const catalogDisplayTitle = rawCatalogDisplayTitle.replace(new RegExp(`\\s*[|\\-]\\s*${brandName}$`, "i"), "").trim();

        // SEO Title priority: intro if present, otherwise catalog title
        const rawCatalogIntro = getLocalizedField(storeSettings.catalogIntro, lang);
        const catalogIntro = (rawCatalogIntro && rawCatalogIntro.trim().length > 0) ? rawCatalogIntro.trim() : "";
        const seoTitle = catalogIntro || catalogDisplayTitle;

        const rawCatalogDesc = getLocalizedField(storeSettings.catalogDescription, lang);
        const catalogDescription = (rawCatalogDesc && rawCatalogDesc.trim().length > 0)
            ? rawCatalogDesc.trim()
            : getLocalizedField(storeSettings.heroDescription, lang) || `Browse our complete collection of ${brandName} products.`;
        const rawCatalogBannerUrl = storeSettings.catalogBannerUrl || brandConfig.assets?.heroBanner || "/images/og-about.jpg";
        const catalogBannerUrl = rawCatalogBannerUrl.startsWith("http")
            ? rawCatalogBannerUrl
            : `${baseUrl}${rawCatalogBannerUrl.startsWith("/") ? "" : "/"}${rawCatalogBannerUrl}`;
        const canonicalUrl = `${baseUrl}/${lang}/${localizedCatalogSlug}`;

        const enCatalogSlug = (typeof storeSettings.catalogSlug === "object" ? storeSettings.catalogSlug?.en : "shop") || "shop";
        const frCatalogSlug = (typeof storeSettings.catalogSlug === "object" ? storeSettings.catalogSlug?.fr : "boutique") || "boutique";

        const languagesAlternate: Record<string, string> = {
            en: `${baseUrl}/en/${enCatalogSlug}`,
            fr: `${baseUrl}/fr/${frCatalogSlug}`,
            "x-default": `${baseUrl}/en/${enCatalogSlug}`,
        };

        return {
            metadataBase: new URL(baseUrl),
            title: seoTitle,
            description: catalogDescription,
            alternates: {
                canonical: canonicalUrl,
                languages: languagesAlternate,
            },
            openGraph: {
                title: seoTitle,
                description: catalogDescription,
                url: canonicalUrl,
                type: "website",
                siteName: brandName,
                locale: lang === "fr" ? "fr_FR" : "en_US",
                images: [
                    {
                        url: catalogBannerUrl,
                        width: 1200,
                        height: 630,
                        alt: seoTitle,
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: seoTitle,
                description: catalogDescription,
                images: [catalogBannerUrl],
            },
        };
    }

    // 2. Is it a Page?
    const page = await getPageBySlug(slug);
    if (page && page.status !== "draft") {
        const brandName = storeSettings.brandName || brandConfig.identity.name || "Store";
        const displaySlug = getLocalizedField(page.slug, lang) || (typeof page.slug === "string" ? page.slug : page.id);
        const baseTitle = (getLocalizedField(page.title, lang) || (lang === "fr" ? page.title_fr : page.title_en) || displaySlug).trim();
        const pageSubtitle = (getLocalizedField(page.subtitle, lang) || (lang === "fr" ? page.subtitle_fr : page.subtitle_en) || "").trim();

        const customMetaTitle = page.metaTitle?.[lang] || (lang === "fr" ? page.meta_title_fr : page.meta_title_en);
        let formattedPageTitle = "";
        if (customMetaTitle) {
            formattedPageTitle = customMetaTitle.includes(brandName) ? customMetaTitle : `${customMetaTitle} - ${brandName}`;
        } else {
            const combinedTitle = pageSubtitle ? `${baseTitle} ${pageSubtitle}` : baseTitle;
            formattedPageTitle = `${combinedTitle} - ${brandName}`;
        }

        const isAboutPage = slug.toLowerCase() === "about" ||
            slug.toLowerCase() === "a-propos" ||
            page.slug?.en === "about" ||
            page.slug_en === "about" ||
            page.id === "about";

        // Clean text for meta description
        const rawContent = getLocalizedField(page.content, lang) || (lang === "fr" ? page.content_fr : page.content_en) || "";
        const cleanContentText = rawContent
            .replace(/<[^>]*>?/gm, " ")
            .replace(/\s+/g, " ")
            .trim();
        const description = page.metaDescription?.[lang] || page.meta_description_fr || page.meta_description_en || pageSubtitle || cleanContentText.slice(0, 160) || `Learn more about ${baseTitle} at ${brandName}.`;
        const canonicalUrl = `${baseUrl}/${lang}/${displaySlug}`;

        const enPageSlug = (typeof page.slug === "object" && page.slug?.en)
            ? page.slug.en
            : (page.slug_en || (typeof page.slug === "string" ? page.slug : slug));
        const frPageSlug = (typeof page.slug === "object" && page.slug?.fr)
            ? page.slug.fr
            : (page.slug_fr || (typeof page.slug === "string" ? page.slug : slug));

        const languagesAlternate: Record<string, string> = {
            en: `${baseUrl}/en/${enPageSlug}`,
            fr: `${baseUrl}/fr/${frPageSlug}`,
            "x-default": `${baseUrl}/en/${enPageSlug}`,
        };

        // Cover / Social Image for OG and Twitter
        let rawOgImage = page.imageUrl || page.image_url || page.coverImageUrl || page.banner_image;
        if (!rawOgImage && isAboutPage) {
            rawOgImage = storeSettings.aboutSection?.images?.[0] || "/images/og-about.jpg";
        }
        if (!rawOgImage) {
            rawOgImage = storeSettings.catalogBannerUrl || brandConfig.assets?.ogImage || brandConfig.assets?.heroBanner || "/images/og-about.jpg";
        }

        const ogImageUrl = rawOgImage.startsWith("http")
            ? rawOgImage
            : `${baseUrl}${rawOgImage.startsWith("/") ? "" : "/"}${rawOgImage}`;

        return {
            metadataBase: new URL(baseUrl),
            title: {
                absolute: formattedPageTitle,
            },
            description,
            alternates: {
                canonical: canonicalUrl,
                languages: languagesAlternate,
            },
            openGraph: {
                title: formattedPageTitle,
                description,
                url: canonicalUrl,
                siteName: brandName,
                locale: lang === "fr" ? "fr_FR" : "en_US",
                type: isAboutPage ? "article" : "website",
                images: [
                    {
                        url: ogImageUrl,
                        width: 1200,
                        height: 630,
                        alt: formattedPageTitle,
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: formattedPageTitle,
                description,
                images: [ogImageUrl],
            },
        };
    }

    return {};
}

export default async function UnifiedSlugPage(props: SlugPageProps) {
    const { lang, slug } = await props.params;
    const searchParams = await props.searchParams;

    const storeSettings = await getStoreSettings();
    const localizedCatalogSlug = (
        getLocalizedField(storeSettings.catalogSlug, lang) ||
        (typeof storeSettings.catalogSlug === "string" ? storeSettings.catalogSlug : "shop")
    ).toLowerCase();

    // =========================================================================
    // CASE 1: The slug matches the Catalog root
    // =========================================================================
    if (slug.toLowerCase() === localizedCatalogSlug) {
        // SEO: If legacy ?category=xyz is requested, 301 redirect to silo URL /[lang]/[catalogSlug]/xyz
        const categoryQuery = searchParams.category;
        if (typeof categoryQuery === "string" && categoryQuery.trim()) {
            permanentRedirect(`/${lang}/${localizedCatalogSlug}/${categoryQuery.trim()}`);
        }

        const [dict, categoriesSnapshot] = await Promise.all([
            getDictionary(lang as Locale),
            adminDb.collection("categories").orderBy("order", "asc").get(),
        ]);

        const rawCategories = categoriesSnapshot.docs
            .map((doc) => serializeCategoryData(doc.id, doc.data()))
            .filter((c) => (c.status ?? "published") === "published");

        const categories = rawCategories.sort((a, b) => {
            const orderDiff = (a.order ?? 0) - (b.order ?? 0);
            if (orderDiff !== 0) return orderDiff;
            const nameA = getLocalizedField(a.name, lang) || (lang === "fr" ? a.nameFr : a.nameEn) || "";
            const nameB = getLocalizedField(b.name, lang) || (lang === "fr" ? b.nameFr : b.nameEn) || "";
            return nameA.localeCompare(nameB, lang);
        });

        const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || brandConfig.identity.url || "http://localhost:3000";
        const baseUrl = rawBaseUrl.replace(/\/+$/, "");
        const catalogTitle = getLocalizedField(storeSettings.catalogTitle, lang) || (lang === "fr" ? "Boutique" : "Shop");
        const catalogIntro = getLocalizedField(storeSettings.catalogIntro, lang) || "";
        const catalogBanner = storeSettings.catalogBannerUrl || brandConfig.assets?.heroBanner || "";
        const catalogDescription = getLocalizedField(storeSettings.catalogDescription, lang) || "";

        const catalogCategoriesList = categories.map((category) => {
            const catSlug =
                (typeof category.slug === "object" && category.slug?.[lang])
                    ? category.slug[lang]
                    : (lang === "fr" ? category.slugFr : category.slugEn) ||
                    getLocalizedField(category.slug, lang) ||
                    (typeof category.slug === "string" ? category.slug : category.id);
            const catName = getLocalizedField(category.name, lang) || (lang === "fr" ? category.nameFr : category.nameEn) || "";
            const catIntro = getLocalizedField(category.intro, lang) || (lang === "fr" ? category.introFr : category.introEn) || "";
            const catImg = category.imageUrl || brandConfig.assets?.placeholderImage || undefined;

            return {
                name: catName,
                url: `${baseUrl}/${lang}/${localizedCatalogSlug}/${catSlug}`,
                image: catImg,
                description: catIntro,
            };
        });

        const catalogBreadcrumbs = [
            {
                name: lang === "fr" ? "Accueil" : "Home",
                url: `${baseUrl}/${lang}`,
            },
            {
                name: catalogTitle,
                url: `${baseUrl}/${lang}/${localizedCatalogSlug}`,
            },
        ];

        return (
            <div className="w-full flex flex-col">
                <CatalogJsonLd
                    catalogTitle={catalogTitle}
                    catalogUrl={`${baseUrl}/${lang}/${localizedCatalogSlug}`}
                    catalogDescription={catalogDescription || catalogIntro}
                    categories={catalogCategoriesList}
                    breadcrumbs={catalogBreadcrumbs}
                />
                {/* Edge-to-Edge Illustrated Catalog Banner */}
                <section className="relative isolate w-full min-h-[40vh] sm:min-h-[45vh] md:min-h-[50vh] py-20 sm:py-28 md:py-32 px-6 md:px-16 flex flex-col items-center justify-center text-center overflow-hidden mb-8">
                    <AdminEditBadge href="/admin/catalog" locale={lang} className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20" />
                    {catalogBanner ? (
                        <Image
                            src={catalogBanner}
                            alt={catalogTitle || "Catalog Banner"}
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
                            {catalogTitle}
                        </h1>
                        {catalogIntro && (
                            <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto drop-shadow-md text-center">
                                {catalogIntro}
                            </p>
                        )}
                    </div>
                </section>

                {/* Catalog Description Container (Directly below the banner, before categories) */}
                {catalogDescription && (
                    <div className="w-full max-w-4xl mx-auto px-6 md:px-16 mt-2 mb-12 text-center">
                        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                            {catalogDescription}
                        </p>
                    </div>
                )}

                {/* Categories Grid (Clean Silo Links) */}
                <div className="w-full max-w-7xl mx-auto px-6 md:px-16 mb-24 md:mb-36">
                    <div className="flex items-center justify-between border-b pb-4 mb-8">
                        <h2 className="text-2xl font-bold tracking-tight">
                            {lang === "fr" ? "Catégories" : "Categories"}
                        </h2>
                        <span className="text-sm text-muted-foreground">
                            {categories.length}{" "}
                            {lang === "fr"
                                ? categories.length > 1 ? "catégories" : "catégorie"
                                : categories.length > 1 ? "categories" : "category"}
                        </span>
                    </div>

                    {categories.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            {dict.shop?.empty_state || "No categories found."}
                        </div>
                    ) : (
                        <ul role="list" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                            {categories.map((category) => {
                                const catSlug =
                                    (typeof category.slug === "object" && category.slug?.[lang])
                                        ? category.slug[lang]
                                        : (lang === "fr" ? category.slugFr : category.slugEn) ||
                                        getLocalizedField(category.slug, lang) ||
                                        (typeof category.slug === "string" ? category.slug : category.id);
                                const catName = getLocalizedField(category.name, lang) || (lang === "fr" ? category.nameFr : category.nameEn) || "";
                                const catIntro = getLocalizedField(category.intro, lang) || (lang === "fr" ? category.introFr : category.introEn) || "";
                                const catImg = category.imageUrl || brandConfig.assets?.placeholderImage || "";

                                return (
                                    <li key={category.id} className="w-full relative group">
                                        {category.id && (
                                            <AdminEditBadge
                                                href={`/admin/categories/${category.id}/edit`}
                                                locale={lang}
                                            />
                                        )}
                                        <Link
                                            href={`/${lang}/${localizedCatalogSlug}/${catSlug}`}
                                            className="group relative block aspect-[16/10] sm:aspect-[4/3] rounded-2xl overflow-hidden border bg-muted shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer"
                                        >
                                            {catImg ? (
                                                <Image
                                                    src={catImg}
                                                    alt={catName}
                                                    fill
                                                    unoptimized
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900" />
                                            )}

                                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10 group-hover:from-black/90 transition-colors duration-300" />

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
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        );
    }

    // =========================================================================
    // CASE 2: The slug matches a Content Page
    // =========================================================================
    const [page, dict] = await Promise.all([
        getPageBySlug(slug),
        getDictionary(lang as Locale),
    ]);

    if (!page || page.status === "draft") {
        notFound();
    }

    // Cross-locale redirect if accessed with another language's slug for this page
    const expectedPageSlug = getLocalizedField(page.slug, lang) || (typeof page.slug === "string" ? page.slug : page.id);
    if (expectedPageSlug && slug !== expectedPageSlug) {
        const otherSlugs = [
            ...(typeof page.slug === "object" && page.slug ? Object.values(page.slug) : []),
            page.slug_en,
            page.slug_fr,
            page.id,
        ].filter(Boolean);
        if (otherSlugs.includes(slug)) {
            permanentRedirect(`/${lang}/${expectedPageSlug}`);
        }
    }

    const displaySlug = expectedPageSlug;
    const title = getLocalizedField(page.title, lang) || (lang === "fr" ? page.title_fr : page.title_en) || displaySlug;
    const subtitle = getLocalizedField(page.subtitle, lang) || (lang === "fr" ? page.subtitle_fr : page.subtitle_en) || "";
    const content = getLocalizedField(page.content, lang) || (lang === "fr" ? page.content_fr : page.content_en) || "";
    const activeBlocks: string[] = Array.isArray(page.activeBlocks) ? page.activeBlocks : [];

    // Extract multilingual page slugs for language switcher
    const pageSlugMap: Record<string, string> = {};
    if (typeof page.slug === "object" && page.slug !== null) {
        Object.entries(page.slug).forEach(([loc, s]) => {
            if (typeof s === "string" && s) pageSlugMap[loc] = s;
        });
    } else if (typeof page.slug === "string" && page.slug) {
        pageSlugMap["en"] = page.slug;
    }
    if (page.slug_en && !pageSlugMap["en"]) pageSlugMap["en"] = page.slug_en;
    if (page.slug_fr && !pageSlugMap["fr"]) pageSlugMap["fr"] = page.slug_fr;

    const sanitizedContent = DOMPurify.sanitize(content || "<p></p>", {
        USE_PROFILES: { html: true, svg: true },
        ALLOWED_TAGS: [
            "h1", "h2", "h3", "h4", "h5", "h6",
            "p", "div", "span", "strong", "em", "b", "i", "u", "s", "strike",
            "ul", "ol", "li", "blockquote", "a", "img",
            "table", "thead", "tbody", "tr", "th", "td",
            "br", "hr", "code", "pre",
            "iframe", "figure", "figcaption", "section", "article", "header", "footer", "aside", "nav",
            // SVG elements
            "svg", "path", "g", "circle", "rect", "line", "polyline", "polygon", "ellipse",
            "use", "defs", "symbol", "clipPath", "mask", "text", "tspan",
            "linearGradient", "radialGradient", "stop", "pattern", "image",
        ],
        ALLOWED_ATTR: [
            "href", "src", "alt", "title", "class", "className", "style", "id",
            "target", "rel", "width", "height",
            "allowfullscreen", "allowFullScreen", "loading", "referrerpolicy", "referrerPolicy",
            "aria-hidden", "aria-label", "aria-labelledby", "aria-describedby", "role",
            // SVG attributes
            "xmlns", "viewBox", "viewbox", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin",
            "stroke-dasharray", "stroke-dashoffset", "stroke-miterlimit", "stroke-opacity", "fill-opacity",
            "fill-rule", "clip-rule", "clip-path", "d", "cx", "cy", "r", "rx", "ry",
            "x", "y", "x1", "y1", "x2", "y2", "points", "transform", "transform-origin", "opacity",
            "offset", "stop-color", "stop-opacity", "gradientUnits", "gradientTransform", "spreadMethod",
        ],
        ADD_TAGS: ["iframe"],
        ADD_ATTR: ["allowfullscreen", "allowFullScreen", "loading", "referrerpolicy", "referrerPolicy", "style", "target"],
    });

    const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || brandConfig.identity.url || "http://localhost:3000";
    const pageBaseUrl = rawSiteUrl.replace(/\/+$/, "");

    const isAboutPage = slug.toLowerCase() === "about" ||
        slug.toLowerCase() === "a-propos" ||
        page.slug?.en === "about" ||
        page.slug_en === "about" ||
        page.id === "about";

    const schemaType = isAboutPage ? "AboutPage" : "WebPage";

    // Clean text for SEO description
    const cleanContentText = content
        .replace(/<[^>]*>?/gm, " ")
        .replace(/\s+/g, " ")
        .trim();
    const brandName = storeSettings.brandName || brandConfig.identity.name || "Store";
    const seoDescription = page.metaDescription?.[lang] || page.meta_description_fr || page.meta_description_en || subtitle || cleanContentText.slice(0, 160) || `Learn more about ${title} at ${brandName}.`;

    // Hero Banner image directly from page doc in Firestore
    const pageHeroImage = page.imageUrl || page.image_url || page.coverImageUrl || page.banner_image || null;

    // Cover Image for Schema.org / Structured Data
    let rawFeaturedImage = pageHeroImage;
    if (!rawFeaturedImage && isAboutPage) {
        rawFeaturedImage = storeSettings.aboutSection?.images?.[0] || "/images/og-about.jpg";
    }
    if (!rawFeaturedImage) {
        rawFeaturedImage = storeSettings.catalogBannerUrl || brandConfig.assets?.ogImage || brandConfig.assets?.heroBanner || "/images/og-about.jpg";
    }

    const absoluteFeaturedImage = rawFeaturedImage.startsWith("http")
        ? rawFeaturedImage
        : `${pageBaseUrl}${rawFeaturedImage.startsWith("/") ? "" : "/"}${rawFeaturedImage}`;

    const rawLogo = storeSettings.logoUrl || brandConfig.assets.logo.src;
    const absoluteLogoUrl = rawLogo.startsWith("http")
        ? rawLogo
        : `${pageBaseUrl}${rawLogo.startsWith("/") ? "" : "/"}${rawLogo}`;

    const brandDescription = getLocalizedField(storeSettings.heroDescription, lang) ||
        getLocalizedField(brandConfig.identity.description, lang) ||
        `Official store for ${brandName}`;

    const activeSocials = (brandConfig.navigation?.socials || []).map((s) => s.url).filter(Boolean);

    const breadcrumbs = [
        {
            name: lang === "fr" ? "Accueil" : "Home",
            url: `${pageBaseUrl}/${lang}`,
        },
        {
            name: title,
            url: `${pageBaseUrl}/${lang}/${displaySlug}`,
        },
    ];

    return (
        <main className="flex-1 bg-zinc-50 dark:bg-black">
            {/* 1. Structured Data (JSON-LD) - AboutPage / WebPage with Organization & Breadcrumbs */}
            <PageJsonLd
                title={title}
                description={seoDescription}
                url={`${pageBaseUrl}/${lang}/${displaySlug}`}
                lang={lang}
                type={schemaType}
                imageUrl={absoluteFeaturedImage}
                datePublished={typeof page.createdAt === "string" ? page.createdAt : page.createdAt?.toISOString?.()}
                dateModified={typeof page.updatedAt === "string" ? page.updatedAt : page.updatedAt?.toISOString?.()}
                brandName={brandName}
                breadcrumbs={breadcrumbs}
                organization={{
                    name: brandName,
                    url: pageBaseUrl,
                    logo: absoluteLogoUrl,
                    description: brandDescription,
                    sameAs: activeSocials,
                }}
            />

            <PageTranslationSync pageSlugs={Object.keys(pageSlugMap).length > 0 ? pageSlugMap : null} />

            {/* 2. Hero Header Banner (Mutualisé avec le style des pages catégories) */}
            {pageHeroImage ? (
                <section className="relative isolate w-full min-h-[40vh] sm:min-h-[45vh] md:min-h-[50vh] py-20 sm:py-28 md:py-32 px-6 md:px-16 flex flex-col items-center justify-center text-center overflow-hidden mb-12">
                    <AdminEditBadge href={`/admin/pages/${page.id}/edit`} locale={lang} className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20" />
                    <Image
                        src={pageHeroImage}
                        alt={title}
                        fill
                        priority
                        sizes="100vw"
                        className="object-cover pointer-events-none"
                        unoptimized={pageHeroImage.startsWith("http")}
                    />
                    <div className="absolute inset-0 bg-black/50 pointer-events-none z-[1]" />

                    <div className="relative z-10 px-6 max-w-4xl mx-auto flex flex-col items-center text-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight drop-shadow-md">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="mt-4 text-lg md:text-xl text-zinc-200 max-w-2xl mx-auto drop-shadow-md text-center">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </section>
            ) : (
                /* Fallback : En-tête classique centré si aucune bannière n'est définie */
                <header className="relative w-full max-w-4xl mx-auto pt-12 sm:pt-16 pb-8 px-6 text-center flex flex-col items-center">
                    <AdminEditBadge href={`/admin/pages/${page.id}/edit`} locale={lang} className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20" />
                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="mt-4 text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-center">
                            {subtitle}
                        </p>
                    )}
                </header>
            )}

            {/* 3. Contenu textuel épuré */}
            <div className="w-full max-w-5xl mx-auto px-6 md:px-12 mb-16">
                <article className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-base sm:prose-p:text-lg prose-a:text-primary prose-a:font-semibold prose-a:underline-offset-4 hover:prose-a:underline prose-img:rounded-3xl prose-img:shadow-soft-xl prose-img:border prose-img:border-border/60">
                    {parse(sanitizedContent)}
                </article>
            </div>

            {/* 6. Modular Page Blocks */}
            {activeBlocks.length > 0 && (
                <CmsBlockRenderer
                    blocks={activeBlocks}
                    storeSettings={storeSettings}
                    lang={lang}
                    dict={dict}
                    className="mt-8 md:mt-16"
                />
            )}
        </main>
    );
}
