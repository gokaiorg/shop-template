"use client";

import Link from "next/link";
import React from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { brandConfig } from "@/config/brand.config";

interface PrimaryNavProps {
    lang: string;
    dict: Record<string, string>;
    className?: string;
    onNavClick?: () => void;
}

export function PrimaryNav({ lang, dict, className, onNavClick }: PrimaryNavProps) {
    const pathname = usePathname();
    const navItems = brandConfig.navigation.headerNav;

    return (
        <nav className={cn("gap-6", className)}>
            {navItems.map((item) => {
                const label = dict?.[item.key] || item.key;
                const href = item.href.startsWith('http') ? item.href : `/${lang}${item.href}`;
                const isExternal = item.external || item.href.startsWith('http');
                const isActive = !isExternal && pathname === href;

                return (
                    <Link
                        key={item.key + item.href}
                        href={href}
                        onClick={onNavClick}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
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
