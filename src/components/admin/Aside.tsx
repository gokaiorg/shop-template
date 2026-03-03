import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LangToggle } from "@/components/layout/LangToggle";

export function Aside({ lang, dict }: { lang: string, dict: any }) {
    return (
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
            <div className="pb-4 mt-auto ml-4">
                <ThemeToggle dict={dict.header} />
                <LangToggle lang={lang} dict={dict.header} />
            </div>
            <div className="p-6 border-t flex flex-col gap-4">
                <SignOutButton />
            </div>
        </aside>
    );
}
