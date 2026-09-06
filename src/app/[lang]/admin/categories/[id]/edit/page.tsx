import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { adminDb } from "@/lib/firebase-admin";
import { Category } from "@/types/database";
import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/CategoryForm";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Pencil } from "lucide-react";

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
        <AdminPageLayout
            title={dict.admin.categories_edit || "Edit Category"}
            description={lang === 'fr' ? 'Modifier le nom, le slug ou les paramètres de la catégorie.' : 'Edit category name, slug, and settings.'}
            icon={Pencil}
            hasStickyFooter={true}
        >
            <CategoryForm dict={dict.admin.forms} lang={lang} initialData={category} />
        </AdminPageLayout>
    );
}
