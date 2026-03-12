import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import prisma from "@/lib/prisma";
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

    // Build the query for products based on the requested category
    // If we have a category slug, we find the corresponding category record 
    // depending on the active language slug
    let categoryFilter = {};
    if (currentCategorySlug) {
        if (lang === 'fr') {
            categoryFilter = { category: { slugFr: currentCategorySlug } };
        } else {
            categoryFilter = { category: { slugEn: currentCategorySlug } };
        }
    }

    // Execute data fetching and dictionary loading in parallel
    // This optimization reduces TTFB by fetching independent data concurrently
    const [dict, categories, products] = await Promise.all([
        getDictionary(lang as Locale),
        prisma.category.findMany({
            orderBy: { nameEn: 'asc' },
        }),
        prisma.product.findMany({
            where: {
                ...categoryFilter,
                // To ensure we only load visible products,
                // optionally you can filter by status.
                // e.g., OR: [{ statusEn: 'published' }, { statusFr: 'publié' }]
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                category: true, // we can include the category if we need its details later
            }
        })
    ]);

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
