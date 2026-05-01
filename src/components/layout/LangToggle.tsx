"use client"

import * as React from "react"
import { Globe, Check } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function LangToggle({ lang, dict }: { lang: string, dict: Record<string, string> }) {
    const pathname = usePathname();
    const router = useRouter();

    const switchLanguage = (targetLang: string) => {
        if (lang === targetLang) return;
        const newPathname = pathname.replace(`/${lang}`, `/${targetLang}`);
        router.push(newPathname || `/${targetLang}`);
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
                <DropdownMenuItem
                    onClick={() => switchLanguage("en")}
                    className={lang === "en" ? "bg-accent/50 font-medium" : ""}
                >
                    <span className="flex-1">English (EN)</span>
                    {lang === "en" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => switchLanguage("fr")}
                    className={lang === "fr" ? "bg-accent/50 font-medium" : ""}
                >
                    <span className="flex-1">Français (FR)</span>
                    {lang === "fr" && <Check className="h-4 w-4 ml-2" />}
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
