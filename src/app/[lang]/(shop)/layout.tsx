import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { auth } from "@/auth";
import { getPublishedPages } from "@/lib/services/pages";
import { getStoreSettings } from "@/lib/services/settings";

export default async function ShopLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const [dict, session, publishedPages, storeSettings] = await Promise.all([
        getDictionary(lang as Locale),
        auth(),
        getPublishedPages(),
        getStoreSettings(),
    ]);

    const headerPages = publishedPages
        .filter((p) => p.showInHeader)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const footerPages = publishedPages
        .filter((p) => p.showInFooter)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return (
        <div className="flex min-h-screen flex-col">
            <Header lang={lang} dict={dict} session={session} pages={headerPages} />
            <main className="flex-1 flex flex-col">
                <div className="flex-1">
                    {children}
                </div>
                <Footer
                    lang={lang}
                    dict={dict}
                    pages={footerPages}
                    catalogTitle={storeSettings.catalogTitle}
                    catalogSlug={storeSettings.catalogSlug}
                    brandName={storeSettings.brandName}
                    footerDescription={storeSettings.footerDescription}
                    footerRightMenuTitle={storeSettings.footerRightMenuTitle}
                    socialLinks={storeSettings.socialLinks}
                />
            </main>
        </div>
    );
}
