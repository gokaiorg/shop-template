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
        
        const rawSegments = pathname.split('/').filter(Boolean);
        if (rawSegments.length === 0) {
            router.push(`/${targetLang}`);
            return;
        }

        // Replace locale prefix
        if (supportedLocales.includes(rawSegments[0])) {
            rawSegments[0] = targetLang;
        } else {
            rawSegments.unshift(targetLang);
        }

        const allCatalogSlugs = catalogSlugs 
            ? Object.values(catalogSlugs).map((s) => s.toLowerCase()) 
            : ['shop', 'boutique'];

        const storeState = useTranslationStore.getState();

        // Level 1: /[lang]/[slug]
        if (rawSegments.length === 2) {
            const currentSlug = rawSegments[1].toLowerCase();
            if (allCatalogSlugs.includes(currentSlug)) {
                // Catalog root
                rawSegments[1] = (catalogSlugs?.[targetLang] || 'shop').toLowerCase();
            } else if (storeState.pageSlugs && storeState.pageSlugs[targetLang]) {
                // Static page (e.g. /fr/a-propos -> /en/about)
                rawSegments[1] = storeState.pageSlugs[targetLang];
            }
        } 
        // Level 2: /[lang]/[catalogSlug]/[categorySlug]
        else if (rawSegments.length === 3 && allCatalogSlugs.includes(rawSegments[1].toLowerCase())) {
            rawSegments[1] = (catalogSlugs?.[targetLang] || 'shop').toLowerCase();
            const activeCategorySlugs = storeState.categorySlugs || storeCategorySlugs;
            if (activeCategorySlugs && activeCategorySlugs[targetLang]) {
                rawSegments[2] = activeCategorySlugs[targetLang];
            }
        }
        // Level 3: /[lang]/[catalogSlug]/[categorySlug]/[productSlug]
        else if (rawSegments.length >= 4 && allCatalogSlugs.includes(rawSegments[1].toLowerCase())) {
            rawSegments[1] = (catalogSlugs?.[targetLang] || 'shop').toLowerCase();
            const activeCategorySlugs = storeState.categorySlugs || storeCategorySlugs;
            if (activeCategorySlugs && activeCategorySlugs[targetLang]) {
                rawSegments[2] = activeCategorySlugs[targetLang];
            }
            const activeProductSlugs = storeState.productSlugs || storeProductSlugs || storeState.alternateSlugs;
            if (activeProductSlugs && activeProductSlugs[targetLang]) {
                rawSegments[3] = activeProductSlugs[targetLang];
            }
        }
        // Legacy fallback for /product/[slug]
        else if (rawSegments.length >= 3 && rawSegments[1].toLowerCase() === 'product') {
            const activeProductSlugs = storeState.productSlugs || storeProductSlugs || storeState.alternateSlugs;
            if (activeProductSlugs && activeProductSlugs[targetLang]) {
                rawSegments[2] = activeProductSlugs[targetLang];
            }
        }

        // Read and preserve current URL search parameters (minus legacy category if present)
        const currentSearch = typeof window !== 'undefined' ? window.location.search : '';
        const searchParams = new URLSearchParams(currentSearch);

        // If category query parameter is present in legacy URL, translate it
        if (searchParams.has('category')) {
            const activeCategorySlugs = storeState.categorySlugs || storeCategorySlugs;
            if (activeCategorySlugs && activeCategorySlugs[targetLang]) {
                searchParams.set('category', activeCategorySlugs[targetLang]);
            }
        }

        const queryString = searchParams.toString();
        const targetUrl = `/${rawSegments.join('/')}${queryString ? `?${queryString}` : ''}`;
        router.push(targetUrl);
    };

    const toggleLangLabel = dict?.toggle_language || "Toggle language";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label={toggleLangLabel}>
                    <Globe className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">{toggleLangLabel}</span>
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
