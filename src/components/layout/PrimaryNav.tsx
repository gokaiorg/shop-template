import Link from "next/link";
import React from "react";

export function PrimaryNav({ lang, dict }: { lang: string, dict: Record<string, string> }) {
    return (
        <nav className="hidden md:flex gap-6">
            <Link
                href={`/${lang}/shop`}
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
    );
}
