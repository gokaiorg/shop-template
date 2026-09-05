import { ProductForm } from "@/components/admin/ProductForm";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { adminDb } from "@/lib/firebase-admin";
import { Category } from "@/types/database";
import { getStoreSettings } from "@/lib/services/settings";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Package } from "lucide-react";

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
        <div className="space-y-6">
            <AdminPageHeader
                title={dict.admin.products_create}
                description={lang === 'fr' ? 'Remplissez le formulaire pour créer un nouveau produit.' : 'Fill in the form to create a new product.'}
                icon={Package}
            />
            <div className="bg-background border rounded-lg p-6">
                <ProductForm
                    categories={categories}
                    dict={dict.admin.forms}
                    lang={lang}
                    vendors={storeSettings.vendors || []}
                />
            </div>
        </div>
    );
}
