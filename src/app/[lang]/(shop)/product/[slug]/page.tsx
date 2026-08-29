import { Metadata } from "next";
import Link from "next/link";
import { adminDb } from "@/lib/firebase-admin";
import { Category, Product } from "@/types/database";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { AddToCartButton } from "@/components/shop/AddToCartButton";
import { Badge } from "@/components/ui/badge";
import { brandConfig } from "@/config/brand.config";
import { getLocalizedField } from "@/lib/i18n";

interface PageProps {
    params: Promise<{ lang: string; slug: string }>;
}

async function findProductBySlug(lang: string, slug: string): Promise<Product | null> {
    // 1. Query nested slug map
    let snapshot = await adminDb.collection("products").where(`slug.${lang}`, "==", slug).limit(1).get();
    if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            createdAt: data?.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data?.createdAt || null),
            updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data?.updatedAt || null),
        } as Product;
    }

    // 2. Query legacy flat slug fields
    const legacyField = lang === 'fr' ? 'slugFr' : 'slugEn';
    snapshot = await adminDb.collection("products").where(legacyField, "==", slug).limit(1).get();
    if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        return {
            ...data,
            id: doc.id,
            createdAt: data?.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data?.createdAt || null),
            updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data?.updatedAt || null),
        } as Product;
    }

    // 3. Fallback: Scan collection
    const allSnapshot = await adminDb.collection("products").get();
    for (const doc of allSnapshot.docs) {
        const data = doc.data() as Product;
        const localizedSlug = getLocalizedField(data.slug, lang) || (lang === 'fr' ? data.slugFr : data.slugEn);
        if (localizedSlug === slug || data.slugEn === slug || data.slugFr === slug) {
            return {
                ...data,
                id: doc.id,
                createdAt: (data?.createdAt as any)?.toDate ? (data.createdAt as any).toDate().toISOString() : (data?.createdAt || null),
                updatedAt: (data?.updatedAt as any)?.toDate ? (data.updatedAt as any).toDate().toISOString() : (data?.updatedAt || null),
            } as Product;
        }
    }

    return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { lang, slug } = await params;
    const product = await findProductBySlug(lang, slug);
    
    if (!product) {
        return {
            title: "Product Not Found",
        };
    }

    const title = getLocalizedField(product.name, lang) || (lang === 'fr' ? product.nameFr : product.nameEn) || "Product";
    const description = getLocalizedField(product.description, lang) || (lang === 'fr' ? product.descriptionFr : product.descriptionEn) || "";

    return {
        title: title,
        description: description,
    };
}

export default async function ProductPage({ params }: PageProps) {
    const { lang, slug } = await params;
    const product = await findProductBySlug(lang, slug);

    if (!product) {
        notFound();
    }

    const dict = await getDictionary(lang as Locale);
    const shopDict = dict.shop;

    const title = getLocalizedField(product.name, lang) || (lang === 'fr' ? product.nameFr : product.nameEn) || "Product";
    const description = getLocalizedField(product.description, lang) || (lang === 'fr' ? product.descriptionFr : product.descriptionEn) || "";
    const intro = getLocalizedField(product.intro, lang) || (lang === 'fr' ? product.introFr : product.introEn) || "";
    
    const imageUrl = product.imageUrl
        || (product.images && product.images.length > 0 ? product.images[0] : null)
        || brandConfig.assets.placeholderImage;

    const isCartEnabled = process.env.NEXT_PUBLIC_ENABLE_CART !== "false";

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
                {/* Left column: Image */}
                <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
                    <Image
                        src={imageUrl}
                        alt={title}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                        priority
                    />
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
                                        <Link key={cat.id} href={`/${lang}/shop?category=${catSlug}`}>
                                            <Badge variant="secondary" className="hover:bg-primary/20 transition-colors text-xs font-normal">
                                                {catName}
                                            </Badge>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground">{title}</h1>
                        <p className="mt-4 text-3xl font-semibold text-foreground">
                            ${product.price.toFixed(2)}
                        </p>
                    </div>

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
