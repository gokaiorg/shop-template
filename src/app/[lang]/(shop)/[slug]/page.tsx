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
import { ContactForm } from "@/components/forms/ContactForm";
import { PageTranslationSync } from "@/components/shop/PageTranslationSync";

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

    const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || brandConfig.identity.url || "http://localhost:3000";
    const baseUrl = rawBaseUrl.replace(/\/+$/, "");

    // 1. Is it the Catalog?
    if (slug.toLowerCase() === localizedCatalogSlug) {
        const brandName = storeSettings.brandName || brandConfig.identity.name || "Store";
        const rawCatalogDisplayTitle = getLocalizedField(storeSettings.catalogTitle, lang) || (lang === "fr" ? "Boutique" : "Shop");
        const catalogDisplayTitle = rawCatalogDisplayTitle.replace(new RegExp(`\\s*[|\\-]\\s*${brandName}$`, "i"), "").trim();
        const rawCatalogDesc = getLocalizedField(storeSettings.catalogDescription, lang);
        const catalogDescription = (rawCatalogDesc && rawCatalogDesc.trim().length > 0)
            ? rawCatalogDesc.trim()
            : (lang === "fr" ? brandConfig.identity.description?.fr : brandConfig.identity.description?.en) || `Browse our complete collection of ${brandName} products.`;
        const catalogBannerUrl = storeSettings.catalogBannerUrl || brandConfig.assets?.heroBanner || "";
        const canonicalUrl = `${baseUrl}/${lang}/${localizedCatalogSlug}`;

        const enCatalogSlug = (typeof storeSettings.catalogSlug === "object" ? storeSettings.catalogSlug?.en : "shop") || "shop";
        const frCatalogSlug = (typeof storeSettings.catalogSlug === "object" ? storeSettings.catalogSlug?.fr : "boutique") || "boutique";

        const languagesAlternate: Record<string, string> = {
            en: `${baseUrl}/en/${enCatalogSlug}`,
            fr: `${baseUrl}/fr/${frCatalogSlug}`,
            "x-default": `${baseUrl}/en/${enCatalogSlug}`,
        };

        return {
            title: catalogDisplayTitle,
            description: catalogDescription,
            alternates: {
                canonical: canonicalUrl,
                languages: languagesAlternate,
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

    // 2. Is it a Page?
    const page = await getPageBySlug(slug);
    if (page && page.status !== "draft") {
        const displaySlug = getLocalizedField(page.slug, lang) || (typeof page.slug === "string" ? page.slug : page.id);
        const title = page.metaTitle?.[lang] || page.meta_title_fr || page.meta_title_en || getLocalizedField(page.title, lang) || (lang === "fr" ? page.title_fr : page.title_en) || displaySlug;
        const description = page.metaDescription?.[lang] || page.meta_description_fr || page.meta_description_en || getLocalizedField(page.content, lang)?.replace(/<[^>]*>?/gm, "").slice(0, 160) || "";
        const canonicalUrl = `${baseUrl}/${lang}/${slug}`;

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
            },
            twitter: {
                card: "summary_large_image",
                title,
                description,
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

        const catalogTitle = getLocalizedField(storeSettings.catalogTitle, lang) || (lang === "fr" ? "Boutique" : "Shop");
        const catalogBanner = storeSettings.catalogBannerUrl || brandConfig.assets?.heroBanner || "";
        const catalogDescription = getLocalizedField(storeSettings.catalogDescription, lang) || "";

        return (
            <div className="w-full flex flex-col">
                {/* Edge-to-Edge Illustrated Catalog Banner */}
                <section className="relative isolate w-full min-h-[40vh] sm:min-h-[45vh] md:min-h-[50vh] py-20 sm:py-28 md:py-32 px-6 md:px-16 flex flex-col items-center justify-center text-center overflow-hidden mb-12">
                    {catalogBanner ? (
                        <Image
                            src={catalogBanner}
                            alt={catalogTitle || "Catalog Banner"}
                            fill
                            priority
                            sizes="100vw"
                            className="object-cover pointer-events-none"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-zinc-900 to-black z-0" />
                    )}
                    <div className="absolute inset-0 bg-black/40 pointer-events-none z-[1]" />

                    <div className="relative z-10 px-6 max-w-4xl mx-auto flex flex-col items-center">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight drop-shadow-md">
                            {catalogTitle}
                        </h1>
                        {catalogDescription && (
                            <p className="mt-4 text-lg text-white/90 max-w-2xl mx-auto drop-shadow-md text-center">
                                {catalogDescription}
                            </p>
                        )}
                    </div>
                </section>

                {/* Categories Grid (Clean Silo Links) */}
                <div className="container mx-auto px-4 md:px-8 mb-16">
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
                                    <li key={category.id}>
                                        <Link
                                            href={`/${lang}/${localizedCatalogSlug}/${catSlug}`}
                                            className="group relative block aspect-[16/10] sm:aspect-[4/3] rounded-2xl overflow-hidden border bg-muted shadow-md hover:shadow-2xl transition-all duration-500 cursor-pointer"
                                        >
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
    const content = getLocalizedField(page.content, lang) || (lang === "fr" ? page.content_fr : page.content_en) || "";

    const isContactPage =
        slug === "contact" ||
        (typeof page.slug === "string" && page.slug === "contact") ||
        (typeof page.slug === "object" && Object.values(page.slug).includes("contact")) ||
        page.id === "contact";

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
        ALLOWED_TAGS: [
            "h1", "h2", "h3", "h4", "h5", "h6",
            "p", "span", "strong", "em", "b", "i", "u", "s", "strike",
            "ul", "ol", "li", "blockquote", "a", "img",
            "table", "thead", "tbody", "tr", "th", "td",
            "br", "hr", "code", "pre"
        ],
        ALLOWED_ATTR: ["href", "src", "alt", "title", "class", "target", "rel", "width", "height"],
    });

    return (
        <div className="flex-1 bg-zinc-50 dark:bg-black">
            <PageTranslationSync pageSlugs={Object.keys(pageSlugMap).length > 0 ? pageSlugMap : null} />
            <div className="w-full max-w-7xl mx-auto py-16 px-6 md:px-16">
                <h1 className="text-4xl font-bold tracking-tight mb-8">{title}</h1>
                <article className="prose prose-zinc dark:prose-invert max-w-none">
                    {parse(sanitizedContent)}
                </article>

                {isContactPage && (
                    <div className="mt-12">
                        <ContactForm lang={lang} dict={dict.contact} />
                    </div>
                )}
            </div>
        </div>
    );
}
