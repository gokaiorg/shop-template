import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { adminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import { PageForm } from "@/components/admin/PageForm";
import { Page } from "@/types/database";

export default async function AdminPageEdit({ params }: { params: Promise<{ lang: string; slug: string }> }) {
    const { lang, slug } = await params;

    // Fetch dictionary and page data in parallel
    const [dict, pageDoc] = await Promise.all([
        getDictionary(lang as Locale),
        adminDb.collection("pages").doc(slug).get()
    ]);

    if (!pageDoc.exists) {
        notFound();
    }

    const data = pageDoc.data();
    const pageData: any = {
        id: pageDoc.id,
        ...data,
        updatedAt: data?.updatedAt ? data.updatedAt.toDate().toISOString() : null,
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{dict.admin.pages_edit}</h1>
                <p className="text-muted-foreground">{lang === 'fr' ? `Modifier la page : ${slug}` : `Editing page: ${slug}`}</p>
            </div>

            <div className="bg-background border rounded-lg p-6">
                <PageForm dict={dict.admin} lang={lang} initialData={pageData} />
            </div>
        </div>
    );
}
