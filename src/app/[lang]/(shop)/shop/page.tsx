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
    // Safety map to convert Firestore Timestamps to strings
    const serializeFirestoreData = (docId: string, data: Record<string, any>) => {
        const result = { ...data, id: docId } as any;
        
        if (result.createdAt) {
            result.createdAt = typeof result.createdAt.toDate === 'function' 
                ? result.createdAt.toDate().toISOString() 
                : new Date(result.createdAt).toISOString();
        } else {
            result.createdAt = null;
        }
        
        if (result.updatedAt) {
            result.updatedAt = typeof result.updatedAt.toDate === 'function' 
                ? result.updatedAt.toDate().toISOString() 
                : new Date(result.updatedAt).toISOString();
        } else {
            result.updatedAt = null;
        }

        return result;
    };

    const params = await props.params;
    const searchParams = await props.searchParams;
    const { lang } = params;

    // Parse the category from search parameters
    const categoryQuery = searchParams.category;
    const currentCategorySlug = typeof categoryQuery === 'string' ? categoryQuery : null;

    // Optimization: Avoid data fetching waterfall by starting independent requests concurrently
    const dictPromise = getDictionary(lang as Locale);
    const categoriesPromise = adminDb.collection('categories').orderBy('nameEn', 'asc').get();

    // If no category filter is applied, we can start fetching products concurrently to reduce TTFB
    // We attach a dummy catch to prevent unhandled promise rejections if Promise.all fails before we await this.
    let productsPromise: Promise<FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>> | undefined;
    if (!currentCategorySlug) {
        productsPromise = adminDb.collection('products').orderBy('createdAt', 'desc').get();
        productsPromise.catch(() => {});
    }

    // Await dictionary and categories as an explicit tuple to maintain typing,
    // and let productsPromise run in the background (to be awaited later if needed).
    const [dict, categoriesSnapshot] = await Promise.all([dictPromise, categoriesPromise]);

    const categories = categoriesSnapshot.docs.map(doc => 
        serializeFirestoreData(doc.id, doc.data()) as Category
    );

    let productsSnapshot;
    if (currentCategorySlug) {
        // We must wait to build the query for products based on the requested category
        let productsQuery: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = adminDb.collection('products');
        const catId = categories.find((c: Category) => lang === 'fr' ? c.slugFr === currentCategorySlug : c.slugEn === currentCategorySlug)?.id;

        if (catId) {
            productsQuery = productsQuery.where('categoryId', '==', catId);
        } else {
            productsQuery = productsQuery.where('categoryId', '==', 'NOT_FOUND');
        }
        productsQuery = productsQuery.orderBy('createdAt', 'desc');
        productsSnapshot = await productsQuery.get();
    } else {
        // Use the concurrently started products fetch result
        productsSnapshot = await productsPromise!;
    }
    const productsList = productsSnapshot.docs.map(doc => 
        serializeFirestoreData(doc.id, doc.data()) as Product
    );

    const categoryMap = new Map(categories.map(c => [c.id, c]));

    const products = productsList.map(product => ({
        ...product,
        category: categoryMap.get(product.categoryId) || null
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
                            product={product}
                            lang={lang}
                            dict={dict.shop || dict}
                        />
                    ))}
                </div>
            )}
        </main>
    );
}
