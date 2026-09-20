import { auth } from "@/auth";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { getStoreSettings } from "@/lib/services/settings";
import { BlocksTable } from "@/components/admin/BlocksTable";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Blocks } from "lucide-react";
import { protectAdminRoute } from "@/lib/auth-utils";

export default async function AdminBlocksPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    await protectAdminRoute(lang);

    const [session, dict, storeSettings] = await Promise.all([
        auth(),
        getDictionary(lang as Locale),
        getStoreSettings(),
    ]);

    if (!session?.user?.id) {
        return null;
    }

    const adminDict = dict.admin || {};
    const isFr = lang === "fr";

    return (
        <AdminPageLayout
            title={adminDict.blocks || (isFr ? "Blocs éditoriaux" : "Editorial Blocks")}
            description={
                isFr
                    ? "Gérez les blocs de contenu personnalisés et modulaires de votre boutique."
                    : "Manage custom modular content blocks for your storefront."
            }
            icon={Blocks}
            hasStickyFooter={false}
        >
            <BlocksTable settings={storeSettings} lang={lang} />
        </AdminPageLayout>
    );
}
