"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Page } from "@/types/database";
import { getLocalizedField } from "@/lib/i18n";

interface PrimaryNavProps {
    lang: string;
    dict: Record<string, string>;
    pages?: Page[];
    className?: string;
    onNavClick?: () => void;
}

export function PrimaryNav({ lang, dict, pages = [], className, onNavClick }: PrimaryNavProps) {
    const pathname = usePathname();

    const shopHref = `/${lang}/shop`;
    const isShopActive = pathname === shopHref || pathname.startsWith(`/${lang}/product/`);

    return (
        <nav className={cn("gap-6", className)}>
            {/* Hardcoded Shop / Catalogue Link */}
            <Link
                href={shopHref}
                onClick={onNavClick}
                aria-current={isShopActive ? "page" : undefined}
                className={cn(
                    "flex items-center text-sm font-medium transition-colors hover:text-foreground",
                    isShopActive ? "text-foreground font-semibold" : "text-muted-foreground"
                )}
            >
                {dict?.shop || (lang === 'fr' ? 'Boutique' : 'Shop')}
            </Link>

            {/* Dynamic Pages with showInHeader === true */}
            {pages.map((page) => {
                const href = `/${lang}/pages/${page.slug}`;
                const isActive = pathname === href || pathname === `/${lang}/${page.slug}`;
                const label = getLocalizedField(page.title, lang) || (lang === 'fr' ? page.title_fr : page.title_en) || page.slug;

                return (
                    <Link
                        key={page.id || page.slug}
                        href={href}
                        onClick={onNavClick}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                            "flex items-center text-sm font-medium transition-colors hover:text-foreground",
                            isActive ? "text-foreground font-semibold" : "text-muted-foreground"
                        )}
                    >
                        {label}
                    </Link>
                );
            })}
        </nav>
    );
}
