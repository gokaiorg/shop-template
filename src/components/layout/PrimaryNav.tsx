import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";

interface PrimaryNavProps {
    lang: string;
    dict: Record<string, string>;
    className?: string;
    onNavClick?: () => void;
}

import { brandConfig } from "@/config/brand.config";

export function PrimaryNav({ lang, dict, className, onNavClick }: PrimaryNavProps) {
    const navItems = brandConfig.navigation.headerNav;

    return (
        <nav className={cn("gap-6", className)}>
            {navItems.map((item) => {
                const label = dict?.[item.key] || item.key;
                const href = item.href.startsWith('http') ? item.href : `/${lang}${item.href}`;
                const isExternal = item.external || item.href.startsWith('http');

                return (
                    <Link
                        key={item.key + item.href}
                        href={href}
                        onClick={onNavClick}
                        target={isExternal ? "_blank" : undefined}
                        rel={isExternal ? "noopener noreferrer" : undefined}
                        className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        {label}
                    </Link>
                );
            })}
        </nav>
    );
}
