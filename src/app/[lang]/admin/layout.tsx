import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { Aside } from "@/components/admin/Aside";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { MobileAside } from "@/components/admin/MobileAside";
import type { Metadata } from "next";
import { getStoreSettings } from "@/lib/services/settings";
import { getActiveBrand } from "@/config/brand.config";

export async function generateMetadata(): Promise<Metadata> {
    const storeSettings = await getStoreSettings();
    const rawBrand = getActiveBrand();
    const brandName = storeSettings.brandName || rawBrand.identity?.name || "Store";

    return {
        title: {
            absolute: `Admin | ${brandName}`,
        },
        robots: {
            index: false,
            follow: false,
        },
    };
}

export default async function AdminLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;

    // Fetch session and dictionary in parallel to reduce TTFB
    const [session, dict] = await Promise.all([
        auth(),
        getDictionary(lang as Locale)
    ]);

    const userRole = (session?.user?.role || "").toLowerCase();
    const isAuthorized = userRole === "admin";

    if (!session || !isAuthorized) {
        redirect(`/${lang}/login`);
    }

    return (
        <div className="flex min-h-screen flex-col md:flex-row bg-background">
            {/* Desktop Sidebar */}
            <Aside lang={lang} dict={dict} session={session} />

            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
                {/* Mobile Header containing Hamburger Menu */}
                <header className="md:hidden flex items-center gap-4 border-b border-border bg-background p-4 sticky top-0 z-10 shrink-0">
                    <MobileAside lang={lang} dict={dict} session={session} />
                    <h1 className="text-lg font-bold">{dict.admin.title}</h1>
                </header>

                {/* Main Content Area */}
                {children}
            </div>
            <Toaster />
        </div>
    );
}
