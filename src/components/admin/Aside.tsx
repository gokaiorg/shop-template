"use client";

import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LangToggle } from "@/components/layout/LangToggle";
import { Button } from "@/components/ui/button";
import { 
    LayoutDashboard, 
    BookOpen,
    Tags, 
    Package, 
    FileText, 
    ShoppingCart,
    Mail,
    Settings,
    ExternalLink
} from "lucide-react";
import { useBrand } from "@/components/providers/BrandProvider";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function Aside({ lang, dict, session }: { lang: string, dict: any, session: any }) {
    const pathname = usePathname();
    const { isCartEnabled } = useBrand();
    const adminDict = dict?.admin || {};
    const ordersTitle = adminDict.orders?.title || adminDict.orders || "Orders";

    const isDashboardActive = pathname === `/${lang}/admin/dashboard` || pathname === `/${lang}/admin`;
    const isCatalogActive = pathname.startsWith(`/${lang}/admin/catalog`);
    const isCategoriesActive = pathname.startsWith(`/${lang}/admin/categories`);
    const isProductsActive = pathname.startsWith(`/${lang}/admin/products`);
    const isPagesActive = pathname.startsWith(`/${lang}/admin/pages`);
    const isOrdersActive = pathname.startsWith(`/${lang}/admin/orders`);
    const isMessagesActive = pathname.startsWith(`/${lang}/admin/messages`);
    const isSettingsActive = pathname.startsWith(`/${lang}/admin/settings`);

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
                    {/* 1. Dashboard */}
                    <Link
                        href={`/${lang}/admin/dashboard`}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                            isDashboardActive
                                ? "bg-muted text-foreground font-semibold"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}
                    >
                        <LayoutDashboard className="h-4 w-4" />
                        {adminDict.dashboard || "Dashboard"}
                    </Link>

                    {/* 2. Catalogue */}
                    <Link
                        href={`/${lang}/admin/catalog`}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                            isCatalogActive
                                ? "bg-muted text-foreground font-semibold"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}
                    >
                        <BookOpen className="h-4 w-4" />
                        {adminDict.catalog || (lang === 'fr' ? "Catalogue" : "Catalog")}
                    </Link>

                    {/* 3. Categories */}
                    <Link
                        href={`/${lang}/admin/categories`}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                            isCategoriesActive
                                ? "bg-muted text-foreground font-semibold"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}
                    >
                        <Tags className="h-4 w-4" />
                        {adminDict.categories || "Categories"}
                    </Link>

                    {/* 4. Products */}
                    <Link
                        href={`/${lang}/admin/products`}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                            isProductsActive
                                ? "bg-muted text-foreground font-semibold"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}
                    >
                        <Package className="h-4 w-4" />
                        {adminDict.products || "Products"}
                    </Link>

                    {/* 5. Pages */}
                    <Link
                        href={`/${lang}/admin/pages`}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                            isPagesActive
                                ? "bg-muted text-foreground font-semibold"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}
                    >
                        <FileText className="h-4 w-4" />
                        {adminDict.pages || "Pages"}
                    </Link>

                    {/* Orders (if Cart Enabled) */}
                    {isCartEnabled && (
                        <Link
                            href={`/${lang}/admin/orders`}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                isOrdersActive
                                    ? "bg-muted text-foreground font-semibold"
                                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                            )}
                        >
                            <ShoppingCart className="h-4 w-4" />
                            {ordersTitle}
                        </Link>
                    )}

                    {/* Messages */}
                    <Link
                        href={`/${lang}/admin/messages`}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                            isMessagesActive
                                ? "bg-muted text-foreground font-semibold"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}
                    >
                        <Mail className="h-4 w-4" />
                        {adminDict.messages || "Messages"}
                    </Link>

                    {/* Settings */}
                    <Link
                        href={`/${lang}/admin/settings`}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                            isSettingsActive
                                ? "bg-muted text-foreground font-semibold"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        )}
                    >
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
