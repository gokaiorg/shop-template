import { Metadata } from "next";
import { cache } from "react";
import { adminDb } from "@/lib/firebase-admin";
import { Product } from "@/types/database";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { AddToCartButton } from "@/components/shop/AddToCartButton";

interface PageProps {
    params: Promise<{ lang: string; slug: string }>;
}

const getProduct = cache(async (lang: string, slug: string) => {
    const slugField = lang === 'fr' ? 'slugFr' : 'slugEn';
    const snapshot = await adminDb.collection("products").where(slugField, "==", slug).limit(1).get();
    
    if (snapshot.empty) {
        return null;
    }

    const doc = snapshot.docs[0];
    return { doc, data: doc.data() };
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { lang, slug } = await params;
    const result = await getProduct(lang, slug);

    if (!result) {
        return {
            title: "Product Not Found",
        };
    }

    const product = result.data as Product;
    const title = lang === 'fr' ? product.nameFr : product.nameEn;
    const description = lang === 'fr' ? product.descriptionFr : product.descriptionEn;

    return {
        title: title,
        description: description,
    };
}

export default async function ProductPage({ params }: PageProps) {
    const { lang, slug } = await params;
    const result = await getProduct(lang, slug);

    if (!result) {
        notFound();
    }

    const { doc, data } = result;
    const product = {
        ...data,
        id: doc.id,
        createdAt: data?.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data?.createdAt || null),
        updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : (data?.updatedAt || null),
    } as Product;

    const dict = await getDictionary(lang as Locale);
    const shopDict = dict.shop;

    const title = lang === 'fr' ? product.nameFr : product.nameEn;
    const description = lang === 'fr' ? product.descriptionFr : product.descriptionEn;
    const intro = lang === 'fr' ? product.introFr : product.introEn;
    
    const imageUrl = product.images && product.images.length > 0
        ? product.images[0]
        : "https://images.unsplash.com/photo-1595246140625-573b715d11dc?q=80&w=2670&auto=format&fit=crop";

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
                </div>
            </div>
        </main>
    );
}
