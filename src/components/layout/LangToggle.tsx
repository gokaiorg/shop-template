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
import { useTranslationStore } from "@/store/useTranslationStore"

export function LangToggle({ lang, dict }: { lang: string, dict: Record<string, string> }) {
    const { isMultiLocale, supportedLocales, catalogSlugs } = useBrand();
    const pathname = usePathname();
    const router = useRouter();
    const storeCategorySlugs = useTranslationStore((state) => state.categorySlugs);
    const storeProductSlugs = useTranslationStore((state) => state.productSlugs);

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

        // If on the catalog page: e.g. /en/shop or /fr/boutique
        // segments[2] is the catalogSlug segment
        if (segments.length >= 3 && catalogSlugs) {
            const currentSlug = segments[2];
            const allSlugs = Object.values(catalogSlugs).map((s) => s.toLowerCase());
            if (allSlugs.includes(currentSlug.toLowerCase())) {
                segments[2] = (catalogSlugs[targetLang] || 'shop').toLowerCase();
            }
        }

        // If on a product page: e.g. /fr/product/tasse-matinale-tachetee
        // segments[2] === 'product' and segments.length >= 4
        if (segments.length >= 4 && segments[2].toLowerCase() === 'product') {
            const activeProductSlugs = useTranslationStore.getState().productSlugs || storeProductSlugs || useTranslationStore.getState().alternateSlugs;
            if (activeProductSlugs && activeProductSlugs[targetLang]) {
                const slugIndex = segments[segments.length - 1] === '' ? segments.length - 2 : segments.length - 1;
                segments[slugIndex] = activeProductSlugs[targetLang];
            }
        }

        // Read and preserve current URL search parameters
        const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
        const searchParams = new URLSearchParams(currentSearch);

        // If category query parameter is present, translate its value for targetLocale
        if (searchParams.has('category')) {
            const activeCategorySlugs = useTranslationStore.getState().categorySlugs || storeCategorySlugs;
            if (activeCategorySlugs && activeCategorySlugs[targetLang]) {
                searchParams.set('category', activeCategorySlugs[targetLang]);
            }
        }

        const queryString = searchParams.toString();
        const targetUrl = `${segments.join('/') || `/${targetLang}`}${queryString ? `?${queryString}` : ''}`;
        router.push(targetUrl);
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
