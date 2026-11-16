import { notFound, permanentRedirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import parse from "html-react-parser";
import DOMPurify from "isomorphic-dompurify";
import { ArrowRight } from "lucide-react";
import { Metadata } from "next";

import { getDictionary } from "@/lib/dictionaries";
import { getDefaultLocale, getSupportedLocales, Locale } from "@/app/i18n-config";
import { brandConfig } from "@/config/brand.config";
import { getLocalizedField } from "@/lib/i18n";
import { getStoreSettings } from "@/lib/services/settings";
import { getAllPublishedCategories } from "@/lib/services/categories";
import { getPageBySlug } from "@/lib/services/pages";
import {
    constructLocalizedMetadata,
    resolveOrganizationSeoConfig,
    resolveSiteBaseUrl,
    toAbsoluteUrl,
} from "@/lib/seo/metadata";
import { CmsBlockRenderer } from "@/components/shop/CmsBlockRenderer";
import { PageTranslationSync } from "@/components/shop/PageTranslationSync";
import { AdminEditBadge } from "@/components/admin/AdminEditBadge";
import { CatalogJsonLd, PageJsonLd } from "@/components/seo/JsonLd";

interface SlugPageProps {
    params: Promise<{ lang: string; slug: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(props: SlugPageProps): Promise<Metadata> {
    const [{ lang, slug }, storeSettings] = await Promise.all([
        props.params,
        getStoreSettings(),
    ]);

    const supportedLocales = getSupportedLocales();
    const defaultLocale = getDefaultLocale();
    const localizedCatalogSlug = (
        getLocalizedField(storeSettings.catalogSlug, lang) ||
        (typeof storeSettings.catalogSlug === "string" ? storeSettings.catalogSlug : "shop")
    ).toLowerCase();

    const baseUrl = resolveSiteBaseUrl(
        process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || brandConfig.identity.url
    );

    if (slug.toLowerCase() === localizedCatalogSlug) {
        const brandName = storeSettings.brandName || brandConfig.identity.name || "Store";
        const rawCatalogDisplayTitle = getLocalizedField(storeSettings.catalogTitle, lang) || (lang === "fr" ? "Boutique" : "Shop");
        const catalogDisplayTitle = rawCatalogDisplayTitle.replace(new RegExp(`\\s*[|\\-]\\s*${brandName}$`, "i"), "").trim();

        const rawCatalogIntro = getLocalizedField(storeSettings.catalogIntro, lang);
        const catalogIntro = (rawCatalogIntro && rawCatalogIntro.trim().length > 0) ? rawCatalogIntro.trim() : "";
        const seoTitle = catalogIntro || catalogDisplayTitle;

        const rawCatalogDesc = getLocalizedField(storeSettings.catalogDescription, lang);
        const catalogDescription = (rawCatalogDesc && rawCatalogDesc.trim().length > 0)
            ? rawCatalogDesc.trim()
            : getLocalizedField(storeSettings.heroDescription, lang) || `Browse our complete collection of ${brandName} products.`;
        const rawCatalogBannerUrl = storeSettings.catalogBannerUrl || brandConfig.assets?.heroBanner || "/images/og-about.jpg";

        const catalogLanguages = Object.fromEntries(
            supportedLocales.map((loc) => {
                const locSlug =
                    (typeof storeSettings.catalogSlug === "object"
                        ? getLocalizedField(storeSettings.catalogSlug, loc)
                        : storeSettings.catalogSlug) ||
                    (loc === "fr" ? "boutique" : "shop");
                return [loc, `/${loc}/${locSlug}`];
            })
        );
        catalogLanguages["x-default"] = catalogLanguages[defaultLocale] || `/${defaultLocale}/${localizedCatalogSlug}`;

        return constructLocalizedMetadata({
            locale: lang,
            title: seoTitle,
            description: catalogDescription,
            siteName: brandName,
            baseUrl,
            canonicalPath: `/${lang}/${localizedCatalogSlug}`,
            languages: catalogLanguages,
            imageUrl: rawCatalogBannerUrl,
            type: "website",
        });
    }

    const page = await getPageBySlug(slug);
    if (page && page.status !== "draft") {
        const brandName = storeSettings.brandName || brandConfig.identity.name || "Store";
        const displaySlug = getLocalizedField(page.slug, lang) || (typeof page.slug === "string" ? page.slug : page.id);
        const pageSubtitle = page.subtitle?.[lang] || (lang === "fr" ? page.subtitle_fr : page.subtitle_en) || page.subtitle_en || page.subtitle_fr || getLocalizedField(page.subtitle, lang);
        const pageTitle = (page.title?.[lang] || (lang === "fr" ? page.title_fr : page.title_en) || page.title_en || page.title_fr || getLocalizedField(page.title, lang) || displaySlug).trim();
        const metaTitleCandidate = pageSubtitle?.trim() || pageTitle;

        const customMetaTitle = page.metaTitle?.[lang] || (lang === "fr" ? page.meta_title_fr : page.meta_title_en) || page.meta_title_en || page.meta_title_fr;
        const targetTitle = customMetaTitle?.trim() || metaTitleCandidate;
        const formattedPageTitle = targetTitle.includes(brandName) ? targetTitle : `${targetTitle} | ${brandName}`;

        const isAboutPage = slug.toLowerCase() === "about" ||
            slug.toLowerCase() === "a-propos" ||
            page.slug?.en === "about" ||
            page.slug_en === "about" ||
            page.id === "about";

        const rawContent = getLocalizedField(page.content, lang) || (lang === "fr" ? page.content_fr : page.content_en) || "";
        const cleanContentText = rawContent
            .replace(/<[^>]*>?/gm, " ")
            .replace(/\s+/g, " ")
            .trim();
        const description = page.metaDescription?.[lang] || page.meta_description_fr || page.meta_description_en || pageSubtitle?.trim() || cleanContentText.slice(0, 160) || `Learn more about ${pageTitle} at ${brandName}.`;

        const pageLanguages = Object.fromEntries(
            supportedLocales.map((loc) => {
                const fallbackLegacy = loc === "fr" ? page.slug_fr : page.slug_en;
                const locSlug =
                    (typeof page.slug === "object" && page.slug?.[loc]) ||
                    fallbackLegacy ||
                    getLocalizedField(page.slug, loc) ||
                    (typeof page.slug === "string" ? page.slug : slug);
                return [loc, `/${loc}/${locSlug}`];
            })
        );
        pageLanguages["x-default"] = pageLanguages[defaultLocale] || `/${defaultLocale}/${displaySlug}`;

        let rawOgImage = page.imageUrl || page.image_url || page.coverImageUrl || page.banner_image;
        if (!rawOgImage && isAboutPage) {
            rawOgImage = storeSettings.aboutSection?.images?.[0] || "/images/og-about.jpg";
        }
        if (!rawOgImage) {
            rawOgImage = storeSettings.catalogBannerUrl || brandConfig.assets?.ogImage || brandConfig.assets?.heroBanner || "/images/og-about.jpg";
        }

        return constructLocalizedMetadata({
            locale: lang,
            title: formattedPageTitle,
            absoluteTitle: true,
            description,
            siteName: brandName,
            baseUrl,
            canonicalPath: `/${lang}/${displaySlug}`,
            languages: pageLanguages,
            imageUrl: rawOgImage,
            type: isAboutPage ? "article" : "website",
        });
    }

    return {};
}

export default async function UnifiedSlugPage(props: SlugPageProps) {
    const [{ lang, slug }, searchParams, storeSettings] = await Promise.all([
        props.params,
        props.searchParams,
        getStoreSettings(),
    ]);
    const rawArtwork = searchParams.artwork;
    const initialArtwork = typeof rawArtwork === "string" ? rawArtwork.trim() : undefined;

    const localizedCatalogSlug = (
        getLocalizedField(storeSettings.catalogSlug, lang) ||
        (typeof storeSettings.catalogSlug === "string" ? storeSettings.catalogSlug : "shop")
    ).toLowerCase();

    if (slug.toLowerCase() === localizedCatalogSlug) {
        const categoryQuery = searchParams.category;
        if (typeof categoryQuery === "string" && categoryQuery.trim()) {
            permanentRedirect(`/${lang}/${localizedCatalogSlug}/${categoryQuery.trim()}`);
        }

        const [dict, publishedCategories] = await Promise.all([
            getDictionary(lang as Locale),
            getAllPublishedCategories(),
        ]);

        const categories = [...publishedCategories].sort((a, b) => {
            const orderDiff = (a.order ?? 0) - (b.order ?? 0);
            if (orderDiff !== 0) return orderDiff;
            const nameA = getLocalizedField(a.name, lang) || (lang === "fr" ? a.nameFr : a.nameEn) || "";
            const nameB = getLocalizedField(b.name, lang) || (lang === "fr" ? b.nameFr : b.nameEn) || "";
            return nameA.localeCompare(nameB, lang);
        });

        const baseUrl = resolveSiteBaseUrl(
            process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || brandConfig.identity.url
        );
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
                image: catImg ? toAbsoluteUrl(baseUrl, catImg) : undefined,
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
                <section className="relative isolate w-full min-h-[40vh] sm:min-h-[45vh] md:min-h-[50vh] py-20 sm:py-28 md:py-32 px-6 md:px-16 flex flex-col items-center justify-center text-center overflow-hidden mb-8">
                    <AdminEditBadge href="/admin/catalog" locale={lang} className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20" />
                    {catalogBanner ? (
                        <Image
                            src={catalogBanner}
                            alt={catalogTitle || "Catalog Banner"}
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
                            {catalogTitle}
                        </h1>
                        {catalogIntro && (
                            <p className="mt-4 text-lg text-white/95 max-w-2xl mx-auto drop-shadow-md text-center">
                                {catalogIntro}
                            </p>
                        )}
                    </div>
                </section>

                {catalogDescription && (
                    <div className="w-full max-w-4xl mx-auto px-6 md:px-16 mt-2 mb-12 text-center">
                        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
                            {catalogDescription}
                        </p>
                    </div>
                )}

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
                                            className="group relative block aspect-[16/10] sm:aspect-[4/3] rounded-2xl overflow-hidden border bg-muted shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                                        >
                                            {catImg ? (
                                                <Image
                                                    src={catImg}
                                                    alt={catName}
                                                    fill
                                                    quality={75}
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-zinc-700 to-zinc-900" />
                                            )}

                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/15 group-hover:from-black/95 transition-colors duration-300" />

                                            <div className="absolute inset-0 p-6 flex flex-col justify-end text-white">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h3 className="text-2xl font-bold tracking-tight group-hover:translate-x-1 transition-transform duration-300">
                                                        {catName}
                                                    </h3>
                                                    <span className="h-9 w-9 rounded-full bg-black/75 border border-white/25 backdrop-blur-md flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-all duration-300">
                                                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                                                    </span>
                                                </div>
                                                {catIntro && (
                                                    <p className="mt-2 text-sm text-zinc-200 line-clamp-2">
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

    const [page, dict] = await Promise.all([
        getPageBySlug(slug),
        getDictionary(lang as Locale),
    ]);

    if (!page || page.status === "draft") {
        notFound();
    }

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
            "svg", "path", "g", "circle", "rect", "line", "polyline", "polygon", "ellipse",
            "use", "defs", "symbol", "clipPath", "mask", "text", "tspan",
            "linearGradient", "radialGradient", "stop", "pattern", "image",
        ],
        ALLOWED_ATTR: [
            "href", "src", "alt", "title", "class", "className", "style", "id",
            "target", "rel", "width", "height",
            "allowfullscreen", "allowFullScreen", "loading", "referrerpolicy", "referrerPolicy",
            "aria-hidden", "aria-label", "aria-labelledby", "aria-describedby", "role",
            "xmlns", "viewBox", "viewbox", "fill", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin",
            "stroke-dasharray", "stroke-dashoffset", "stroke-miterlimit", "stroke-opacity", "fill-opacity",
            "fill-rule", "clip-rule", "clip-path", "d", "cx", "cy", "r", "rx", "ry",
            "x", "y", "x1", "y1", "x2", "y2", "points", "transform", "transform-origin", "opacity",
            "offset", "stop-color", "stop-opacity", "gradientUnits", "gradientTransform", "spreadMethod",
        ],
        ADD_TAGS: ["iframe"],
        ADD_ATTR: ["allowfullscreen", "allowFullScreen", "loading", "referrerpolicy", "referrerPolicy", "style", "target"],
    });

    const pageBaseUrl = resolveSiteBaseUrl(
        process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || brandConfig.identity.url
    );

    const isAboutPage = slug.toLowerCase() === "about" ||
        slug.toLowerCase() === "a-propos" ||
        page.slug?.en === "about" ||
        page.slug_en === "about" ||
        page.id === "about";

    const schemaType = isAboutPage ? "AboutPage" : "WebPage";

    const cleanContentText = content
        .replace(/<[^>]*>?/gm, " ")
        .replace(/\s+/g, " ")
        .trim();
    const brandName = storeSettings.brandName || brandConfig.identity.name || "Store";
    const seoDescription = page.metaDescription?.[lang] || page.meta_description_fr || page.meta_description_en || subtitle || cleanContentText.slice(0, 160) || `Learn more about ${title} at ${brandName}.`;
    const pageIntro = getLocalizedField(page.metaDescription, lang) || (lang === "fr" ? page.meta_description_fr : page.meta_description_en);

    const pageHeroImage = page.imageUrl || page.image_url || page.coverImageUrl || page.banner_image || null;

    let rawFeaturedImage = pageHeroImage;
    if (!rawFeaturedImage && isAboutPage) {
        rawFeaturedImage = storeSettings.aboutSection?.images?.[0] || "/images/og-about.jpg";
    }
    if (!rawFeaturedImage) {
        rawFeaturedImage = storeSettings.catalogBannerUrl || brandConfig.assets?.ogImage || brandConfig.assets?.heroBanner || "/images/og-about.jpg";
    }

    const absoluteFeaturedImage = toAbsoluteUrl(pageBaseUrl, rawFeaturedImage);
    const brandDescription =
        getLocalizedField(storeSettings.heroDescription, lang) ||
        getLocalizedField(brandConfig.identity.description, lang) ||
        `Official store for ${brandName}`;
    const orgConfig = resolveOrganizationSeoConfig(storeSettings, pageBaseUrl, {
        locale: lang,
    });

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
        <div className="flex-1 bg-zinc-50 dark:bg-black">
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
                    name: orgConfig.name,
                    url: orgConfig.url,
                    logo: orgConfig.logo,
                    description: brandDescription,
                    sameAs: orgConfig.sameAs,
                }}
            />

            <PageTranslationSync pageSlugs={Object.keys(pageSlugMap).length > 0 ? pageSlugMap : null} />

            {pageHeroImage ? (
                <section className="relative isolate w-full min-h-[40vh] sm:min-h-[45vh] md:min-h-[50vh] py-20 sm:py-28 md:py-32 px-6 md:px-16 flex flex-col items-center justify-center text-center overflow-hidden mb-12">
                    <AdminEditBadge href={`/admin/pages/${page.id}/edit`} locale={lang} className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20" />
                    <Image
                        src={pageHeroImage}
                        alt={title}
                        fill
                        priority
                        fetchPriority="high"
                        quality={75}
                        sizes="100vw"
                        className="object-cover pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-black/50 pointer-events-none z-[1]" />

                    <div className="relative z-10 px-6 max-w-4xl mx-auto flex flex-col items-center text-center">
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight drop-shadow-md">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="mt-4 text-lg md:text-xl text-zinc-100 max-w-2xl mx-auto drop-shadow-md text-center">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </section>
            ) : (
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

            <div className="w-full max-w-5xl mx-auto px-6 md:px-12 mb-16">
                {pageIntro && (
                    <div className="w-full max-w-3xl mx-auto text-center mb-8">
                        <p className="text-lg text-muted-foreground max-w-3xl mx-auto text-center">{pageIntro}</p>
                    </div>
                )}
                <article className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-foreground prose-h2:text-2xl sm:prose-h2:text-3xl prose-h2:mt-10 prose-h2:mb-4 prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-base sm:prose-p:text-lg [&_a:not([class*='bg-'])]:text-primary prose-a:font-semibold prose-a:underline-offset-4 hover:prose-a:underline [&_a[class*='bg-']]:!text-primary-foreground [&_a[class*='bg-']]:!no-underline prose-img:rounded-lg prose-img:max-w-full prose-img:h-auto prose-img:shadow-soft-xl prose-img:border prose-img:border-border/60">
                    {parse(sanitizedContent)}
                </article>
            </div>

            {activeBlocks.length > 0 && (
                <CmsBlockRenderer
                    blocks={activeBlocks}
                    storeSettings={storeSettings}
                    lang={lang}
                    dict={dict}
                    className="mt-8 md:mt-16"
                    initialArtwork={initialArtwork}
                />
            )}
        </div>
    );
}
