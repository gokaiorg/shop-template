import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LangToggle } from "@/components/layout/LangToggle";
import { Button } from "@/components/ui/button";
import { 
    LayoutDashboard, 
    Tags, 
    Package, 
    FileText, 
    ShoppingCart,
    ExternalLink
} from "lucide-react";

export function Aside({ lang, dict, session }: { lang: string, dict: any, session: any }) {
    const isAdmin = (session?.user?.role || "").toLowerCase() === "admin";

    return (
        <aside className="hidden md:flex w-64 bg-background border-r flex-col justify-between">
            <div className="p-6">
                <h2 className="text-lg font-bold tracking-tight mb-6">{dict.admin.title}</h2>
                <div className="mb-6">
                    <Button asChild variant="outline" className="w-full justify-start gap-2">
                        <Link href={`/${lang}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                            {dict.admin.view_site}
                        </Link>
                    </Button>
                </div>
                <nav className="space-y-1">
                    <Link href={`/${lang}/admin/dashboard`} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors">
                        <LayoutDashboard className="h-4 w-4" />
                        {dict.admin.dashboard}
                    </Link>
                    {isAdmin && (
                        <>
                            <Link href={`/${lang}/admin/categories`} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors">
                                <Tags className="h-4 w-4" />
                                {dict.admin.categories}
                            </Link>
                            <Link href={`/${lang}/admin/pages`} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors">
                                <FileText className="h-4 w-4" />
                                {dict.admin.pages}
                            </Link>
                            <Link href={`/${lang}/admin/products`} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors">
                                <Package className="h-4 w-4" />
                                {dict.admin.products}
                            </Link>
                        </>
                    )}
                    <Link href={`/${lang}/admin/orders`} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors">
                        <ShoppingCart className="h-4 w-4" />
                        {dict.admin.orders.title}
                    </Link>
                </nav>
            </div>
            <div className="pb-4 mt-auto ml-4 flex items-center gap-2">
                <ThemeToggle dict={dict.header} />
                <LangToggle lang={lang} dict={dict.header} />
            </div>
            <div className="p-6 border-t flex flex-col gap-4">
                <SignOutButton />
            </div>
        </aside>
    );
}
