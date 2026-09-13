import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { PageForm } from "@/components/admin/PageForm";
import { protectAdminRoute } from "@/lib/auth-utils";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { FilePlus } from "lucide-react";

export default async function AdminPageNew({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    await protectAdminRoute(lang);

    const dict = await getDictionary(lang as Locale);

    return (
        <AdminPageLayout
            title={lang === 'fr' ? 'Créer une page' : 'Create Page'}
            description={lang === 'fr'
                ? 'Créer une page de contenu ou légale.'
                : 'Create a content or legal page.'}
            icon={FilePlus}
            hasStickyFooter={true}
        >
            <PageForm dict={dict.admin} lang={lang} initialData={null} />
        </AdminPageLayout>
    );
}
