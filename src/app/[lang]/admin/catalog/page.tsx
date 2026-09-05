import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { getStoreSettings } from "@/lib/services/settings";
import { CatalogSettingsForm } from "@/components/admin/CatalogSettingsForm";
import { BookOpen } from "lucide-react";
import { protectAdminRoute } from "@/lib/auth-utils";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export default async function AdminCatalogPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    await protectAdminRoute(lang);

    const [dict, storeSettings] = await Promise.all([
        getDictionary(lang as Locale),
        getStoreSettings(),
    ]);

    const isFr = lang === "fr";

    return (
        <div className="space-y-10 max-w-5xl">
            <AdminPageHeader
                title={isFr ? "Paramètres du Catalogue" : "Catalog Settings"}
                description={isFr
                    ? "Configurez le routage public (slug d'URL), les titres localisés, la description d'archive et la bannière de votre catalogue."
                    : "Configure public routing (URL slug), localized titles, archive descriptions, and banner artwork for your catalog."}
                icon={BookOpen}
            />

            {/* Catalog Settings Form */}
            <div className="space-y-6">
                <CatalogSettingsForm 
                    initialData={storeSettings} 
                    lang={lang} 
                    dict={dict.admin} 
                />
            </div>
        </div>
    );
}
