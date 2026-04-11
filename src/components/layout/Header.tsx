"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SessionProvider } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { LangToggle } from "./LangToggle";
import { AccountToggle } from "./AccountToggle";
import { PrimaryNav } from "./PrimaryNav";
import { CartSheet } from "../cart/CartSheet";
import { MobileNav } from "./MobileNav";

function HeaderContent({ lang, dict }: { lang: string, dict: any }) {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
                {/* Brand Logo & Mobile Nav */}
                <div className="flex items-center gap-4 md:gap-10">
                    <MobileNav lang={lang} dict={dict.header} />
                    <Link href={`/${lang}`} className="flex items-center space-x-2">
                        <span className="inline-block font-bold sm:text-lg">Shop Template</span>
                    </Link>

                    {/* Primary Navigation */}
                    <PrimaryNav lang={lang} dict={dict.header} className="hidden md:flex" />
                </div>

                {/* Right Actions */}
                <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4">
                    <div className="hidden md:flex items-center space-x-2 md:space-x-4">
                        <ThemeToggle dict={dict.header} />
                        <LangToggle lang={lang} dict={dict.header} />
                    </div>
                    <AccountToggle lang={lang} dict={dict} />
                    <CartSheet />
                </div>
            </div>
        </header>
    );
}

export function Header({ lang, dict }: { lang: string, dict: any }) {
    return (
        <SessionProvider>
            <HeaderContent lang={lang} dict={dict} />
        </SessionProvider>
    );
}
