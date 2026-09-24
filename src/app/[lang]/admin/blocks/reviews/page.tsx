import { auth } from "@/auth";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { getStoreSettings } from "@/lib/services/settings";
import { AdminReviewBlockForm } from "@/components/admin/AdminReviewBlockForm";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Star } from "lucide-react";
import { protectAdminRoute } from "@/lib/auth-utils";

export default async function AdminReviewBlockPage({
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
            title={isFr ? "Modifier la section Avis Clients" : "Edit Reviews Section"}
            description={
                isFr
                    ? "Gérez l'affichage dynamique de vos avis Google My Business / Google Places pour renforcer la réassurance de vos clients."
                    : "Manage dynamic Google My Business / Google Places customer reviews to boost trust and conversion."
            }
            icon={Star}
            hasStickyFooter={true}
        >
            <AdminReviewBlockForm
                key={storeSettings.updatedAt ? String(storeSettings.updatedAt) : "review-form"}
                initialData={storeSettings}
                lang={lang}
                dict={adminDict}
            />
        </AdminPageLayout>
    );
}
