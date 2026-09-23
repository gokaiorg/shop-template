"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { FaqSectionSettings } from "@/types/database";
import { getLocalizedField } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AdminEditBadge } from "@/components/admin/AdminEditBadge";

interface FaqAccordionProps {
    faqSection?: FaqSectionSettings;
    locale?: string;
    lang?: string;
    className?: string;
    forceDisplay?: boolean;
    as?: "section" | "div";
}

export function FaqAccordion({
    faqSection,
    locale,
    lang = "en",
    className = "",
    forceDisplay = false,
    as: Component = "section",
}: FaqAccordionProps) {
    const activeLocale = locale || lang || "en";
    const isFr = activeLocale === "fr";

    // 1. Status Check: Return null if disabled/inactive unless forced on a modular page
    const isEnabled = Boolean(faqSection?.enabled || faqSection?.status === "active");
    if (!forceDisplay && (!faqSection || !isEnabled)) {
        return null;
    }

    // 2. Filter valid Q&A items
    const rawItems = faqSection?.items || [];
    const localizedItems = rawItems
        .map((item, index) => ({
            id: item.id || `faq-item-${index}`,
            question: getLocalizedField(item.question, activeLocale),
            answer: getLocalizedField(item.answer, activeLocale),
        }))
        .filter((item) => item.question.trim().length > 0 && item.answer.trim().length > 0);

    if (localizedItems.length === 0 && !forceDisplay) {
        return null;
    }

    // 3. Localized Title and Subtitle
    const title =
        getLocalizedField(faqSection?.title, activeLocale) ||
        (isFr ? "Questions fréquentes" : "Frequently Asked Questions");

    const subtitle = getLocalizedField(faqSection?.subtitle, activeLocale) || "";

    // 4. Interactive Accordion state (set of open item indices)
    const [openIndices, setOpenIndices] = useState<number[]>([0]);

    const toggleItem = (index: number) => {
        setOpenIndices((prev) =>
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        );
    };

    // 5. Generate Schema.org FAQPage JSON-LD for GEO / SEO
    const faqJsonLd = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: localizedItems.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
                "@type": "Answer",
                text: item.answer,
            },
        })),
    };

    return (
        <Component
            aria-labelledby="faq-section-heading"
            className={cn("relative w-full m-0 py-0 bg-transparent", className)}
        >
            <AdminEditBadge href="/admin/blocks/faq" locale={activeLocale} />
            {/* Inject dynamic JSON-LD FAQPage Schema */}
            {localizedItems.length > 0 && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
                />
            )}

            <div className="w-full max-w-7xl mx-auto px-6 md:px-16">
                {/* Header with Title and Optional Subtitle */}
                <div className="max-w-3xl mx-auto text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-4 backdrop-blur-md shadow-xs">
                        <HelpCircle className="w-3.5 h-3.5 text-primary" />
                        <span>FAQ</span>
                    </div>
                    {title && (
                        <h2
                            id="faq-section-heading"
                            className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-4"
                        >
                            {title}
                        </h2>
                    )}
                    {subtitle && (
                        <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
                            {subtitle}
                        </p>
                    )}
                </div>

                {/* Hairline Accordion List (border-t border-white/10 without thick dividers) */}
                <div className="max-w-3xl mx-auto border-b border-black/[0.08] dark:border-white/10">
                    {localizedItems.map((item, index) => {
                        const isOpen = openIndices.includes(index);
                        const questionId = `faq-q-${index}`;
                        const answerId = `faq-a-${index}`;

                        return (
                            <div
                                key={item.id}
                                className={cn(
                                    "group border-t border-black/[0.08] dark:border-white/10 transition-colors duration-200",
                                    isOpen && "border-primary/40 dark:border-primary/40"
                                )}
                            >
                                <button
                                    type="button"
                                    onClick={() => toggleItem(index)}
                                    aria-expanded={isOpen}
                                    aria-controls={answerId}
                                    id={questionId}
                                    className="w-full flex items-center justify-between py-6 text-left transition-colors cursor-pointer group-hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl"
                                >
                                    <span className="text-base sm:text-lg font-medium text-foreground pr-6 transition-colors group-hover:text-primary">
                                        {item.question}
                                    </span>
                                    <div
                                        className={cn(
                                            "size-8 rounded-full flex items-center justify-center bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/10 shrink-0 transition-all duration-300",
                                            isOpen && "bg-primary/10 border-primary/30 text-primary rotate-180"
                                        )}
                                    >
                                        <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                    </div>
                                </button>

                                {/* Animated Disclosure using Tailwind CSS Grid Technique */}
                                <div
                                    id={answerId}
                                    role="region"
                                    aria-labelledby={questionId}
                                    className={cn(
                                        "grid transition-all duration-300 ease-in-out",
                                        isOpen
                                            ? "grid-rows-[1fr] opacity-100"
                                            : "grid-rows-[0fr] opacity-0"
                                    )}
                                >
                                    <div className="overflow-hidden">
                                        <div className="pb-6 pt-1 text-muted-foreground text-sm sm:text-base leading-relaxed whitespace-pre-line">
                                            {item.answer}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </Component>
    );
}

export { FaqAccordion as FAQBlock, FaqAccordion as FaqBlock };
