import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { adminDb } from "@/lib/firebase-admin";
import { Category, Product } from "@/types/database";

export default async function AdminProductsPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;

    // Fetch dictionary, categories, and products in parallel to reduce TTFB
    const [dict, categoriesSnapshot, productsSnapshot] = await Promise.all([
        getDictionary(lang as Locale),
        adminDb.collection("categories").get(),
        adminDb.collection("products").orderBy("createdAt", "desc").get()
    ]);

    const categoriesList = categoriesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
            updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
        } as any;
    });
    const categoryMap = new Map(categoriesList.map((c: any) => [c.id, c]));

    const products = productsSnapshot.docs
        .map(doc => {
            const data = doc.data();
            const prod: any = {
                id: doc.id,
                ...data,
                createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
                updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
            };
            const category = categoryMap.get(prod.categoryId);
            if (!category) {
                console.warn(`Product with id ${prod.id} has an invalid categoryId ${prod.categoryId}`);
                return null;
            }
            return { ...prod, category };
        })
        .filter(Boolean);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Products</h1>
                    <p className="text-muted-foreground">Manage your store products.</p>
                </div>
                <Button asChild>
                    <Link href={`/${lang}/admin/products/new`}>Create Product</Link>
                </Button>
            </div>

            <div className="bg-background border rounded-lg p-0 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                        <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Category</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Price</th>
                            <th className="px-6 py-3">Stock</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                    No products found. Generate demo data or create a new product.
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.id} className="border-b last:border-0 hover:bg-muted/20">
                                    <td className="px-6 py-4 font-medium">
                                        {lang === 'fr' ? product.nameFr : product.nameEn}
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {lang === 'fr' ? product.category.nameFr : product.category.nameEn}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${(product.statusEn === 'published' || product.statusFr === 'publié')
                                                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}>
                                            {lang === 'fr' ? product.statusFr : product.statusEn}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">${product.price.toFixed(2)}</td>
                                    <td className="px-6 py-4">{product.stock}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
