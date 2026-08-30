import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { auth } from "@/auth";
import { getPublishedPages } from "@/lib/services/pages";

export default async function ShopLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const [dict, session, publishedPages] = await Promise.all([
        getDictionary(lang as Locale),
        auth(),
        getPublishedPages(),
    ]);

    const headerPages = publishedPages.filter((p) => p.showInHeader);
    const footerPages = publishedPages.filter((p) => p.showInFooter);

    return (
        <div className="flex min-h-screen flex-col">
            <Header lang={lang} dict={dict} session={session} pages={headerPages} />
            <main className="flex-1 flex flex-col">
                <div className="flex-1">
                    {children}
                </div>
                <Footer lang={lang} dict={dict} pages={footerPages} />
            </main>
        </div>
    );
}
