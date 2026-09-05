import { CategoryForm } from "@/components/admin/CategoryForm";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Tags } from "lucide-react";

export default async function NewCategoryPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang as Locale);

    return (
        <div className="space-y-6">
            <AdminPageHeader
                title={dict.admin.categories_create}
                description={lang === 'fr' ? 'Remplissez le formulaire pour créer une nouvelle catégorie.' : 'Fill in the form to create a new product category.'}
                icon={Tags}
            />
            <div className="bg-background border rounded-lg p-6">
                <CategoryForm dict={dict.admin.forms} lang={lang} />
            </div>
        </div>
    );
}
