"use client";

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
    Settings,
    ExternalLink
} from "lucide-react";
import { useBrand } from "@/components/providers/BrandProvider";

export function Aside({ lang, dict, session }: { lang: string, dict: any, session: any }) {
    const { isCartEnabled } = useBrand();
    const adminDict = dict?.admin || {};
    const ordersTitle = adminDict.orders?.title || adminDict.orders || "Orders";

    return (
        <aside className="hidden md:flex w-64 bg-background border-r flex-col justify-between">
            <div className="p-6">
                <h2 className="text-lg font-bold tracking-tight mb-6">{adminDict.title || "Admin Panel"}</h2>
                <div className="mb-6">
                    <Button asChild variant="outline" className="w-full justify-start gap-2">
                        <Link href={`/${lang}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                            {adminDict.view_site || "View Site"}
                        </Link>
                    </Button>
                </div>
                <nav className="space-y-1">
                    <Link href={`/${lang}/admin/dashboard`} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors">
                        <LayoutDashboard className="h-4 w-4" />
                        {adminDict.dashboard || "Dashboard"}
                    </Link>
                    <Link href={`/${lang}/admin/products`} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors">
                        <Package className="h-4 w-4" />
                        {adminDict.products || "Products"}
                    </Link>
                    <Link href={`/${lang}/admin/categories`} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors">
                        <Tags className="h-4 w-4" />
                        {adminDict.categories || "Categories"}
                    </Link>
                    <Link href={`/${lang}/admin/pages`} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors">
                        <FileText className="h-4 w-4" />
                        {adminDict.pages || "Pages"}
                    </Link>
                    {isCartEnabled && (
                        <Link href={`/${lang}/admin/orders`} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors">
                            <ShoppingCart className="h-4 w-4" />
                            {ordersTitle}
                        </Link>
                    )}
                    <Link href={`/${lang}/admin/settings`} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors">
                        <Settings className="h-4 w-4" />
                        {adminDict.settings || "Settings"}
                    </Link>
                </nav>
            </div>
            <div className="pb-4 mt-auto ml-4 flex items-center gap-2">
                <ThemeToggle dict={dict?.header} />
                <LangToggle lang={lang} dict={dict?.header} />
            </div>
            <div className="p-6 border-t flex flex-col gap-4">
                <SignOutButton />
            </div>
        </aside>
    );
}
