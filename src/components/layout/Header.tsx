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
import { Page, Category, SocialLink } from "@/types/database";

function HeaderContent({
    lang,
    dict,
    pages = [],
    categories = [],
    mobileCategories,
    footerPages = [],
    socialLinks = [],
}: {
    lang: string;
    dict: any;
    pages?: Page[];
    categories?: Category[];
    mobileCategories?: Category[];
    footerPages?: Page[];
    socialLinks?: SocialLink[];
}) {
    const { brand, isCartEnabled } = useBrand();
    const { logo } = brand.assets;
    const brandName = brand.identity.name;

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="w-full max-w-7xl mx-auto flex h-16 items-center justify-between px-6 md:px-16">
                {/* Brand Logo & Mobile Nav */}
                <div className="flex items-center gap-6 md:gap-10 h-full">
                    <MobileNav
                        lang={lang}
                        dict={dict}
                        pages={pages}
                        categories={mobileCategories || categories}
                        footerPages={footerPages}
                        socialLinks={socialLinks}
                    />
                    <Link href={`/${lang}`} className="flex items-center gap-2.5 shrink-0 group">
                        <Image src={logo.src} alt={logo.alt || `${brandName} Logo`} width={logo.width || 32} height={logo.height || 32} className="object-contain" />
                        <span className="font-bold sm:text-lg tracking-tight leading-none flex items-center">{brandName}</span>
                    </Link>

                    {/* Primary Navigation */}
                    <PrimaryNav lang={lang} dict={dict.header} pages={pages} categories={categories} className="hidden md:flex items-center" />
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
    mobileCategories,
    footerPages = [],
    socialLinks = [],
}: {
    lang: string;
    dict: any;
    session: any;
    pages?: Page[];
    categories?: Category[];
    mobileCategories?: Category[];
    footerPages?: Page[];
    socialLinks?: SocialLink[];
}) {
    return (
        <SessionProvider session={session}>
            <HeaderContent
                lang={lang}
                dict={dict}
                pages={pages}
                categories={categories}
                mobileCategories={mobileCategories}
                footerPages={footerPages}
                socialLinks={socialLinks}
            />
        </SessionProvider>
    );
}

