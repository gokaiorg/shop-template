import React from "react";

export interface ProductSpecificationsProps {
    specifications?: object | null;
    lang: string;
    className?: string;
    id?: string;
}

const SPEC_ORDER = ["dominance", "thc", "cbd", "effects", "relieves"] as const;
type SpecKey = (typeof SPEC_ORDER)[number];

interface SpecItem {
    key: SpecKey;
    label: string;
    value: string;
}

function formatLabel(key: string, lang: string): string {
    const lower = key.toLowerCase();
    if (lower === "thc") return "THC";
    if (lower === "cbd") return "CBD";
    if (lang.startsWith("fr")) {
        if (lower === "effects") return "Effets";
        if (lower === "relieves") return "Soulage";
        if (lower === "dominance") return "Dominance";
    }
    return key.charAt(0).toUpperCase() + key.slice(1).toLowerCase();
}

function getDominanceColor(value: string): string {
    const valLower = value.toLowerCase();
    if (valLower.includes("sativa")) return "text-emerald-800 dark:text-[#d1fee5]";
    if (valLower.includes("hybrid")) return "text-lime-900 dark:text-[#c0ef24]";
    if (valLower.includes("indica")) return "text-pink-900 dark:text-[#ee9cc9]";
    return "text-foreground";
}

export function ProductSpecifications({
    specifications,
    lang,
    className = "",
    id = "product-specifications",
}: ProductSpecificationsProps) {
    if (!specifications || typeof specifications !== "object") {
        return null;
    }

    const customSpecs = specifications as Record<string, unknown>;
    const items: SpecItem[] = [];

    for (const key of SPEC_ORDER) {
        const rawValue = customSpecs[key];
        if (rawValue === undefined || rawValue === null) {
            continue;
        }

        if (key === "thc" || key === "cbd") {
            const cleanStr = String(rawValue).trim().replace(",", ".").replace("%", "");
            const num = Number(cleanStr);
            if (isNaN(num) || num === 0) {
                continue;
            }
        }

        let displayValue = "";
        if (typeof rawValue === "object" && !Array.isArray(rawValue)) {
            const localizedRecord = rawValue as Record<string, string>;
            const locVal = localizedRecord[lang]
                || localizedRecord["en"]
                || Object.values(localizedRecord)[0]
                || "";
            displayValue = String(locVal).trim();
        } else {
            displayValue = String(rawValue).trim();
            if ((key === "thc" || key === "cbd") && !displayValue.includes("%")) {
                displayValue = `${displayValue}%`;
            }
        }

        if (!displayValue) {
            continue;
        }

        const label = formatLabel(key, lang);

        items.push({
            key,
            label,
            value: displayValue,
        });
    }

    if (items.length === 0) {
        return null;
    }

    const headingText = lang.startsWith("fr") ? "Caractéristiques" : "Specifications";

    return (
        <section
            aria-labelledby={`${id}-title`}
            className={`mt-8 rounded-3xl border border-zinc-200/90 dark:border-white/15 bg-white/90 dark:bg-zinc-900/85 backdrop-blur-md p-6 shadow-soft ${className}`}
        >
            <h2
                id={`${id}-title`}
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4"
            >
                {headingText}
            </h2>

            <ul
                className="grid grid-cols-2 gap-3"
                aria-label={lang.startsWith("fr") ? "Caractéristiques du produit" : "Product specifications"}
            >
                {items.map(({ key, label, value }) => {
                    if (key === "dominance") {
                        const colorClass = getDominanceColor(value);
                        return (
                            <li
                                key={key}
                                className="col-span-1 flex items-center justify-start p-3.5 rounded-2xl bg-zinc-50/90 dark:bg-white/[0.04] border border-zinc-200/70 dark:border-white/10 transition-colors text-left"
                                aria-label={`Dominance: ${value}`}
                            >
                                <span className={`text-sm sm:text-base md:text-xl font-bold tracking-wide uppercase ${colorClass}`}>
                                    {value}
                                </span>
                            </li>
                        );
                    }

                    if (key === "thc" || key === "cbd") {
                        return (
                            <li
                                key={key}
                                className="col-span-1 flex items-center justify-between gap-2 sm:gap-3 p-3.5 rounded-2xl bg-zinc-50/90 dark:bg-white/[0.04] border border-zinc-200/70 dark:border-white/10 transition-colors"
                                aria-label={`${label}: ${value}`}
                            >
                                <span className="text-xs sm:text-sm font-medium text-muted-foreground uppercase">
                                    {label}
                                </span>
                                <span className="text-xl sm:text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
                                    {value}
                                </span>
                            </li>
                        );
                    }

                    if (key === "effects" || key === "relieves") {
                        return (
                            <li
                                key={key}
                                className="col-span-2 flex flex-col items-start gap-1.5 p-4 rounded-2xl bg-zinc-50/90 dark:bg-white/[0.04] border border-zinc-200/70 dark:border-white/10 transition-colors"
                                aria-label={`${label}: ${value}`}
                            >
                                <span className="text-xs sm:text-sm font-medium text-muted-foreground">
                                    {label}
                                </span>
                                <span className="text-sm sm:text-base font-semibold text-foreground leading-relaxed">
                                    {value}
                                </span>
                            </li>
                        );
                    }

                    return (
                        <li
                            key={key}
                            className="col-span-1 flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-50/90 dark:bg-white/[0.04] border border-zinc-200/70 dark:border-white/10 transition-colors"
                            aria-label={`${label}: ${value}`}
                        >
                            <span className="text-xs sm:text-sm font-medium text-muted-foreground capitalize">
                                {label}
                            </span>
                            <span className="text-sm font-bold text-foreground text-left sm:text-right">
                                {value}
                            </span>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}

export default ProductSpecifications;
