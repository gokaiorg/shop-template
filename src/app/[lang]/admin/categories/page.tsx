import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { adminDb } from "@/lib/firebase-admin";
import { Category } from "@/types/database";

export default async function AdminCategoriesPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;

    // Fetch dictionary and categories in parallel to reduce TTFB
    const [dict, categoriesSnapshot] = await Promise.all([
        getDictionary(lang as Locale),
        adminDb.collection("categories").orderBy("createdAt", "desc").get()
    ]);

    // Optimize N+1 query problem by batching product counts
    const categories = await Promise.all(categoriesSnapshot.docs.map(async (doc) => {
        const data = doc.data();
        const cat: any = { 
            id: doc.id, 
            ...data,
            createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
            updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
        };

        // This count query would ideally be denormalized or batched for production
        // But for now we are using aggregate to get counts effectively
        const aggregateQuery = adminDb.collection("products").where("categoryId", "==", cat.id).count();
        const aggregateSnapshot = await aggregateQuery.get();

        return { ...cat, _count: { products: aggregateSnapshot.data().count } };
    }));

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

            <div className="bg-background border rounded-lg p-0 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                        <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Slug</th>
                            <th className="px-6 py-3">Products Count</th>
                            <th className="px-6 py-3">Created At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                    {lang === 'fr' ? 'Aucune catégorie trouvée. Créez une nouvelle catégorie.' : 'No categories found. Create a new category.'}
                                </td>
                            </tr>
                        ) : (
                            categories.map((category) => (
                                <tr key={category.id} className="border-b last:border-0 hover:bg-muted/20">
                                    <td className="px-6 py-4 font-medium">
                                        {lang === 'fr' ? category.nameFr : category.nameEn}
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {lang === 'fr' ? category.slugFr : category.slugEn}
                                    </td>
                                    <td className="px-6 py-4">
                                        {category._count.products}
                                    </td>
                                    <td className="px-6 py-4">
                                        {category.createdAt ? new Date(category.createdAt).toLocaleDateString(lang) : 'N/A'}
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
