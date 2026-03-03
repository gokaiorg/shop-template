import { CategoryForm } from "@/components/admin/CategoryForm";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";

export default async function NewCategoryPage({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    const dict = await getDictionary(lang as Locale);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{dict.admin.categories_create}</h1>
                <p className="text-muted-foreground">Fill in the form to create a new product category.</p>
            </div>
            <div className="bg-background border rounded-lg p-6">
                <CategoryForm dict={dict.admin.forms} lang={lang} />
            </div>
        </div>
    );
}
