import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { adminDb } from "@/lib/firebase-admin";
import { Product, Category } from "@/types/database";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";
import { getStoreSettings } from "@/lib/services/settings";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Pencil } from "lucide-react";

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

    const productData = productDoc.data();
    const product = {
        ...productData,
        createdAt: productData?.createdAt?.toDate ? productData.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: productData?.updatedAt?.toDate ? productData.updatedAt.toDate().toISOString() : new Date().toISOString(),
    } as Product;
    
    const categories = categoriesSnap.docs.map(doc => {
        const data = doc.data();
        return {
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString(),
            updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : new Date().toISOString(),
        } as Category;
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
