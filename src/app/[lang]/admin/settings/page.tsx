import { auth } from "@/auth";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { getStoreSettings } from "@/lib/services/settings";
import { StoreSettingsForm } from "@/components/admin/StoreSettingsForm";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Settings } from "lucide-react";

export default async function AdminSettingsPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const [session, dict, storeSettings] = await Promise.all([
        auth(),
        getDictionary(lang as Locale),
        getStoreSettings(),
    ]);

    if (!session?.user?.id) {
        return null;
    }

    const adminDict = dict.admin || {};

    return (
        <AdminPageLayout
            title={adminDict.settings || "Settings"}
            description={lang === 'fr'
                ? "Identité de marque, bannières, thème et réseaux sociaux."
                : "Brand identity, banners, theme, and social links."}
            icon={Settings}
            hasStickyFooter={true}
        >
            <StoreSettingsForm initialData={storeSettings} lang={lang} dict={adminDict} />
        </AdminPageLayout>
    );
}
