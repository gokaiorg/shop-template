"use client";

import React from "react";
import { cn } from "@/lib/utils";

export interface AdminLanguageSwitcherProps {
    activeLang: string;
    onLanguageChange: (lang: string) => void;
    locales?: string[] | readonly string[];
    className?: string;
    size?: "sm" | "default";
}

/**
 * Shared styling constants matching the Custom Specifications (metafields) language switcher.
 */
export const adminLanguageSwitcherContainerClass =
    "inline-flex items-center rounded-lg bg-muted/80 p-1 border border-border/50 gap-1 shadow-xs";

export const adminLanguageSwitcherButtonClass = (
    isActive: boolean,
    size: "sm" | "default" = "default"
) =>
    cn(
        size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-3 py-1 text-xs",
        "font-semibold uppercase rounded-md transition-all cursor-pointer select-none",
        isActive
            ? "bg-primary text-primary-foreground shadow-xs font-bold"
            : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
    );

/**
 * Unified language switcher component for Admin forms.
 * Mutualizes the design established in Custom Specifications (metafields).
 */
export function AdminLanguageSwitcher({
    activeLang,
    onLanguageChange,
    locales = ["en", "fr"],
    className,
    size = "default",
}: AdminLanguageSwitcherProps) {
    if (!locales || locales.length <= 1) return null;

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLButtonElement>,
        index: number
    ) => {
        if (e.key === "ArrowRight") {
            e.preventDefault();
            const nextIdx = (index + 1) % locales.length;
            onLanguageChange(locales[nextIdx]);
        } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            const prevIdx = (index - 1 + locales.length) % locales.length;
            onLanguageChange(locales[prevIdx]);
        }
    };

    return (
        <div
            role="tablist"
            aria-label="Language selector"
            className={cn(adminLanguageSwitcherContainerClass, className)}
        >
            {locales.map((loc, idx) => {
                const isActive = activeLang === loc;
                return (
                    <button
                        key={loc}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        tabIndex={isActive ? 0 : -1}
                        onClick={() => onLanguageChange(loc)}
                        onKeyDown={(e) => handleKeyDown(e, idx)}
                        className={adminLanguageSwitcherButtonClass(isActive, size)}
                    >
                        {loc.toUpperCase()}
                    </button>
                );
            })}
        </div>
    );
}
