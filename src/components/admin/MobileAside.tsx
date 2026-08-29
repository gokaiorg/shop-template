"use client";

import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { 
    Menu, 
    LayoutDashboard, 
    Tags, 
    Package, 
    FileText, 
    ShoppingCart,
    ExternalLink
} from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LangToggle } from "@/components/layout/LangToggle";
import { useState } from "react";

export function MobileAside({ lang, dict, session }: { lang: string, dict: any, session: any }) {
    const [open, setOpen] = useState(false);
    const isAdmin = (session?.user?.role || "").toLowerCase() === "admin";

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
                            {dict.admin.title}
                        </SheetTitle>
                    </SheetHeader>
                    <div className="mb-6 px-1">
                        <Button asChild variant="outline" className="w-full justify-start gap-2" onClick={() => setOpen(false)}>
                            <Link href={`/${lang}`} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4" />
                                {dict.admin.view_site}
                            </Link>
                        </Button>
                    </div>
                    <nav className="space-y-1">
                        <Link href={`/${lang}/admin/dashboard`} onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors">
                            <LayoutDashboard className="h-4 w-4" />
                            {dict.admin.dashboard}
                        </Link>
                        {isAdmin && (
                            <>
                                <Link href={`/${lang}/admin/categories`} onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors">
                                    <Tags className="h-4 w-4" />
                                    {dict.admin.categories}
                                </Link>
                                <Link href={`/${lang}/admin/pages`} onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors">
                                    <FileText className="h-4 w-4" />
                                    {dict.admin.pages}
                                </Link>
                                <Link href={`/${lang}/admin/products`} onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors">
                                    <Package className="h-4 w-4" />
                                    {dict.admin.products}
                                </Link>
                            </>
                        )}
                        <Link href={`/${lang}/admin/orders`} onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md hover:bg-muted transition-colors">
                            <ShoppingCart className="h-4 w-4" />
                            {dict.admin.orders.title}
                        </Link>
                    </nav>
                </div>
                <div>
                    <div className="pb-4 ml-4 flex items-center justify-start gap-2">
                        <ThemeToggle dict={dict.header} />
                        <LangToggle lang={lang} dict={dict.header} />
                    </div>
                    <div className="pt-4 border-t flex flex-col gap-4">
                        <SignOutButton />
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
