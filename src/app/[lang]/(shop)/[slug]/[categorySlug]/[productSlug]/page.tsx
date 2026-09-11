import { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import { adminDb } from "@/lib/firebase-admin";
import { Category, Product } from "@/types/database";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { Badge } from "@/components/ui/badge";
import { brandConfig } from "@/config/brand.config";
import { getLocalizedField } from "@/lib/i18n";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { getStoreSettings } from "@/lib/services/settings";
import { formatPrice } from "@/lib/currency";
import { ProductTranslationSync } from "@/components/shop/ProductTranslationSync";
import { CategoryTranslationSync } from "@/components/shop/CategoryTranslationSync";

interface ProductPageProps {
    params: Promise<{
        lang: string;
        slug: string;
        categorySlug: string;
        productSlug: string;
    }>;
}

interface FirestoreDateLike {
    toDate?: () => Date;
}

function normalizeProduct(docId: string, data: Record<string, unknown>): Product {
    const rawImages = (data?.images && Array.isArray(data.images) && data.images.length > 0)
        ? (data.images as string[])
        : (typeof data?.imageUrl === "string" ? [data.imageUrl] : []);

    const created = data?.createdAt as FirestoreDateLike | string | null | undefined;
    const updated = data?.updatedAt as FirestoreDateLike | string | null | undefined;

    return {
        ...(data as unknown as Product),
        id: docId,
        images: rawImages,
        imageUrl: typeof data?.imageUrl === "string" ? data.imageUrl : (rawImages[0] || null),
        createdAt: created && typeof created === "object" && typeof created.toDate === "function"
            ? created.toDate().toISOString()
            : (typeof created === "string" ? created : new Date().toISOString()),
        updatedAt: updated && typeof updated === "object" && typeof updated.toDate === "function"
            ? updated.toDate().toISOString()
            : (typeof updated === "string" ? updated : new Date().toISOString()),
    } as Product;
}

interface ProductLookupResult {
    product: Product | null;
    correctSlugForLang?: string;
    shouldRedirect?: boolean;
}

async function lookupProductBySlug(lang: string, slug: string): Promise<ProductLookupResult> {
    // 1. Query nested slug map for active lang
    const snapshot = await adminDb.collection("products").where(`slug.${lang}`, "==", slug).limit(1).get();
    if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { product: normalizeProduct(doc.id, doc.data()), shouldRedirect: false };
    }

    // 2. Query legacy flat slug fields for active lang
    const legacyField = lang === "fr" ? "slugFr" : "slugEn";
    const legacySnapshot = await adminDb.collection("products").where(legacyField, "==", slug).limit(1).get();
    if (!legacySnapshot.empty) {
        const doc = legacySnapshot.docs[0];
        return { product: normalizeProduct(doc.id, doc.data()), shouldRedirect: false };
    }

    // 3. Scan collection for exact locale match or cross-locale match
    const allSnapshot = await adminDb.collection("products").get();
    let crossLocaleProduct: Product | null = null;

    for (const doc of allSnapshot.docs) {
        const normalized = normalizeProduct(doc.id, doc.data());
        const localizedSlug = getLocalizedField(normalized.slug, lang) || (lang === "fr" ? normalized.slugFr : normalized.slugEn);

        if (localizedSlug === slug) {
            return { product: normalized, shouldRedirect: false };
        }

        // Check if slug matches this product in another language
        const allProductSlugs = [
            ...(typeof normalized.slug === "object" && normalized.slug ? Object.values(normalized.slug) : []),
            normalized.slugEn,
            normalized.slugFr,
            normalized.id,
        ].filter((s): s is string => typeof s === "string" && Boolean(s));

        if (allProductSlugs.includes(slug) && !crossLocaleProduct) {
            crossLocaleProduct = normalized;
        }
    }

    if (crossLocaleProduct) {
        const correctSlug = getLocalizedField(crossLocaleProduct.slug, lang) || (lang === "fr" ? crossLocaleProduct.slugFr : crossLocaleProduct.slugEn);
        if (correctSlug && correctSlug !== slug) {
            return {
                product: crossLocaleProduct,
                correctSlugForLang: correctSlug,
                shouldRedirect: true,
            };
        }
    }

    return { product: null };
}

function cleanDescription(text?: string | null, maxLength = 160): string {
    if (!text) return "";
    const withoutHtml = text.replace(/<[^>]*>/g, " ");
    const singleLine = withoutHtml.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
    if (singleLine.length <= maxLength) {
        return singleLine;
    }
    return singleLine.slice(0, maxLength).trim();
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
    const { lang, slug, categorySlug, productSlug } = await params;
    const [lookupResult, storeSettings] = await Promise.all([
        lookupProductBySlug(lang, productSlug),
        getStoreSettings(),
    ]);

    const localizedCatalogSlug = (
        getLocalizedField(storeSettings.catalogSlug, lang) ||
        (typeof storeSettings.catalogSlug === "string" ? storeSettings.catalogSlug : "shop")
    ).toLowerCase();

    if (slug.toLowerCase() !== localizedCatalogSlug) {
        return {};
    }

    const { product, shouldRedirect } = lookupResult;
    if (!product || shouldRedirect) {
        return { title: "Product Not Found" };
    }

    const brandName = storeSettings.brandName || brandConfig.identity.name || "Store";
    const productName = getLocalizedField(product.name, lang) || (lang === "fr" ? product.nameFr : product.nameEn) || "Product";

    const rawIntro = getLocalizedField(product.intro, lang) || (lang === "fr" ? product.introFr : product.introEn);
    const rawDescription = getLocalizedField(product.description, lang) || (lang === "fr" ? product.descriptionFr : product.descriptionEn) || "";
    const chosenDescriptionText = (rawIntro && rawIntro.trim().length > 0) ? rawIntro : rawDescription;
    const cleanedDescription = cleanDescription(chosenDescriptionText, 160);

    const catIds = product.categoryIds || (product.categoryId ? [product.categoryId] : []);
    let categoryData: Category | null = product.category || null;
    if (!categoryData && catIds.length > 0) {
        try {
            const catDoc = await adminDb.collection("categories").doc(catIds[0]).get();
            if (catDoc.exists) {
                categoryData = catDoc.data() as Category;
            }
        } catch (error) {
            console.error("[GENERATE_METADATA_CATEGORY_FETCH_ERROR]", error);
        }
    }
    const categoryName = categoryData
        ? (getLocalizedField(categoryData.name, lang) || (lang === "fr" ? categoryData.nameFr : categoryData.nameEn) || "")
        : "";

    const rawKeywords = categoryName
        ? [categoryName, brandName, productName]
        : [brandName, productName];
    const keywords = rawKeywords.filter((k): k is string => Boolean(k && k.trim().length > 0));

    const firstImage = (product.images && product.images.length > 0)
        ? product.images[0]
        : (product.imageUrl || null);

    const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || brandConfig.identity.url || "http://localhost:3000";
    const baseUrl = rawBaseUrl.replace(/\/+$/, "");
    const canonicalUrl = `${baseUrl}/${lang}/${localizedCatalogSlug}/${categorySlug}/${productSlug}`;

    const enCatalogSlug = (typeof storeSettings.catalogSlug === "object" ? storeSettings.catalogSlug?.en : "shop") || "shop";
    const frCatalogSlug = (typeof storeSettings.catalogSlug === "object" ? storeSettings.catalogSlug?.fr : "boutique") || "boutique";

    const enCatSlug = (categoryData && typeof categoryData.slug === "object" && categoryData.slug?.en)
        ? categoryData.slug.en
        : (categoryData?.slugEn || getLocalizedField(categoryData?.slug, "en") || categorySlug);
    const frCatSlug = (categoryData && typeof categoryData.slug === "object" && categoryData.slug?.fr)
        ? categoryData.slug.fr
        : (categoryData?.slugFr || getLocalizedField(categoryData?.slug, "fr") || categorySlug);

    const enProdSlug = (typeof product.slug === "object" && product.slug?.en)
        ? product.slug.en
        : (product.slugEn || getLocalizedField(product.slug, "en") || productSlug);
    const frProdSlug = (typeof product.slug === "object" && product.slug?.fr)
        ? product.slug.fr
        : (product.slugFr || getLocalizedField(product.slug, "fr") || productSlug);

    const languagesAlternate: Record<string, string> = {
        en: `${baseUrl}/en/${enCatalogSlug}/${enCatSlug}/${enProdSlug}`,
        fr: `${baseUrl}/fr/${frCatalogSlug}/${frCatSlug}/${frProdSlug}`,
        "x-default": `${baseUrl}/en/${enCatalogSlug}/${enCatSlug}/${enProdSlug}`,
    };

    const artistOrVendor = product.artist?.trim() || product.vendor?.trim();
    const authorName = artistOrVendor || brandName;

    return {
        title: productName,
        description: cleanedDescription,
        keywords: keywords,
        authors: [{ name: authorName }],
        creator: authorName,
        alternates: {
            canonical: canonicalUrl,
            languages: languagesAlternate,
        },
        openGraph: {
            title: productName,
            description: cleanedDescription,
            url: canonicalUrl,
            type: "website",
            ...(firstImage ? { images: [firstImage] } : {}),
        },
        twitter: {
            card: "summary_large_image",
            title: productName,
            description: cleanedDescription,
            ...(firstImage ? { images: [firstImage] } : {}),
        },
        other: {
            "og:type": "product",
        },
    };
}

export default async function SiloProductPage({ params }: ProductPageProps) {
    const { lang, slug, categorySlug, productSlug } = await params;

    const storeSettings = await getStoreSettings();
    const localizedCatalogSlug = (
        getLocalizedField(storeSettings.catalogSlug, lang) ||
        (typeof storeSettings.catalogSlug === "string" ? storeSettings.catalogSlug : "shop")
    ).toLowerCase();

    // 1. Enforce catalog slug match
    if (slug.toLowerCase() !== localizedCatalogSlug) {
        notFound();
    }

    // 2. Look up product
    const { product, shouldRedirect, correctSlugForLang } = await lookupProductBySlug(lang, productSlug);

    if (!product) {
        notFound();
    }

    // Load assigned categories for this product
    const catIds = product.categoryIds || (product.categoryId ? [product.categoryId] : []);
    let assignedCategories: Category[] = [];
    if (catIds.length > 0) {
        const catDocs = await Promise.all(
            catIds.map((id) => adminDb.collection("categories").doc(id).get())
        );
        assignedCategories = catDocs
            .filter((d) => d.exists)
            .map((d) => ({ id: d.id, ...d.data() } as Category))
            .filter((c) => (c.status ?? "published") === "published");
    }

    // Determine current/primary category
    const activeCategory = assignedCategories.find((cat) => {
        const locSlug = (typeof cat.slug === "object" && cat.slug?.[lang])
            ? cat.slug[lang]
            : (lang === "fr" ? cat.slugFr : cat.slugEn) || getLocalizedField(cat.slug, lang);
        return (
            locSlug === categorySlug ||
            cat.slug?.[lang] === categorySlug ||
            cat.slugEn === categorySlug ||
            cat.slugFr === categorySlug ||
            cat.id === categorySlug
        );
    }) || assignedCategories[0] || null;

    const primaryCatSlug = activeCategory
        ? (getLocalizedField(activeCategory.slug, lang) || (lang === "fr" ? activeCategory.slugFr : activeCategory.slugEn) || activeCategory.id)
        : categorySlug;

    // Handle cross-locale redirects
    if (shouldRedirect && correctSlugForLang) {
        permanentRedirect(`/${lang}/${localizedCatalogSlug}/${primaryCatSlug}/${correctSlugForLang}`);
    }

    // If categorySlug in URL was in another language, redirect to active language slug
    if (activeCategory && categorySlug !== primaryCatSlug) {
        permanentRedirect(`/${lang}/${localizedCatalogSlug}/${primaryCatSlug}/${productSlug}`);
    }

    // Prepare multilingual product slugs for translation store
    const productSlugMap: Record<string, string> | null = (() => {
        const map: Record<string, string> = {};
        if (typeof product.slug === "object" && product.slug !== null) {
            Object.entries(product.slug).forEach(([loc, s]) => {
                if (typeof s === "string" && s) map[loc] = s;
            });
        } else if (typeof product.slug === "string" && product.slug) {
            map["en"] = product.slug;
        }
        if (product.slugEn && !map["en"]) map["en"] = product.slugEn;
        if (product.slugFr && !map["fr"]) map["fr"] = product.slugFr;
        return Object.keys(map).length > 0 ? map : null;
    })();

    // Prepare multilingual category slugs for translation store
    const categorySlugMap: Record<string, string> | null = activeCategory ? (() => {
        const map: Record<string, string> = {};
        if (typeof activeCategory.slug === "object" && activeCategory.slug !== null) {
            Object.entries(activeCategory.slug).forEach(([loc, s]) => {
                if (typeof s === "string" && s) map[loc] = s;
            });
        } else if (typeof activeCategory.slug === "string" && activeCategory.slug) {
            map["en"] = activeCategory.slug;
        }
        if (activeCategory.slugEn && !map["en"]) map["en"] = activeCategory.slugEn;
        if (activeCategory.slugFr && !map["fr"]) map["fr"] = activeCategory.slugFr;
        return Object.keys(map).length > 0 ? map : null;
    })() : null;

    const dict = await getDictionary(lang as Locale);
    const shopDict = dict.shop;
    const currency = storeSettings.defaultCurrency || "THB";

    const title = getLocalizedField(product.name, lang) || (lang === "fr" ? product.nameFr : product.nameEn) || "Product";
    const description = getLocalizedField(product.description, lang) || (lang === "fr" ? product.descriptionFr : product.descriptionEn) || "";
    const intro = getLocalizedField(product.intro, lang) || (lang === "fr" ? product.introFr : product.introEn) || "";

    const productImages = (product.images && product.images.length > 0)
        ? product.images
        : (product.imageUrl ? [product.imageUrl] : []);
    const images = productImages.length > 0 ? productImages : [brandConfig.assets.placeholderImage];
    const isCartEnabled = (process.env.ENABLE_CART || process.env.NEXT_PUBLIC_ENABLE_CART) !== "false";
    const isOutOfStock = (product.stock ?? 0) <= 0;

    const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || brandConfig.identity.url || "http://localhost:3000";
    const baseUrl = rawBaseUrl.replace(/\/+$/, "");
    const catalogName = getLocalizedField(storeSettings.catalogTitle, lang) || (lang === "fr" ? "Boutique" : "Shop");
    const categoryName = activeCategory
        ? (getLocalizedField(activeCategory.name, lang) || (lang === "fr" ? activeCategory.nameFr : activeCategory.nameEn) || primaryCatSlug)
        : primaryCatSlug;
    const absoluteImages = images.map((img) =>
        img.startsWith("http") ? img : `${baseUrl}${img.startsWith("/") ? "" : "/"}${img}`
    );
    const productDescription = cleanDescription(description || intro || title, 5000) || title;
    const brandName = (product as unknown as { brand?: string }).brand || product.vendor || storeSettings.brandName || brandConfig.identity.name || "Store";
    const sku = (product as unknown as { sku?: string }).sku || product.id;

    const productSchema = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: title,
        description: productDescription,
        image: absoluteImages,
        sku: sku,
        brand: {
            "@type": "Brand",
            name: brandName,
        },
        offers: {
            "@type": "Offer",
            price: product.price ?? 0,
            priceCurrency: currency,
            availability: isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
            url: `${baseUrl}/${lang}/${localizedCatalogSlug}/${primaryCatSlug}/${productSlug}`,
            itemCondition: "https://schema.org/NewCondition",
        },
    };

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
                name: categoryName,
                item: `${baseUrl}/${lang}/${localizedCatalogSlug}/${primaryCatSlug}`,
            },
            {
                "@type": "ListItem",
                position: 4,
                name: title,
                item: `${baseUrl}/${lang}/${localizedCatalogSlug}/${primaryCatSlug}/${productSlug}`,
            },
        ],
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify([productSchema, breadcrumbSchema]) }}
            />
            <ProductTranslationSync productSlugs={productSlugMap} />
            <CategoryTranslationSync categorySlugs={categorySlugMap} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                {/* Left column: Gallery */}
                <div className="w-full">
                    <ProductGallery images={images} title={title} isOutOfStock={isOutOfStock} />
                </div>

                {/* Right column: Content */}
                <div className="flex flex-col space-y-6">
                    <div>
                        {assignedCategories.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {assignedCategories.map((cat) => {
                                    const catName = getLocalizedField(cat.name, lang) || (lang === "fr" ? cat.nameFr : cat.nameEn);
                                    const catSlug =
                                        (typeof cat.slug === "object" && cat.slug?.[lang])
                                            ? cat.slug[lang]
                                            : (lang === "fr" ? cat.slugFr : cat.slugEn) ||
                                              getLocalizedField(cat.slug, lang) ||
                                              (typeof cat.slug === "string" ? cat.slug : cat.id);
                                    return (
                                        <Link key={cat.id} href={`/${lang}/${localizedCatalogSlug}/${catSlug}`}>
                                            <Badge variant="secondary" className="hover:bg-primary/20 transition-colors text-xs font-normal cursor-pointer">
                                                {catName}
                                            </Badge>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">{title}</h1>
                        <p className="mt-4 text-3xl font-semibold text-foreground">
                            {formatPrice(product.price, currency, lang)}
                        </p>
                    </div>

                    <h2 className="sr-only">Product Details</h2>
                    <div className="prose dark:prose-invert max-w-none">
                        {intro && (
                            <p className="text-lg text-muted-foreground font-medium mb-4">
                                {intro}
                            </p>
                        )}
                        <p className="text-base text-muted-foreground whitespace-pre-wrap">
                            {description}
                        </p>
                    </div>

                    {isCartEnabled && (
                        <div className="pt-6 border-t">
                            <AddToCartButton
                                product={product}
                                lang={lang}
                                label={shopDict.add_to_cart || "Add to cart"}
                                title={title}
                                size="lg"
                                className="w-full md:w-auto px-12"
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
