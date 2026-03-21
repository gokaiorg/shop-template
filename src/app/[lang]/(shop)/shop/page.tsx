import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { adminDb } from "@/lib/firebase-admin";
import { Category, Product } from "@/types/database";
import { ShopCategoryFilter } from "@/components/shop/ShopCategoryFilter";
import { ShopProductCard } from "@/components/shop/ShopProductCard";

export default async function ShopPage(
    props: {
        params: Promise<{ lang: string }>;
        searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
    }
) {
    const params = await props.params;
    const searchParams = await props.searchParams;
    const { lang } = params;

    // Parse the category from search parameters
    const categoryQuery = searchParams.category;
    const currentCategorySlug = typeof categoryQuery === 'string' ? categoryQuery : null;

    // Execute data fetching in parallel where possible
    const [dict, categoriesSnapshot] = await Promise.all([
        getDictionary(lang as Locale),
        adminDb.collection('categories').orderBy('nameEn', 'asc').get()
    ]);

    const categories = categoriesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
            updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
        } as any;
    });

    // Build the query for products based on the requested category
    let productsQuery: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = adminDb.collection('products');
    
    if (currentCategorySlug) {
        // We first need the categoryId to query products
        const catId = categories.find((c: any) => lang === 'fr' ? c.slugFr === currentCategorySlug : c.slugEn === currentCategorySlug)?.id;
        if (catId) {
            productsQuery = productsQuery.where('categoryId', '==', catId);
        } else {
            productsQuery = productsQuery.where('categoryId', '==', 'NOT_FOUND');
        }
    }

    productsQuery = productsQuery.orderBy('createdAt', 'desc');

    const productsSnapshot = await productsQuery.get();
    const productsList = productsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
            updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
        } as any;
    });

    const products = productsList.map(product => ({
        ...product,
        category: categories.find((c: any) => c.id === product.categoryId)!
    }));

    return (
        <main className="container mx-auto px-4 md:px-8 py-8">
            <h1 className="text-3xl font-bold mb-8">{dict.header?.shop || "Shop"}</h1>

            <ShopCategoryFilter
                categories={categories}
                currentCategorySlug={currentCategorySlug}
                lang={lang}
                dict={dict.shop || dict}
            />

            {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-muted/20 rounded-lg border border-dashed">
                    <p className="text-muted-foreground text-lg">
                        {dict.shop?.empty_state || "No products found."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => (
                        <ShopProductCard
                            key={product.id}
                            product={product as any}
                            lang={lang}
                            dict={dict.shop || dict}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}
