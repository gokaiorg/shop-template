import { Mail } from "lucide-react";
import { ContactSectionSettings } from "@/types/database";
import { getLocalizedField } from "@/lib/i18n";
import { ContactForm } from "@/components/forms/ContactForm";
import { cn } from "@/lib/utils";
import { AdminEditBadge } from "@/components/admin/AdminEditBadge";

interface ContactSectionProps {
    contactSection?: ContactSectionSettings;
    locale?: string;
    lang?: string;
    dict?: any;
    className?: string;
    forceDisplay?: boolean;
    as?: "section" | "div";
}

export function ContactSection({
    contactSection,
    locale,
    lang = "en",
    dict,
    className = "",
    forceDisplay = false,
    as: Component = "section",
}: ContactSectionProps) {
    const activeLocale = locale || lang || "en";

    // If neither enabled globally nor force displayed on a modular page, don't render
    if (!forceDisplay && (!contactSection || !contactSection.enabled)) {
        return null;
    }

    const title =
        getLocalizedField(contactSection?.title, activeLocale) ||
        (activeLocale === "fr" ? "Contactez-nous" : "Contact Us");

    const description = getLocalizedField(contactSection?.description, activeLocale) || "";

    const contactDict = dict?.contact || dict;

    return (
        <Component
            aria-labelledby="contact-section-heading"
            className={cn("relative w-full m-0 py-0 bg-transparent", className)}
        >
            <AdminEditBadge href="/admin/blocks/contact" locale={activeLocale} />
            <div className="w-full max-w-7xl mx-auto px-6 md:px-16">
                <div className="max-w-3xl mx-auto text-center mb-8">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 text-muted-foreground text-xs md:text-sm font-semibold uppercase tracking-wider mb-4 backdrop-blur-md shadow-xs">
                        <Mail className="w-3.5 h-3.5 text-primary" />
                        <span>{activeLocale === "fr" ? "Contact" : "Contact"}</span>
                    </div>
                    {title && (
                        <h2
                            id="contact-section-heading"
                            className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground mb-4"
                        >
                            {title}
                        </h2>
                    )}
                    {description && (
                        <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-line">
                            {description}
                        </p>
                    )}
                </div>

                <div className="max-w-2xl mx-auto">
                    <ContactForm lang={activeLocale} dict={contactDict} />
                </div>
            </div>
        </Component>
    );
}

export { ContactSection as ContactBlock };

