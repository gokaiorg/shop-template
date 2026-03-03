import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { Footer } from "@/components/layout/Footer";
import { Aside } from "@/components/admin/Aside";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";

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
            <Aside lang={lang} dict={dict} />
            <main className="flex-1 p-6 md:p-10 flex flex-col">
                <div className="flex-1">
                    {children}
                </div>
                <Footer />
            </main>
            <Toaster />
        </div>
    );
}
