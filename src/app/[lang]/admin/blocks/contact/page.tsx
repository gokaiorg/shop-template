import { auth } from "@/auth";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { getStoreSettings } from "@/lib/services/settings";
import { AdminContactBlockForm } from "@/components/admin/AdminContactBlockForm";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Mail } from "lucide-react";
import { protectAdminRoute } from "@/lib/auth-utils";

export default async function AdminContactBlockPage({
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
            title={isFr ? "Modifier la section Contact" : "Edit Contact Section"}
            description={
                isFr
                    ? "Configurez les titres, descriptions et le formulaire de contact de votre boutique."
                    : "Configure headings, descriptions, and the contact inquiry form for your storefront."
            }
            icon={Mail}
            hasStickyFooter={true}
        >
            <AdminContactBlockForm initialData={storeSettings} lang={lang} dict={adminDict} />
        </AdminPageLayout>
    );
}
