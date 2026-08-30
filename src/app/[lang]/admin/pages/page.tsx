import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminDb } from "@/lib/firebase-admin";
import { Pencil, Plus, ExternalLink, Globe } from "lucide-react";
import { protectAdminRoute } from "@/lib/auth-utils";
import { getLocalizedField } from "@/lib/i18n";
import { formatPageDoc } from "@/lib/services/pages";

export default async function AdminPagesPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    await protectAdminRoute(lang);

    // Fetch dictionary and pages in parallel
    const [dict, pagesSnapshot] = await Promise.all([
        getDictionary(lang as Locale),
        adminDb.collection("pages").orderBy("updatedAt", "desc").get()
    ]);

    const pages = pagesSnapshot.docs.map(formatPageDoc);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{dict.admin.pages}</h1>
                    <p className="text-muted-foreground">
                        {lang === 'fr' 
                            ? 'Gérer les pages statiques, légales et de contenu de votre boutique.' 
                            : 'Manage custom content, legal, and storefront pages.'}
                    </p>
                </div>
                <Button asChild className="gap-2">
                    <Link href={`/${lang}/admin/pages/new`}>
                        <Plus className="w-4 h-4" />
                        {lang === 'fr' ? 'Créer une page' : 'Create Page'}
                    </Link>
                </Button>
            </div>

            <div className="bg-background border rounded-lg p-0 overflow-hidden shadow-sm">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                        <tr>
                            <th className="px-6 py-3">Title</th>
                            <th className="px-6 py-3">Slug (URL)</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Navigation</th>
                            <th className="px-6 py-3">Last Updated</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pages.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                                    <Globe className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                                    <p className="font-medium">{lang === 'fr' ? 'Aucune page personnalisée.' : 'No pages created yet.'}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {lang === 'fr' ? 'Cliquez sur "Créer une page" pour ajouter une page.' : 'Click "Create Page" to create your first content page.'}
                                    </p>
                                </td>
                            </tr>
                        ) : (
                            pages.map((page) => {
                                const title = getLocalizedField(page.title, lang) || (lang === 'fr' ? page.title_fr : page.title_en) || page.slug;
                                return (
                                    <tr key={page.id} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                                        <td className="px-6 py-4 font-medium">
                                            {title}
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                                            /pages/{page.slug}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Badge variant={page.status === 'published' ? 'default' : 'secondary'}>
                                                {page.status === 'published' ? 'Published' : 'Draft'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-1.5">
                                                {page.showInHeader && (
                                                    <Badge variant="outline" className="text-[10px]">
                                                        Header
                                                    </Badge>
                                                )}
                                                {page.showInFooter && (
                                                    <Badge variant="outline" className="text-[10px]">
                                                        Footer
                                                    </Badge>
                                                )}
                                                {!page.showInHeader && !page.showInFooter && (
                                                    <span className="text-xs text-muted-foreground">-</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-muted-foreground">
                                            {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString(lang) : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button variant="ghost" size="icon" asChild title="View public page">
                                                    <Link href={`/${lang}/pages/${page.slug}`} target="_blank" rel="noopener noreferrer">
                                                        <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="icon" asChild title="Edit page">
                                                    <Link href={`/${lang}/admin/pages/${page.id}/edit`}>
                                                        <Pencil className="w-4 h-4" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
