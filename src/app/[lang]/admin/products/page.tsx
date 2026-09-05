import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminDb } from "@/lib/firebase-admin";
import { Category, Product } from "@/types/database";
import { Pencil } from "lucide-react";
import { protectAdminRoute } from "@/lib/auth-utils";
import { getLocalizedField } from "@/lib/i18n";
import { getStoreSettings } from "@/lib/services/settings";
import { formatPrice } from "@/lib/currency";

export default async function AdminProductsPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    await protectAdminRoute(lang);

    // Fetch dictionary, settings, categories, and products in parallel to reduce TTFB
    const [dict, storeSettings, categoriesSnapshot, productsSnapshot] = await Promise.all([
        getDictionary(lang as Locale),
        getStoreSettings(),
        adminDb.collection("categories").get(),
        adminDb.collection("products").orderBy("createdAt", "desc").get()
    ]);
    const currency = storeSettings.defaultCurrency || "THB";

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
            const catIds = prod.categoryIds || (prod.categoryId ? [prod.categoryId] : []);
            const categories = catIds.map((id: string) => categoryMap.get(id)).filter(Boolean);
            return { ...prod, categoryIds: catIds, categories };
        });

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
                            <th className="px-6 py-3">Categories</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Price</th>
                            <th className="px-6 py-3">Stock</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                    No products found. Generate demo data or create a new product.
                                </td>
                            </tr>
                        ) : (
                            products.map((product) => (
                                <tr key={product.id} className="border-b last:border-0 hover:bg-muted/20">
                                    <td className="px-6 py-4 font-medium">
                                        {getLocalizedField(product.name, lang) || (lang === 'fr' ? product.nameFr : product.nameEn) || "Unnamed"}
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        <div className="flex flex-wrap gap-1">
                                            {product.categories.length > 0 ? (
                                                product.categories.map((cat: any) => (
                                                    <span key={cat.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-foreground border">
                                                        {getLocalizedField(cat.name, lang) || (lang === 'fr' ? cat.nameFr : cat.nameEn) || "Unnamed"}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-muted-foreground">None</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {(() => {
                                            const status = getLocalizedField(product.status, lang) || (lang === 'fr' ? product.statusFr : product.statusEn) || "draft";
                                            const isPublished = status === 'published' || status === 'publié';
                                            return (
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isPublished
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    }`}>
                                                    {status}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    <td className="px-6 py-4 font-medium">{formatPrice(product.price, currency, lang)}</td>
                                    <td className="px-6 py-4">
                                        {(product.stock ?? 0) > 0 ? (
                                            product.stock
                                        ) : (
                                            <Badge variant="destructive" className="text-xs">
                                                Out of stock
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/${lang}/admin/products/${product.id}/edit`}>
                                                <Pencil className="w-4 h-4" />
                                            </Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
