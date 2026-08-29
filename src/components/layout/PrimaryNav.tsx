"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface PrimaryNavProps {
    lang: string;
    dict: Record<string, string>;
    className?: string;
    onNavClick?: () => void;
}

export function PrimaryNav({ lang, dict, className, onNavClick }: PrimaryNavProps) {
    const pathname = usePathname();
    const isShopActive = pathname?.includes(`/${lang}/shop`);
    const isAboutActive = pathname?.includes(`/${lang}/about`);

    return (
        <nav className={cn("gap-6", className)}>
            <Link
                href={`/${lang}/shop`}
                onClick={onNavClick}
                aria-current={isShopActive ? "page" : undefined}
                className={cn(
                    "flex items-center text-sm font-medium transition-colors hover:text-foreground",
                    isShopActive ? "text-foreground" : "text-muted-foreground"
                )}
            >
                {dict.shop}
            </Link>
            <Link
                href={`/${lang}/about`}
                onClick={onNavClick}
                aria-current={isAboutActive ? "page" : undefined}
                className={cn(
                    "flex items-center text-sm font-medium transition-colors hover:text-foreground",
                    isAboutActive ? "text-foreground" : "text-muted-foreground"
                )}
            >
                {dict.about}
            </Link>
            <Link
                href={`/${lang}/contact`}
                onClick={onNavClick}
                className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
                {dict.contact}
            </Link>
        </nav>
    );
}
