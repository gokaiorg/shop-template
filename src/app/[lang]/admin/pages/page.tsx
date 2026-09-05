import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { adminDb } from "@/lib/firebase-admin";
import { Plus } from "lucide-react";
import { protectAdminRoute } from "@/lib/auth-utils";
import { formatPageDoc } from "@/lib/services/pages";
import { PageTable } from "@/components/admin/PageTable";

export default async function AdminPagesPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    await protectAdminRoute(lang);

    // Fetch dictionary and pages in parallel (fetching all pages guarantees documents without 'order' field are never excluded)
    const [dict, pagesSnapshot] = await Promise.all([
        getDictionary(lang as Locale),
        adminDb.collection("pages").get()
    ]);

    const pages = pagesSnapshot.docs
        .map(formatPageDoc)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

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

            <PageTable pages={pages} lang={lang} />
        </div>
    );
}
