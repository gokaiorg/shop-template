"use client";

import * as React from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import Link from "next/link";
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

export const BASE_PILL_CLASS =
    "rounded-full border px-4 py-2 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap outline-none";

export const INACTIVE_PILL_CLASS =
    "border-border bg-transparent text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 dark:border-border dark:bg-transparent dark:text-muted-foreground dark:hover:bg-primary/15 dark:hover:text-primary dark:hover:border-primary/40";

export const ACTIVE_PILL_CLASS =
    "border-primary bg-primary text-primary-foreground hover:opacity-90 dark:border-primary dark:bg-primary dark:text-primary-foreground shadow-xs";

export const TAB_TRIGGER_CLASS = cn(
    BASE_PILL_CLASS,
    // Inactive state via data-[state=inactive] and default
    "border-border bg-transparent text-muted-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 dark:border-border dark:bg-transparent dark:text-muted-foreground dark:hover:bg-primary/15 dark:hover:text-primary dark:hover:border-primary/40",
    "data-[state=inactive]:border-border data-[state=inactive]:bg-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-primary/10 data-[state=inactive]:hover:text-primary data-[state=inactive]:hover:border-primary/30",
    "dark:data-[state=inactive]:border-border dark:data-[state=inactive]:bg-transparent dark:data-[state=inactive]:text-muted-foreground dark:data-[state=inactive]:hover:bg-primary/15 dark:data-[state=inactive]:hover:text-primary dark:data-[state=inactive]:hover:border-primary/40",
    // Active state (light + dark)
    "data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:hover:opacity-90 data-[state=active]:shadow-xs",
    "dark:data-[state=active]:border-primary dark:data-[state=active]:bg-primary dark:data-[state=active]:text-primary-foreground"
);

export function CategoryPillsNav({
    categories,
    activeId,
    onSelect,
    catalogSlug = "shop",
    lang,
    asTabs = false,
    className,
}: CategoryPillsNavProps) {
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
                                className={TAB_TRIGGER_CLASS}
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
        <nav aria-label="Categories" className={cn("w-full overflow-x-auto no-scrollbar scrollbar-none pb-2 sm:pb-0", className)}>
            <ul role="list" className="flex flex-nowrap sm:flex-wrap items-center gap-2 mb-8 w-max sm:w-auto">
                {categories.map((category) => {
                    const rawCategorySlug =
                        (typeof category.slug === "object" && category.slug?.[lang])
                            ? category.slug[lang]
                            : (lang === "fr" ? category.slugFr : category.slugEn) ||
                              getLocalizedField(category.slug, lang) ||
                              (typeof category.slug === "string" ? category.slug : "");
                    const categorySlug = rawCategorySlug ? rawCategorySlug.replace(/^\/+/, "") : "";
                    const normalizedActiveId = activeId ? activeId.replace(/^\/+/, "") : "";

                    const categoryName =
                        getLocalizedField(category.name, lang) ||
                        (lang === "fr" ? category.nameFr : category.nameEn) ||
                        "";
                    const isActive =
                        Boolean(normalizedActiveId) && (
                            normalizedActiveId === categorySlug ||
                            (typeof category.slug === "object" && normalizedActiveId === (category.slug?.[lang] || "").replace(/^\/+/, "")) ||
                            (typeof category.slug === "object" && normalizedActiveId === (category.slug?.["en"] || "").replace(/^\/+/, "")) ||
                            (typeof category.slug === "object" && normalizedActiveId === (category.slug?.["fr"] || "").replace(/^\/+/, "")) ||
                            normalizedActiveId === (category.slugFr || "").replace(/^\/+/, "") ||
                            normalizedActiveId === (category.slugEn || "").replace(/^\/+/, "") ||
                            normalizedActiveId === category.id
                        );

                    const href = categorySlug
                        ? `/${lang}/${catalogSlug}/${categorySlug}`
                        : `/${lang}/${catalogSlug}`;

                    return (
                        <li key={category.id}>
                            <Link
                                href={href}
                                onClick={(e) => {
                                    if (onSelect) {
                                        e.preventDefault();
                                        onSelect(category);
                                    }
                                }}
                                className={cn(
                                    BASE_PILL_CLASS,
                                    "inline-block",
                                    isActive ? ACTIVE_PILL_CLASS : INACTIVE_PILL_CLASS
                                )}
                                data-state={isActive ? "active" : "inactive"}
                                aria-current={isActive ? "page" : undefined}
                            >
                                {categoryName}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
