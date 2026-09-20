import { auth } from "@/auth";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { getStoreSettings } from "@/lib/services/settings";
import { AdminAboutBlockForm } from "@/components/admin/AdminAboutBlockForm";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { BookOpen } from "lucide-react";
import { protectAdminRoute } from "@/lib/auth-utils";

export default async function AdminAboutBlockPage({
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
            title={isFr ? "Modifier la section À propos" : "Edit About Section"}
            description={
                isFr
                    ? "Mettez en valeur votre savoir-faire et l'histoire de votre boutique avec un carrousel d'images."
                    : "Highlight your brand story, craft, and values with an interactive photo carousel."
            }
            icon={BookOpen}
            hasStickyFooter={true}
        >
            <AdminAboutBlockForm initialData={storeSettings} lang={lang} dict={adminDict} />
        </AdminPageLayout>
    );
}
