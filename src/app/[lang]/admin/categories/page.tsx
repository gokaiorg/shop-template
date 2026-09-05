import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { adminDb } from "@/lib/firebase-admin";
import { protectAdminRoute } from "@/lib/auth-utils";
import { getLocalizedField } from "@/lib/i18n";
import { CategoryTable } from "@/components/admin/CategoryTable";

export default async function AdminCategoriesPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    await protectAdminRoute(lang);

    // Fetch dictionary and categories in parallel to reduce TTFB
    const [dict, categoriesSnapshot] = await Promise.all([
        getDictionary(lang as Locale),
        adminDb.collection("categories").orderBy("order", "asc").get()
    ]);

    // Optimize N+1 query problem by batching product counts
    const rawCategories = await Promise.all(categoriesSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const cat: any = { 
            id: doc.id, 
            ...data,
            order: typeof data.order === 'number' ? data.order : 0,
            createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
            updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
        };

        // This count query would ideally be denormalized or batched for production
        // But for now we are using aggregate to get counts effectively
        const aggregateQuery = adminDb.collection("products").where("categoryIds", "array-contains", cat.id).count();
        const aggregateSnapshot = await aggregateQuery.get();

        return { ...cat, _count: { products: aggregateSnapshot.data().count } };
    }));

    const categories = rawCategories.sort((a, b) => {
        const orderDiff = (a.order ?? 0) - (b.order ?? 0);
        if (orderDiff !== 0) return orderDiff;
        const nameA = getLocalizedField(a.name, lang) || (lang === 'fr' ? a.nameFr : a.nameEn) || "";
        const nameB = getLocalizedField(b.name, lang) || (lang === 'fr' ? b.nameFr : b.nameEn) || "";
        return nameA.localeCompare(nameB, lang);
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{dict.admin.categories}</h1>
                    <p className="text-muted-foreground">{lang === 'fr' ? 'Gérer les catégories de votre boutique.' : 'Manage your store categories.'}</p>
                </div>
                <Button asChild>
                    <Link href={`/${lang}/admin/categories/new`}>{dict.admin.categories_create}</Link>
                </Button>
            </div>

            <CategoryTable categories={categories} lang={lang} />
        </div>
    );
}
