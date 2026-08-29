import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { adminDb } from "@/lib/firebase-admin";
import { Category } from "@/types/database";
import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/CategoryForm";

export default async function EditCategoryPage({ params }: { params: Promise<{ lang: string, id: string }> }) {
    const { lang, id } = await params;
    const dict = await getDictionary(lang as Locale);

    const doc = await adminDb.collection("categories").doc(id).get();
    if (!doc.exists) {
        notFound();
    }

    const categoryData = doc.data();
    const category = {
        ...categoryData,
        createdAt: categoryData?.createdAt?.toDate ? categoryData.createdAt.toDate().toISOString() : new Date().toISOString(),
        updatedAt: categoryData?.updatedAt?.toDate ? categoryData.updatedAt.toDate().toISOString() : new Date().toISOString(),
    } as Category;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{dict.admin.categories_edit || "Edit Category"}</h1>
            </div>
            <div className="bg-background border rounded-lg p-6">
                <CategoryForm dict={dict.admin.forms} lang={lang} initialData={category} />
            </div>
        </div>
    );
}
