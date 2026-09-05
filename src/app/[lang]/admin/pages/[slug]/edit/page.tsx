import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { adminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import { PageForm } from "@/components/admin/PageForm";
import { protectAdminRoute } from "@/lib/auth-utils";
import { formatPageDoc } from "@/lib/services/pages";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FileText } from "lucide-react";

export default async function AdminPageEdit({ params }: { params: Promise<{ lang: string; slug: string }> }) {
    const { lang, slug } = await params;
    await protectAdminRoute(lang);

    // Fetch dictionary and page data in parallel
    const dict = await getDictionary(lang as Locale);
    let pageDoc = await adminDb.collection("pages").doc(slug).get();

    if (!pageDoc.exists) {
        // Try searching by slug field
        const snap = await adminDb.collection("pages").where("slug", "==", slug).limit(1).get();
        if (snap.empty) {
            notFound();
        }
        pageDoc = snap.docs[0];
    }

    const pageData = formatPageDoc(pageDoc);

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title={dict.admin.pages_edit || (lang === 'fr' ? 'Modifier la page' : 'Edit Page')}
                description={lang === 'fr' ? `Modifier la page : ${slug}` : `Editing page: ${slug}`}
                icon={FileText}
            />

            <PageForm dict={dict.admin} lang={lang} initialData={pageData} />
        </div>
    );
}
