import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { getStoreSettings } from "@/lib/services/settings";
import { CatalogSettingsForm } from "@/components/admin/CatalogSettingsForm";
import { protectAdminRoute } from "@/lib/auth-utils";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { BookOpen } from "lucide-react";

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
        <AdminPageLayout
            title={isFr ? "Paramètres du Catalogue" : "Catalog Settings"}
            description={isFr
                ? "Routage public, titres d'affichage et bannière du catalogue."
                : "Public routing, display titles, and catalog banner."}
            icon={BookOpen}
            hasStickyFooter={true}
        >
            <CatalogSettingsForm 
                initialData={storeSettings} 
                lang={lang} 
                dict={dict.admin} 
            />
        </AdminPageLayout>
    );
}
