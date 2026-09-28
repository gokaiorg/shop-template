import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { adminDb } from "@/lib/firebase-admin";
import { Product, Category } from "@/types/database";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { getStoreSettings } from "@/lib/services/settings";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Pencil } from "lucide-react";
import { serializeFirestore } from "@/lib/utils";

export default async function EditProductPage({ params }: { params: Promise<{ lang: string, id: string }> }) {
    const { lang, id } = await params;

    const [dict, productDoc, categoriesSnap, storeSettings] = await Promise.all([
        getDictionary(lang as Locale),
        adminDb.collection("products").doc(id).get(),
        adminDb.collection("categories").orderBy("order", "asc").get(),
        getStoreSettings(),
    ]);

    if (!productDoc.exists) {
        notFound();
    }

    const rawProductData = productDoc.data();
    const serializedData = serializeFirestore(rawProductData) || {};

    const product: Product = serializeFirestore({
        ...serializedData,
        id: productDoc.id,
        createdAt: serializedData.createdAt || new Date().toISOString(),
        updatedAt: serializedData.updatedAt || new Date().toISOString(),
    });
    
    const categories: Category[] = categoriesSnap.docs.map(doc => {
        const serializedCategory = serializeFirestore(doc.data()) || {};
        return serializeFirestore({
            ...serializedCategory,
            id: doc.id,
            createdAt: serializedCategory.createdAt || new Date().toISOString(),
            updatedAt: serializedCategory.updatedAt || new Date().toISOString(),
        });
    });

    return (
        <AdminPageLayout
            title={dict.admin.products_edit || "Edit Product"}
            description={lang === 'fr' ? 'Modifier les détails et visuels du produit.' : 'Edit product details and assets.'}
            icon={Pencil}
            hasStickyFooter={true}
        >
            <ProductForm
                categories={categories}
                dict={dict.admin.forms}
                lang={lang}
                initialData={product}
                vendors={storeSettings.vendors || []}
                catalogSlugs={typeof storeSettings.catalogSlug === 'object' ? storeSettings.catalogSlug : { en: 'shop', fr: 'boutique' }}
            />
        </AdminPageLayout>
    );
}
