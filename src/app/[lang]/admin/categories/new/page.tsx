import { CategoryForm } from "@/components/admin/CategoryForm";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { FolderPlus } from "lucide-react";

export default async function NewCategoryPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang as Locale);

    return (
        <AdminPageLayout
            title={dict.admin.categories_create}
            description={lang === 'fr' ? 'Créer une nouvelle catégorie de produits.' : 'Create a new product category.'}
            icon={FolderPlus}
            hasStickyFooter={true}
        >
            <CategoryForm dict={dict.admin.forms} lang={lang} />
        </AdminPageLayout>
    );
}
