import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { adminDb } from "@/lib/firebase-admin";
import { Product, Category } from "@/types/database";
import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function EditProductPage({ params }: { params: Promise<{ lang: string, id: string }> }) {
    const { lang, id } = await params;
    const dict = await getDictionary(lang as Locale);

    const [productDoc, categoriesSnap] = await Promise.all([
        adminDb.collection("products").doc(id).get(),
        adminDb.collection("categories").get()
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
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{dict.admin.products_edit || "Edit Product"}</h1>
            </div>
            <div className="bg-background border rounded-lg p-6">
                <ProductForm categories={categories} dict={dict.admin.forms} lang={lang} initialData={product} />
            </div>
        </div>
    );
}
