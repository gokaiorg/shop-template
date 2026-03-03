"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { SessionProvider } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { LangToggle } from "./LangToggle";
import { AccountToggle } from "./AccountToggle";

function HeaderContent({ lang, dict }: { lang: string, dict: Record<string, string> }) {
    const { status } = useSession();

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
                {/* Brand Logo */}
                <div className="flex items-center gap-6 md:gap-10">
                    <Link href={`/${lang}`} className="flex items-center space-x-2">
                        <span className="inline-block font-bold sm:text-lg">ShopTemplate</span>
                    </Link>

                    {/* Primary Navigation */}
                    <nav className="hidden md:flex gap-6">
                        <Link
                            href={`/${lang}/categories`}
                            className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {dict.shop}
                        </Link>
                        <Link
                            href={`/${lang}/about`}
                            className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {dict.about}
                        </Link>
                    </nav>
                </div>

                {/* Right Actions */}
                <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4">
                    <ThemeToggle dict={dict} />
                    <LangToggle lang={lang} dict={dict} />
                    <AccountToggle lang={lang} dict={dict} />
                </div>
            </div>
        </header>
    );
}

export function Header({ lang, dict }: { lang: string, dict: Record<string, string> }) {
    return (
        <SessionProvider>
            <HeaderContent lang={lang} dict={dict} />
        </SessionProvider>
    );
}
