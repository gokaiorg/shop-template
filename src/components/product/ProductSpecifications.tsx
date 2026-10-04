import React from "react";

export interface ProductSpecificationsProps {
    specifications?: Record<string, any> | null;
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
    if (valLower.includes("sativa")) return "text-[#d1fee5]";
    if (valLower.includes("hybrid")) return "text-[#c0ef24]";
    if (valLower.includes("indica")) return "text-[#ee9cc9]";
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

    const customSpecs = specifications;
    const items: SpecItem[] = [];

    // 1. Ordre strict et filtrage des clés
    for (const key of SPEC_ORDER) {
        const rawValue = customSpecs[key];
        if (rawValue === undefined || rawValue === null) {
            continue;
        }

        // 2. Règle d'exclusion (Zéro absolu pour THC et CBD)
        if (key === "thc" || key === "cbd") {
            const cleanStr = String(rawValue).trim().replace(",", ".").replace("%", "");
            const num = Number(cleanStr);
            if (isNaN(num) || num === 0) {
                continue;
            }
        }

        // 4. Résolution de la valeur (Multilingue & formatage)
        let displayValue = "";
        if (typeof rawValue === "object" && !Array.isArray(rawValue)) {
            const locVal = (rawValue as Record<string, string>)[lang]
                || (rawValue as Record<string, string>)["en"]
                || Object.values(rawValue)[0]
                || "";
            displayValue = String(locVal).trim();
        } else {
            displayValue = String(rawValue).trim();
            // Ajout du suffixe '%' uniquement pour THC et CBD si manquant
            if ((key === "thc" || key === "cbd") && !displayValue.includes("%")) {
                displayValue = `${displayValue}%`;
            }
        }

        if (!displayValue) {
            continue;
        }

        // 3. Formatage du label
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
            className={`mt-8 rounded-3xl border border-zinc-200/80 dark:border-white/10 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-md p-6 shadow-soft ${className}`}
        >
            <h3
                id={`${id}-title`}
                className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4"
            >
                {headingText}
            </h3>

            <ul
                className="grid grid-cols-2 gap-3"
                aria-label={lang.startsWith("fr") ? "Caractéristiques du produit" : "Product specifications"}
            >
                {items.map(({ key, label, value }) => {
                    // 1. Règle pour "Dominance" : pas de label, couleur dynamique, aligné à gauche
                    if (key === "dominance") {
                        const colorClass = getDominanceColor(value);
                        return (
                            <li
                                key={key}
                                className="col-span-1 flex items-center justify-start p-3.5 rounded-2xl bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/5 transition-colors text-left"
                                aria-label={`Dominance: ${value}`}
                            >
                                <span className={`text-sm sm:text-base md:text-xl font-bold tracking-wide uppercase ${colorClass}`}>
                                    {value}
                                </span>
                            </li>
                        );
                    }

                    // 2. Règle pour "THC" et "CBD" : label conservé, valeur agrandie (text-xl à text-3xl)
                    if (key === "thc" || key === "cbd") {
                        return (
                            <li
                                key={key}
                                className="col-span-1 flex items-center justify-between gap-2 sm:gap-3 p-3.5 rounded-2xl bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/5 transition-colors"
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

                    // 3. Règle pour "Effects" et "Relieves" : label au-dessus, pleine largeur (col-span-2)
                    if (key === "effects" || key === "relieves") {
                        return (
                            <li
                                key={key}
                                className="col-span-2 flex flex-col items-start gap-1.5 p-4 rounded-2xl bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/5 transition-colors"
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

                    // Fallback générique
                    return (
                        <li
                            key={key}
                            className="col-span-1 flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-50/80 dark:bg-white/[0.03] border border-zinc-200/60 dark:border-white/5 transition-colors"
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
