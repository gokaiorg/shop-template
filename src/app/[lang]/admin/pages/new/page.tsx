import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { PageForm } from "@/components/admin/PageForm";
import { protectAdminRoute } from "@/lib/auth-utils";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { FileText } from "lucide-react";

export default async function AdminPageNew({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    await protectAdminRoute(lang);

    const dict = await getDictionary(lang as Locale);

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title={lang === 'fr' ? 'Créer une page' : 'Create Page'}
                description={lang === 'fr'
                    ? 'Ajoutez une nouvelle page personnalisée à votre site.'
                    : 'Create a new content or legal page for your storefront.'}
                icon={FileText}
            />

            <PageForm dict={dict.admin} lang={lang} initialData={null} />
        </div>
    );
}
