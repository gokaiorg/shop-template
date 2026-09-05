import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { adminDb } from "@/lib/firebase-admin";
import { protectAdminRoute } from "@/lib/auth-utils";
import { getStoreSettings } from "@/lib/services/settings";
import { ProductTable } from "@/components/admin/ProductTable";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Package } from "lucide-react";

export default async function AdminProductsPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    await protectAdminRoute(lang);

    // Safe fetch for products with graceful fallback while composite index is building on Google Cloud
    const fetchProducts = async () => {
        try {
            return await adminDb.collection("products").orderBy("order", "asc").get();
        } catch (e: any) {
            console.warn("Index fallback for products table query:", e?.message);
            return await adminDb.collection("products").get();
        }
    };

    // Fetch dictionary, settings, categories, and products in parallel to reduce TTFB
    const [dict, storeSettings, categoriesSnapshot, productsSnapshot] = await Promise.all([
        getDictionary(lang as Locale),
        getStoreSettings(),
        adminDb.collection("categories").get(),
        fetchProducts()
    ]);
    const currency = storeSettings?.defaultCurrency || "THB";

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
                order: typeof data.order === 'number' ? data.order : 0,
                createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
                updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
            };
            const catIds = prod.categoryIds || (prod.categoryId ? [prod.categoryId] : []);
            const categories = catIds.map((id: string) => categoryMap.get(id)).filter(Boolean);
            return { ...prod, categoryIds: catIds, categories };
        })
        .sort((a: any, b: any) => {
            const orderDiff = (a.order ?? 0) - (b.order ?? 0);
            if (orderDiff !== 0) return orderDiff;
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title="Products"
                description={lang === 'fr' ? 'Gérer les produits de votre boutique.' : 'Manage your store products.'}
                icon={Package}
            >
                <Button asChild>
                    <Link href={`/${lang}/admin/products/new`}>{dict.admin?.products_create || "Create Product"}</Link>
                </Button>
            </AdminPageHeader>

            <ProductTable products={products} categories={categoriesList} currency={currency} lang={lang} />
        </div>
    );
}
