import { ProductForm } from "@/components/admin/ProductForm";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { adminDb } from "@/lib/firebase-admin";
import { getStoreSettings } from "@/lib/services/settings";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { PlusCircle } from "lucide-react";

export default async function NewProductPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;

    // Fetch dictionary, categories and store settings in parallel to reduce TTFB
    const [dict, categoriesSnapshot, storeSettings] = await Promise.all([
        getDictionary(lang as Locale),
        adminDb.collection("categories").orderBy("order", "asc").get(),
        getStoreSettings(),
    ]);
    const categories = categoriesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate().toISOString() || null,
            updatedAt: data.updatedAt?.toDate().toISOString() || null,
        } as any;
    });

    return (
        <AdminPageLayout
            title={dict.admin.products_create}
            description={lang === 'fr' ? 'Ajouter une nouvelle référence au catalogue.' : 'Add a new item to your store catalog.'}
            icon={PlusCircle}
            hasStickyFooter={true}
        >
            <ProductForm
                categories={categories}
                dict={dict.admin.forms}
                lang={lang}
                vendors={storeSettings.vendors || []}
            />
        </AdminPageLayout>
    );
}
