import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { AccountNav } from "@/components/account/AccountNav";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Mon Compte | Espace Client",
    robots: {
        index: false,
        follow: false,
    },
};

export default async function AccountLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const session = await auth();

    // Guard: Redirect to login if user is not authenticated
    if (!session) {
        redirect(`/${lang}/login`);
    }

    const dict = await getDictionary(lang as Locale);
    const accountDict = dict.account || {};

    const displayName = session.user?.name || session.user?.email?.split("@")[0] || "Client";

    return (
        <div className="w-full max-w-7xl mx-auto py-8 md:py-12 px-4 sm:px-6 md:px-16">
            {/* Header / Greeting */}
            <div className="mb-8 border-b border-border pb-6">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {accountDict.title || (lang === "fr" ? "Mon Compte" : "My Account")}
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    {lang === "fr"
                        ? `Bienvenue, ${displayName}. Gagnez du temps et suivez vos commandes en un clic.`
                        : `Welcome back, ${displayName}. Manage your orders and profile information.`}
                </p>
            </div>

            {/* Layout Grid: Sidebar Navigation + Content Area */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
                <aside className="w-full md:w-64 shrink-0">
                    <AccountNav lang={lang} dict={dict} />
                </aside>

                <main className="flex-1 w-full min-w-0">
                    {children}
                </main>
            </div>
            <Toaster />
        </div>
    );
}
