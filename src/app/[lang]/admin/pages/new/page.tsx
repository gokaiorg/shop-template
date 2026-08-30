import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { PageForm } from "@/components/admin/PageForm";
import { protectAdminRoute } from "@/lib/auth-utils";

export default async function AdminPageNew({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = await params;
    await protectAdminRoute(lang);

    const dict = await getDictionary(lang as Locale);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {lang === 'fr' ? 'Créer une page' : 'Create Page'}
                </h1>
                <p className="text-muted-foreground">
                    {lang === 'fr'
                        ? 'Ajoutez une nouvelle page personnalisée à votre site.'
                        : 'Create a new content or legal page for your storefront.'}
                </p>
            </div>

            <PageForm dict={dict.admin} lang={lang} initialData={null} />
        </div>
    );
}
