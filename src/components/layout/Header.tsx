"use client";

import Link from "next/link";
import Image from "next/image";
import { SessionProvider } from "next-auth/react";
import { ThemeToggle } from "./ThemeToggle";
import { LangToggle } from "./LangToggle";
import { AccountToggle } from "./AccountToggle";
import { PrimaryNav } from "./PrimaryNav";
import { CartSheet } from "../cart/CartSheet";
import { MobileNav } from "./MobileNav";

import { brandConfig } from "@/config/brand.config";

function HeaderContent({ lang, dict }: { lang: string, dict: any }) {
    const { logo } = brandConfig.assets;
    const brandName = brandConfig.identity.name;
    const isCartEnabled = process.env.NEXT_PUBLIC_ENABLE_CART !== "false";
    const isI18nEnabled = process.env.NEXT_PUBLIC_ENABLE_I18N !== "false";

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="w-full max-w-7xl mx-auto flex h-16 items-center justify-between px-6 md:px-16">
                {/* Brand Logo & Mobile Nav */}
                <div className="flex items-center gap-4 md:gap-10">
                    <MobileNav lang={lang} dict={dict.header} />
                    <Link href={`/${lang}`} className="flex items-center space-x-2 gap-2">
                        <Image src={logo.src} alt={logo.alt || `${brandName} Logo`} width={logo.width || 32} height={logo.height || 32} className="object-contain" />
                        <span className="inline-block font-bold sm:text-lg">{brandName}</span>
                    </Link>

                    {/* Primary Navigation */}
                    <PrimaryNav lang={lang} dict={dict.header} className="hidden md:flex" />
                </div>

                {/* Right Actions */}
                <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4">
                    <div className="hidden md:flex items-center space-x-2 md:space-x-4">
                        <ThemeToggle dict={dict.header} />
                        {isI18nEnabled && <LangToggle lang={lang} dict={dict.header} />}
                    </div>
                    <AccountToggle lang={lang} dict={dict} />
                    {isCartEnabled && <CartSheet dict={dict.header} />}
                </div>
            </div>
        </header>
    );
}

export function Header({ lang, dict, session }: { lang: string, dict: any, session: any }) {
    return (
        <SessionProvider session={session}>
            <HeaderContent lang={lang} dict={dict} />
        </SessionProvider>
    );
}
