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
import { useBrand } from "@/components/providers/BrandProvider";
import { Page, Category } from "@/types/database";

function HeaderContent({
    lang,
    dict,
    pages = [],
    categories = [],
}: {
    lang: string;
    dict: any;
    pages?: Page[];
    categories?: Category[];
}) {
    const { brand, isCartEnabled } = useBrand();
    const { logo } = brand.assets;
    const brandName = brand.identity.name;

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="w-full max-w-7xl mx-auto flex h-16 items-center justify-between px-6 md:px-16">
                {/* Brand Logo & Mobile Nav */}
                <div className="flex items-center gap-4 md:gap-10">
                    <MobileNav lang={lang} dict={dict.header} pages={pages} categories={categories} />
                    <Link href={`/${lang}`} className="flex items-center space-x-2 gap-2">
                        <Image src={logo.src} alt={logo.alt || `${brandName} Logo`} width={logo.width || 32} height={logo.height || 32} className="object-contain" />
                        <span className="inline-block font-bold sm:text-lg">{brandName}</span>
                    </Link>

                    {/* Primary Navigation */}
                    <PrimaryNav lang={lang} dict={dict.header} pages={pages} categories={categories} className="hidden md:flex" />
                </div>

                {/* Right Actions */}
                <div className="flex flex-1 items-center justify-end space-x-2 md:space-x-4">
                    <div className="hidden md:flex items-center space-x-2 md:space-x-4">
                        <ThemeToggle dict={dict.header} />
                        <LangToggle lang={lang} dict={dict.header} />
                    </div>
                    {isCartEnabled && <CartSheet dict={dict.header} />}
                    <AccountToggle lang={lang} dict={dict} />
                </div>
            </div>
        </header>
    );
}

export function Header({
    lang,
    dict,
    session,
    pages = [],
    categories = [],
}: {
    lang: string;
    dict: any;
    session: any;
    pages?: Page[];
    categories?: Category[];
}) {
    return (
        <SessionProvider session={session}>
            <HeaderContent lang={lang} dict={dict} pages={pages} categories={categories} />
        </SessionProvider>
    );
}
