"use client"

import * as React from "react"
import { Globe } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useBrand } from "@/components/providers/BrandProvider"
import { getLocaleDisplayName } from "@/lib/i18n"

export function LangToggle({ lang, dict }: { lang: string, dict: Record<string, string> }) {
    const { isMultiLocale, supportedLocales } = useBrand();
    const pathname = usePathname();
    const router = useRouter();

    if (!isMultiLocale || supportedLocales.length <= 1) {
        return null;
    }

    const switchLanguage = (targetLang: string) => {
        if (lang === targetLang) return;
        const segments = pathname.split('/');
        // Replace locale prefix
        if (supportedLocales.includes(segments[1])) {
            segments[1] = targetLang;
        } else {
            segments.splice(1, 0, targetLang);
        }
        router.push(segments.join('/') || `/${targetLang}`);
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <Globe className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">{dict.toggle_language || "Toggle language"}</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {supportedLocales.map((loc) => (
                    <DropdownMenuItem
                        key={loc}
                        onClick={() => switchLanguage(loc)}
                        className={lang === loc ? "font-semibold bg-accent" : ""}
                    >
                        {getLocaleDisplayName(loc)}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
