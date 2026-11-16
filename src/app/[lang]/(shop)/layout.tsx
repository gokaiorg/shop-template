import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { auth } from "@/auth";
import { getPublishedPages } from "@/lib/services/pages";
import { getHeaderCategories, getAllPublishedCategories } from "@/lib/services/categories";
import { getStoreSettings } from "@/lib/services/settings";
import { getLocalizedField } from "@/lib/i18n";
import { SessionProvider } from "next-auth/react";

export default async function ShopLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const [dict, session, publishedPages, storeSettings, headerCategories, allCategories] = await Promise.all([
        getDictionary(lang as Locale),
        auth(),
        getPublishedPages(),
        getStoreSettings(),
        getHeaderCategories(),
        getAllPublishedCategories(),
    ]);

    const serializedSession = session ? JSON.parse(JSON.stringify(session)) : null;

    const headerPages = publishedPages
        .filter((p) => p.showInHeader)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const footerPages = publishedPages
        .filter((p) => p.showInFooter)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    return (
        <SessionProvider session={serializedSession}>
            <div className="flex min-h-screen flex-col" suppressHydrationWarning>
                <a
                    href="#main-content"
                    className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-xl focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
                >
                    {lang === "fr" ? "Aller au contenu principal" : "Skip to main content"}
                </a>
                <Header
                    lang={lang}
                    dict={dict}
                    session={serializedSession}
                    pages={headerPages}
                    categories={headerCategories}
                    mobileCategories={allCategories}
                    footerPages={footerPages}
                    socialLinks={storeSettings.socialLinks}
                />
                <main id="main-content" className="flex-1">
                    {children}
                </main>
                <Footer
                    lang={lang}
                    dict={dict}
                    pages={footerPages}
                    categories={allCategories}
                    catalogTitle={storeSettings.catalogTitle}
                    catalogSlug={typeof storeSettings.catalogSlug === 'object' ? getLocalizedField(storeSettings.catalogSlug, lang) || 'shop' : (storeSettings.catalogSlug || 'shop')}
                    brandName={storeSettings.brandName}
                    footerDescription={storeSettings.footerDescription}
                    footerRightMenuTitle={storeSettings.footerRightMenuTitle}
                    socialLinks={storeSettings.socialLinks}
                />
            </div>
        </SessionProvider>
    );
}
