import { auth } from "@/auth";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { getStoreSettings } from "@/lib/services/settings";
import { AdminFaqBlockForm } from "@/components/admin/AdminFaqBlockForm";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { HelpCircle } from "lucide-react";
import { protectAdminRoute } from "@/lib/auth-utils";

export default async function AdminFaqBlockPage({
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
            title={isFr ? "Modifier la section FAQ" : "Edit FAQ Section"}
            description={
                isFr
                    ? "Gérez les questions et réponses de votre FAQ interactive et améliorez votre visibilité avec les données structurées FAQPage."
                    : "Manage questions and answers for your interactive FAQ and boost search visibility with FAQPage structured data."
            }
            icon={HelpCircle}
            hasStickyFooter={true}
        >
            <AdminFaqBlockForm
                key={storeSettings.updatedAt ? String(storeSettings.updatedAt) : "faq-form"}
                initialData={storeSettings}
                lang={lang}
                dict={adminDict}
            />
        </AdminPageLayout>
    );
}
