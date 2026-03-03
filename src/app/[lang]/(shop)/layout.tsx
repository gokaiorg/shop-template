import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";

export default async function ShopLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const dict = await getDictionary(lang as Locale);

    return (
        <div className="flex min-h-screen flex-col">
            <Header lang={lang} dict={dict.header} />
            <main className="flex-1 flex flex-col">
                <div className="flex-1">
                    {children}
                </div>
                <Footer />
            </main>
        </div>
    );
}
