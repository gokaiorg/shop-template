import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { Aside } from "@/components/admin/Aside";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { MobileAside } from "@/components/admin/MobileAside";

export default async function AdminLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}) {
    const session = await auth();
    const { lang } = await params;
    const dict = await getDictionary(lang as Locale);

    if (!session || session.user?.role !== "ADMIN") {
        redirect(`/${lang}/login`);
    }

    return (
        <div className="flex min-h-screen flex-col md:flex-row bg-muted/40">
            {/* Desktop Sidebar */}
            <Aside lang={lang} dict={dict} />

            <main className="flex-1 flex flex-col">
                {/* Mobile Header containing Hamburger Menu */}
                <header className="md:hidden flex items-center gap-4 border-b bg-background p-4 sticky top-0 z-10">
                    <MobileAside lang={lang} dict={dict} />
                    <h1 className="text-lg font-bold">{dict.admin.title}</h1>
                </header>

                {/* Main Content Area */}
                <div className="flex-1 p-6 md:p-10 flex flex-col">
                    {children}
                </div>
            </main>
            <Toaster />
        </div>
    );
}
