import { Metadata } from "next";
import Link from "next/link";
import { adminDb } from "@/lib/firebase-admin";
import { Category, Product } from "@/types/database";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { Badge } from "@/components/ui/badge";
import { brandConfig } from "@/config/brand.config";
import { getLocalizedField } from "@/lib/i18n";
import { ProductGallery } from "@/components/shop/ProductGallery";
import { getStoreSettings } from "@/lib/services/settings";
import { formatPrice } from "@/lib/currency";

interface PageProps {
    params: Promise<{ lang: string; slug: string }>;
}

interface FirestoreDateLike {
    toDate?: () => Date;
}

function normalizeProduct(docId: string, data: Record<string, unknown>): Product {
    const rawImages = (data?.images && Array.isArray(data.images) && data.images.length > 0)
        ? (data.images as string[])
        : (typeof data?.imageUrl === 'string' ? [data.imageUrl] : []);

    const created = data?.createdAt as FirestoreDateLike | string | null | undefined;
    const updated = data?.updatedAt as FirestoreDateLike | string | null | undefined;

    return {
        ...(data as unknown as Product),
        id: docId,
        images: rawImages,
        imageUrl: typeof data?.imageUrl === 'string' ? data.imageUrl : (rawImages[0] || null),
        createdAt: created && typeof created === 'object' && typeof created.toDate === 'function'
            ? created.toDate().toISOString()
            : (typeof created === 'string' ? created : new Date().toISOString()),
        updatedAt: updated && typeof updated === 'object' && typeof updated.toDate === 'function'
            ? updated.toDate().toISOString()
            : (typeof updated === 'string' ? updated : new Date().toISOString()),
    } as Product;
}

async function findProductBySlug(lang: string, slug: string): Promise<Product | null> {
    // 1. Query nested slug map
    let snapshot = await adminDb.collection("products").where(`slug.${lang}`, "==", slug).limit(1).get();
    if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return normalizeProduct(doc.id, doc.data());
    }

    // 2. Query legacy flat slug fields
    const legacyField = lang === 'fr' ? 'slugFr' : 'slugEn';
    snapshot = await adminDb.collection("products").where(legacyField, "==", slug).limit(1).get();
    if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return normalizeProduct(doc.id, doc.data());
    }

    // 3. Fallback: Scan collection
    const allSnapshot = await adminDb.collection("products").get();
    for (const doc of allSnapshot.docs) {
        const data = doc.data() as Product;
        const localizedSlug = getLocalizedField(data.slug, lang) || (lang === 'fr' ? data.slugFr : data.slugEn);
        if (localizedSlug === slug || data.slugEn === slug || data.slugFr === slug) {
            return normalizeProduct(doc.id, doc.data());
        }
    }

    return null;
}

function cleanDescription(text?: string | null, maxLength = 160): string {
    if (!text) return "";
    // Supprime les balises HTML éventuelles
    const withoutHtml = text.replace(/<[^>]*>/g, " ");
    // Remplace les sauts de ligne (\n ou \r) par des espaces et normalise les espaces multiples
    const singleLine = withoutHtml.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
    // Tronque proprement à 160 caractères
    if (singleLine.length <= maxLength) {
        return singleLine;
    }
    return singleLine.slice(0, maxLength).trim();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { lang, slug } = await params;
    const [product, storeSettings] = await Promise.all([
        findProductBySlug(lang, slug),
        getStoreSettings(),
    ]);
    
    if (!product) {
        return {
            title: "Product Not Found",
        };
    }

    const brandName = storeSettings.brandName || brandConfig.identity.name || "Store";
    const productName = getLocalizedField(product.name, lang) || (lang === 'fr' ? product.nameFr : product.nameEn) || "Product";

    // 1 & 2. Title : ${product.name} | ${settings.brandName}
    const pageTitle = `${productName} | ${brandName}`;

    // 2. Description : product.intro en priorité, sinon product.description nettoyé et tronqué à 160 caractères
    const rawIntro = getLocalizedField(product.intro, lang) || (lang === 'fr' ? product.introFr : product.introEn);
    const rawDescription = getLocalizedField(product.description, lang) || (lang === 'fr' ? product.descriptionFr : product.descriptionEn) || "";
    const chosenDescriptionText = (rawIntro && rawIntro.trim().length > 0) ? rawIntro : rawDescription;
    const cleanedDescription = cleanDescription(chosenDescriptionText, 160);

    // 2. Keywords : [nom_catégorie, settings.brandName, product.name]
    const catIds = product.categoryIds || (product.categoryId ? [product.categoryId] : []);
    let categoryName = "";
    if (product.category) {
        categoryName = getLocalizedField(product.category.name, lang) || (lang === 'fr' ? product.category.nameFr : product.category.nameEn) || "";
    } else if (catIds.length > 0) {
        try {
            const catDoc = await adminDb.collection("categories").doc(catIds[0]).get();
            if (catDoc.exists) {
                const catData = catDoc.data() as Category;
                categoryName = getLocalizedField(catData.name, lang) || (lang === 'fr' ? catData.nameFr : catData.nameEn) || "";
            }
        } catch (error) {
            console.error("[GENERATE_METADATA_CATEGORY_FETCH_ERROR]", error);
        }
    }

    const rawKeywords = categoryName
        ? [categoryName, brandName, productName]
        : [brandName, productName];
    const keywords = rawKeywords.filter((k): k is string => Boolean(k && k.trim().length > 0));

    // 3. Open Graph & Twitter Cards : première image du produit (product.images[0])
    const firstImage = (product.images && product.images.length > 0)
        ? product.images[0]
        : (product.imageUrl || null);

    // 4. URL Canonique : process.env.NEXT_PUBLIC_APP_URL + chemin du produit
    const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || brandConfig.identity.url || "";
    const baseUrl = rawBaseUrl.replace(/\/+$/, "");
    const productSlug = getLocalizedField(product.slug, lang) || (lang === 'fr' ? product.slugFr : product.slugEn) || slug;
    const canonicalUrl = `${baseUrl}/${lang}/product/${productSlug}`;

    // 5. Attribution de l'Artiste : product.artist || product.vendor || settings.brandName
    const artistOrVendor = product.artist?.trim() || product.vendor?.trim();
    const authorName = artistOrVendor || brandName;

    return {
        title: {
            absolute: pageTitle,
        },
        description: cleanedDescription,
        keywords: keywords,
        authors: [{ name: authorName }],
        creator: authorName,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title: pageTitle,
            description: cleanedDescription,
            url: canonicalUrl,
            type: "website",
            ...(firstImage ? { images: [firstImage] } : {}),
        },
        twitter: {
            card: "summary_large_image",
            title: pageTitle,
            description: cleanedDescription,
            ...(firstImage ? { images: [firstImage] } : {}),
        },
        other: {
            "og:type": "product",
        },
    };
}

export default async function ProductPage({ params }: PageProps) {
    const { lang, slug } = await params;
    const product = await findProductBySlug(lang, slug);

    if (!product) {
        notFound();
    }

    const [dict, storeSettings] = await Promise.all([
        getDictionary(lang as Locale),
        getStoreSettings(),
    ]);
    const shopDict = dict.shop;
    const currency = storeSettings.defaultCurrency || "THB";
    const catalogSlug = storeSettings.catalogSlug || "shop";

    const title = getLocalizedField(product.name, lang) || (lang === 'fr' ? product.nameFr : product.nameEn) || "Product";
    const description = getLocalizedField(product.description, lang) || (lang === 'fr' ? product.descriptionFr : product.descriptionEn) || "";
    const intro = getLocalizedField(product.intro, lang) || (lang === 'fr' ? product.introFr : product.introEn) || "";
    
    // Normalisation multi-images avec fallback placeholder de la marque
    const productImages = (product.images && product.images.length > 0)
        ? product.images
        : (product.imageUrl ? [product.imageUrl] : []);
    const images = productImages.length > 0 ? productImages : [brandConfig.assets.placeholderImage];
    const isCartEnabled = (process.env.ENABLE_CART || process.env.NEXT_PUBLIC_ENABLE_CART) !== "false";
    const isOutOfStock = (product.stock ?? 0) <= 0;

    // Load assigned categories
    const catIds = product.categoryIds || (product.categoryId ? [product.categoryId] : []);
    let assignedCategories: Category[] = [];
    if (catIds.length > 0) {
        const catDocs = await Promise.all(
            catIds.map(id => adminDb.collection("categories").doc(id).get())
        );
        assignedCategories = catDocs.filter(d => d.exists).map(d => ({ id: d.id, ...d.data() } as Category));
    }

    return (
        <main className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                {/* Left column: Gallery */}
                <div className="w-full">
                    <ProductGallery images={images} title={title} />
                </div>

                {/* Right column: Content */}
                <div className="flex flex-col space-y-6">
                    <div>
                        {assignedCategories.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {assignedCategories.map((cat) => {
                                    const catName = getLocalizedField(cat.name, lang) || (lang === 'fr' ? cat.nameFr : cat.nameEn);
                                    const catSlug = getLocalizedField(cat.slug, lang) || (lang === 'fr' ? cat.slugFr : cat.slugEn);
                                    return (
                                        <Link key={cat.id} href={`/${lang}/${catalogSlug}?category=${catSlug}`}>
                                            <Badge variant="secondary" className="hover:bg-primary/20 transition-colors text-xs font-normal">
                                                {catName}
                                            </Badge>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">{title}</h1>
                        <div className="mt-4 flex items-center gap-3">
                            <p className="text-3xl font-semibold text-foreground">
                                {formatPrice(product.price, currency, lang)}
                            </p>
                            {isOutOfStock && (
                                <Badge variant="destructive" className="uppercase font-bold tracking-wider text-xs px-2.5 py-1">
                                    Sold Out
                                </Badge>
                            )}
                        </div>
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
        </main>
    );
}
