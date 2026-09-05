"use client";

import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { 
    Menu, 
    LayoutDashboard, 
    BookOpen,
    Tags, 
    Package, 
    FileText, 
    ShoppingCart,
    Settings,
    ExternalLink
} from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LangToggle } from "@/components/layout/LangToggle";
import { useState } from "react";
import { useBrand } from "@/components/providers/BrandProvider";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function MobileAside({ lang, dict, session }: { lang: string, dict: any, session: any }) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);
    const { isCartEnabled } = useBrand();
    const adminDict = dict?.admin || {};
    const ordersTitle = adminDict.orders?.title || adminDict.orders || "Orders";

    const isDashboardActive = pathname === `/${lang}/admin/dashboard` || pathname === `/${lang}/admin`;
    const isCatalogActive = pathname.startsWith(`/${lang}/admin/catalog`);
    const isCategoriesActive = pathname.startsWith(`/${lang}/admin/categories`);
    const isProductsActive = pathname.startsWith(`/${lang}/admin/products`);
    const isPagesActive = pathname.startsWith(`/${lang}/admin/pages`);
    const isOrdersActive = pathname.startsWith(`/${lang}/admin/orders`);
    const isSettingsActive = pathname.startsWith(`/${lang}/admin/settings`);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden cursor-pointer">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-6 flex flex-col justify-between">
                <div>
                    <SheetHeader className="text-left mb-6">
                        <SheetTitle className="text-lg font-bold tracking-tight">
                            {adminDict.title || "Admin Panel"}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="mb-6 px-1">
                        <Button asChild variant="outline" className="w-full justify-start gap-2" onClick={() => setOpen(false)}>
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
                            onClick={() => setOpen(false)}
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
                            onClick={() => setOpen(false)}
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
                            onClick={() => setOpen(false)}
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
                            onClick={() => setOpen(false)}
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
                            onClick={() => setOpen(false)}
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
                                onClick={() => setOpen(false)}
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

                        {/* 6. Settings */}
                        <Link
                            href={`/${lang}/admin/settings`}
                            onClick={() => setOpen(false)}
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
                <div>
                    <div className="pb-4 ml-4 flex items-center justify-start gap-2">
                        <ThemeToggle dict={dict?.header} />
                        <LangToggle lang={lang} dict={dict?.header} />
                    </div>
                    <div className="pt-4 border-t flex flex-col gap-4">
                        <SignOutButton />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
