import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { adminDb } from "@/lib/firebase-admin";
import { Pencil } from "lucide-react";
import { protectAdminRoute } from "@/lib/auth-utils";

export default async function AdminPagesPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    await protectAdminRoute(lang);

    // Fetch dictionary and pages in parallel
    const [dict, pagesSnapshot] = await Promise.all([
        getDictionary(lang as Locale),
        adminDb.collection("pages").orderBy("updatedAt", "desc").get()
    ]);

    const pages = pagesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return { 
            id: doc.id, 
            ...data,
            updatedAt: data.updatedAt ? data.updatedAt.toDate().toISOString() : null,
        };
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{dict.admin.pages}</h1>
                    <p className="text-muted-foreground">{lang === 'fr' ? 'Gérer les pages statiques et légales de votre boutique.' : 'Manage your store static and legal pages.'}</p>
                </div>
            </div>

            <div className="bg-background border rounded-lg p-0 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                        <tr>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Slug</th>
                            <th className="px-6 py-3">Last Updated</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pages.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                                    {lang === 'fr' ? 'Aucune page trouvée.' : 'No pages found.'}
                                </td>
                            </tr>
                        ) : (
                            pages.map((page: any) => (
                                <tr key={page.id} className="border-b last:border-0 hover:bg-muted/20">
                                    <td className="px-6 py-4 font-medium">
                                        {lang === 'fr' ? page.title_fr : page.title_en}
                                    </td>
                                    <td className="px-6 py-4 text-muted-foreground">
                                        {page.id}
                                    </td>
                                    <td className="px-6 py-4">
                                        {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString(lang) : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Button variant="ghost" size="icon" asChild>
                                            <Link href={`/${lang}/admin/pages/${page.id}/edit`}>
                                                <Pencil className="w-4 h-4" />
                                                <span className="sr-only">{dict.admin.pages_edit || 'Edit Page'}</span>
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
