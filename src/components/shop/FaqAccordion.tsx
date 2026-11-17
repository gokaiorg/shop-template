import React from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { FaqSectionSettings } from "@/types/database";
import { getLocalizedField } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { AdminEditBadge } from "@/components/admin/AdminEditBadge";

export interface FaqAccordionProps {
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

  const isEnabled = Boolean(
    faqSection?.enabled || faqSection?.status === "active"
  );
  if (!forceDisplay && (!faqSection || !isEnabled)) {
    return null;
  }

  const rawItems = faqSection?.items || [];
  const localizedItems = rawItems
    .map((item, index) => ({
      id: item.id || `faq-item-${index}`,
      question: getLocalizedField(item.question, activeLocale),
      answer: getLocalizedField(item.answer, activeLocale),
    }))
    .filter(
      (item) =>
        item.question.trim().length > 0 && item.answer.trim().length > 0
    );

  if (localizedItems.length === 0 && !forceDisplay) {
    return null;
  }

  const title =
    getLocalizedField(faqSection?.title, activeLocale) ||
    (isFr ? "Questions fréquentes" : "Frequently Asked Questions");

  const subtitle = getLocalizedField(faqSection?.subtitle, activeLocale) || "";

  return (
    <Component
      aria-labelledby="faq-section-heading"
      className={cn("relative w-full m-0 py-0 bg-transparent", className)}
    >
      <AdminEditBadge href="/admin/blocks/faq" locale={activeLocale} />

      <div className="w-full max-w-7xl mx-auto px-6 md:px-16">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-100/90 dark:bg-zinc-900/90 border border-border/60 text-muted-foreground text-xs md:text-sm font-semibold uppercase tracking-wider mb-4 backdrop-blur-md shadow-xs">
            <HelpCircle className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
            <span>FAQ</span>
          </div>
          {title && (
            <h2
              id="faq-section-heading"
              className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4"
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-base text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        <div className="max-w-3xl mx-auto border-b border-black/[0.08] dark:border-white/10">
          {localizedItems.map((item, index) => (
            <details
              key={item.id}
              open={index === 0}
              className="group border-t border-black/[0.08] dark:border-white/10 transition-colors duration-200 open:border-primary/40 dark:open:border-primary/40"
            >
              <summary className="w-full flex items-center justify-between py-6 text-left transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden group-hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl">
                <span className="text-base sm:text-lg font-medium text-foreground pr-6 transition-colors group-hover:text-primary">
                  {item.question}
                </span>
                <span className="size-8 rounded-full flex items-center justify-center bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/10 shrink-0 transition-all duration-300 group-open:bg-primary/10 group-open:border-primary/30 group-open:text-primary group-open:rotate-180">
                  <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" aria-hidden="true" />
                </span>
              </summary>
              <div className="pb-6 pt-1 text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </div>
    </Component>
  );
}

export { FaqAccordion as FAQBlock, FaqAccordion as FaqBlock };
