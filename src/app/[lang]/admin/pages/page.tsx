import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { adminDb } from "@/lib/firebase-admin";
import { Plus, FileText } from "lucide-react";
import { protectAdminRoute } from "@/lib/auth-utils";
import { formatPageDoc } from "@/lib/services/pages";
import { PageTable } from "@/components/admin/PageTable";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";

export default async function AdminPagesPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    await protectAdminRoute(lang);

    // Fetch dictionary and pages in parallel
    const [dict, pagesSnapshot] = await Promise.all([
        getDictionary(lang as Locale),
        adminDb.collection("pages").get()
    ]);

    const pages = pagesSnapshot.docs
        .map(formatPageDoc)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return (
        <AdminPageLayout
            title={dict.admin.pages}
            description={lang === 'fr' 
                ? 'Pages de contenu, mentions légales et navigation.' 
                : 'Content pages, legal notices, and navigation.'}
            icon={FileText}
            actions={
                <Button asChild className="gap-2">
                    <Link href={`/${lang}/admin/pages/new`}>
                        <Plus className="w-4 h-4" />
                        {lang === 'fr' ? 'Créer une page' : 'Create Page'}
                    </Link>
                </Button>
            }
        >
            <PageTable pages={pages} lang={lang} />
        </AdminPageLayout>
    );
}
