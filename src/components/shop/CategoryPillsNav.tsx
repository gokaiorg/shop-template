"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { useRouter, useSearchParams } from "next/navigation";
import { Category } from "@/types/database";
import { getLocalizedField } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export interface CategoryPillsNavProps {
    categories: Category[];
    activeId?: string | null;
    onSelect?: (category: Category) => void;
    catalogSlug?: string;
    lang: string;
    asTabs?: boolean;
    className?: string;
}

export const INACTIVE_PILL_CLASS =
    "rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 cursor-pointer dark:border-gray-800 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800 whitespace-nowrap";

export const ACTIVE_PILL_CLASS =
    "rounded-full border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors cursor-pointer dark:border-white dark:bg-white dark:text-black whitespace-nowrap";

export function CategoryPillsNav({
    categories,
    activeId,
    onSelect,
    catalogSlug = "shop",
    lang,
    asTabs = false,
    className,
}: CategoryPillsNavProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handleCategoryClick = (category: Category, slug: string) => {
        if (onSelect) {
            onSelect(category);
            return;
        }
        if (catalogSlug) {
            const params = new URLSearchParams(searchParams?.toString() || "");
            if (slug) {
                params.set("category", slug);
            } else {
                params.delete("category");
            }
            router.push(`/${lang}/${catalogSlug}?${params.toString()}`);
        }
    };

    if (asTabs) {
        return (
            <div className={cn("w-full overflow-x-auto no-scrollbar scrollbar-none pb-2 sm:pb-0", className)}>
                <TabsPrimitive.List
                    data-slot="tabs-list"
                    className="flex flex-nowrap sm:flex-wrap items-center gap-2 mb-8 bg-transparent p-0 h-auto border-none w-max sm:w-auto"
                >
                    {categories.map((category) => {
                        const categoryName =
                            getLocalizedField(category.name, lang) ||
                            (lang === "fr" ? category.nameFr : category.nameEn) ||
                            "";

                        return (
                            <TabsPrimitive.Trigger
                                key={category.id}
                                value={category.id}
                                data-slot="tabs-trigger"
                                className={cn(
                                    "rounded-full border px-4 py-2 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap outline-none",
                                    // Inactive classes
                                    "border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-transparent dark:text-gray-300 dark:hover:bg-gray-800",
                                    // Active classes via Radix data-[state=active]
                                    "data-[state=active]:border-slate-900 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:shadow-none dark:data-[state=active]:border-white dark:data-[state=active]:bg-white dark:data-[state=active]:text-black"
                                )}
                            >
                                {categoryName}
                            </TabsPrimitive.Trigger>
                        );
                    })}
                </TabsPrimitive.List>
            </div>
        );
    }

    return (
        <div className={cn("w-full overflow-x-auto no-scrollbar scrollbar-none pb-2 sm:pb-0", className)}>
            <div className="flex flex-nowrap sm:flex-wrap items-center gap-2 mb-8 w-max sm:w-auto">
                {categories.map((category) => {
                    const categorySlug =
                        getLocalizedField(category.slug, lang) ||
                        (lang === "fr" ? category.slugFr : category.slugEn) ||
                        "";
                    const categoryName =
                        getLocalizedField(category.name, lang) ||
                        (lang === "fr" ? category.nameFr : category.nameEn) ||
                        "";
                    const isActive = activeId === categorySlug || activeId === category.id;

                    return (
                        <button
                            key={category.id}
                            type="button"
                            onClick={() => handleCategoryClick(category, categorySlug)}
                            className={isActive ? ACTIVE_PILL_CLASS : INACTIVE_PILL_CLASS}
                            aria-current={isActive ? "true" : undefined}
                        >
                            {categoryName}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
