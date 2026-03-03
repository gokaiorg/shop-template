import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LangToggle } from "@/components/layout/LangToggle";
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
            <aside className="w-full md:w-64 bg-background border-r flex flex-col justify-between">
                <div className="p-6">
                    <h2 className="text-lg font-bold tracking-tight mb-6">{dict.admin.title}</h2>
                    <nav className="space-y-4">
                        <Link href={`/${lang}/admin/dashboard`} className="block text-sm font-medium hover:underline">
                            {dict.admin.dashboard}
                        </Link>
                        <Link href={`/${lang}/admin/categories`} className="block text-sm font-medium hover:underline">
                            {dict.admin.categories}
                        </Link>
                        <Link href={`/${lang}/admin/products`} className="block text-sm font-medium hover:underline">
                            {dict.admin.products}
                        </Link>
                        <Link href={`/${lang}/admin/orders`} className="block text-sm font-medium hover:underline">
                            {dict.admin.orders}
                        </Link>
                    </nav>
                </div>
                <div className="p-6 border-t flex flex-col gap-4">
                    <div className="flex items-center gap-2 justify-center border-b border-border/50 pb-4">
                        <ThemeToggle dict={dict.header} />
                        <LangToggle lang={lang} dict={dict.header} />
                    </div>
                    <SignOutButton />
                </div>
            </aside>
            <main className="flex-1 p-6 md:p-10">
                {children}
            </main>
            <Toaster />
        </div>
    );
}
