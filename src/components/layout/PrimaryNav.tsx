"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Page } from "@/types/database";
import { getLocalizedField } from "@/lib/i18n";
import { useBrand } from "@/components/providers/BrandProvider";

interface PrimaryNavProps {
    lang: string;
    dict: Record<string, string>;
    pages?: Page[];
    className?: string;
    onNavClick?: () => void;
}

export function PrimaryNav({ lang, dict, pages = [], className, onNavClick }: PrimaryNavProps) {
    const pathname = usePathname();
    const { catalogTitle, catalogSlug } = useBrand();

    const activeSlug = catalogSlug || "shop";
    const catalogHref = `/${lang}/${activeSlug}`;
    const isCatalogActive = pathname === catalogHref || pathname.startsWith(`/${lang}/${activeSlug}/`) || pathname.startsWith(`/${lang}/product/`);
    const catalogLabel = getLocalizedField(catalogTitle, lang) || dict?.shop || (lang === "fr" ? "Boutique" : "Shop");

    return (
        <nav className={cn("gap-6", className)}>
            {/* Dynamic Catalog Link */}
            <Link
                href={catalogHref}
                onClick={onNavClick}
                aria-current={isCatalogActive ? "page" : undefined}
                className={cn(
                    "flex items-center text-sm font-medium transition-colors hover:text-foreground",
                    isCatalogActive ? "text-foreground font-semibold" : "text-muted-foreground"
                )}
            >
                {catalogLabel}
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
