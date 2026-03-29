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

export function LangToggle({ lang, dict }: { lang: string, dict: Record<string, string> }) {
    const pathname = usePathname();
    const router = useRouter();

    const [isMounted, setIsMounted] = React.useState(false);
    
    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <Button variant="ghost" size="icon">
                <span className="sr-only">{dict.toggle_language || "Toggle language"}</span>
            </Button>
        )
    }

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
                <DropdownMenuItem onClick={() => switchLanguage("en")}>
                    English (EN)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => switchLanguage("fr")}>
                    Français (FR)
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
