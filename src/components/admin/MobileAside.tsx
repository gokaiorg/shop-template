"use client";

import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LangToggle } from "@/components/layout/LangToggle";
import { useState } from "react";

export function MobileAside({ lang, dict }: { lang: string, dict: any }) {
    const [open, setOpen] = useState(false);

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
                    <nav className="space-y-4">
                        <Link href={`/${lang}/admin/dashboard`} onClick={() => setOpen(false)} className="block text-sm font-medium hover:underline">
                            {dict.admin.dashboard}
                        </Link>
                        <Link href={`/${lang}/admin/categories`} onClick={() => setOpen(false)} className="block text-sm font-medium hover:underline">
                            {dict.admin.categories}
                        </Link>
                        <Link href={`/${lang}/admin/products`} onClick={() => setOpen(false)} className="block text-sm font-medium hover:underline">
                            {dict.admin.products}
                        </Link>
                        <Link href={`/${lang}/admin/orders`} onClick={() => setOpen(false)} className="block text-sm font-medium hover:underline">
                            {dict.admin.orders.title}
                        </Link>
                    </nav>
                </div>
                <div>
                    <div className="pb-4 ml-4 flex items-center justify-start">
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
