"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { PrimaryNav } from "./PrimaryNav";
import { ThemeToggle } from "./ThemeToggle";
import { LangToggle } from "./LangToggle";
import { useState } from "react";
import Link from "next/link";

export function MobileNav({ lang, dict }: { lang: string, dict: Record<string, string> }) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle Menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-6 flex flex-col gap-6">
                <SheetHeader className="text-left">
                    <SheetTitle asChild>
                        <Link href={`/${lang}`} onClick={() => setOpen(false)} className="inline-block font-bold text-lg">
                            Shop Template
                        </Link>
                    </SheetTitle>
                </SheetHeader>

                <div className="flex flex-col gap-4 mt-4">
                    <PrimaryNav
                        lang={lang}
                        dict={dict}
                        className="flex flex-col items-start gap-4 text-lg font-medium"
                        onNavClick={() => setOpen(false)}
                    />
                </div>

                <div className="mt-auto flex items-center gap-4 pt-6 border-t">
                    <ThemeToggle dict={dict} />
                    <LangToggle lang={lang} dict={dict} />
                </div>
            </SheetContent>
        </Sheet>
    );
}
