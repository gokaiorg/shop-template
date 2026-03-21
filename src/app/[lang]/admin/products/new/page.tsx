import { ProductForm } from "@/components/admin/ProductForm";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { adminDb } from "@/lib/firebase-admin";
import { Category } from "@/types/database";

export default async function NewProductPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang as Locale);

    const categoriesSnapshot = await adminDb.collection("categories").orderBy("nameEn", "asc").get();
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
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{dict.admin.products_create}</h1>
                <p className="text-muted-foreground">Fill in the form to create a new product.</p>
            </div>
            <div className="bg-background border rounded-lg p-6">
                <ProductForm categories={categories} dict={dict.admin.forms} lang={lang} />
            </div>
        </div>
    );
}
