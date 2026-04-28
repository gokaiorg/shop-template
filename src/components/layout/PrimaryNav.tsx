import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";

interface PrimaryNavProps {
    lang: string;
    dict: Record<string, string>;
    className?: string;
    onNavClick?: () => void;
}

export function PrimaryNav({ lang, dict, className, onNavClick }: PrimaryNavProps) {
    return (
        <nav className={cn("gap-6", className)}>
            <Link
                href={`/${lang}/shop`}
                onClick={onNavClick}
                className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
                {dict.shop}
            </Link>
            <Link
                href={`/${lang}/about`}
                onClick={onNavClick}
                className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
                {dict.about}
            </Link>
        </nav>
    );
}
