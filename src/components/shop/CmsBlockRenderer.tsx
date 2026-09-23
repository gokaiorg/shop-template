import React from "react";
import { StoreSettings } from "@/types/database";
import { AboutSection } from "@/components/shop/AboutSection";
import { FaqAccordion } from "@/components/shop/FaqAccordion";
import { ContactSection } from "@/components/shop/ContactSection";
import { cn } from "@/lib/utils";

export interface CmsBlockRendererProps {
    blocks?: string[];
    storeSettings: StoreSettings;
    lang: string;
    dict?: any;
    forceDisplay?: boolean;
    className?: string;
}

const DEFAULT_BLOCK_ORDER = ["about", "faq", "contact"];

export function CmsBlockRenderer({
    blocks,
    storeSettings,
    lang,
    dict,
    forceDisplay = false,
    className,
}: CmsBlockRendererProps) {
    if (!storeSettings) {
        return null;
    }

    const targetBlocks = blocks && blocks.length > 0 ? blocks : DEFAULT_BLOCK_ORDER;
    const renderedBlocks: { key: string; component: React.ReactNode }[] = [];

    targetBlocks.forEach((blockKey) => {
        if (blockKey === "about") {
            const isEnabled = forceDisplay || Boolean(storeSettings.aboutSection?.enabled);
            const hasContent = Boolean(
                storeSettings.aboutSection?.title ||
                storeSettings.aboutSection?.description ||
                (storeSettings.aboutSection?.images && storeSettings.aboutSection.images.length > 0)
            );
            if (isEnabled && storeSettings.aboutSection && (forceDisplay || hasContent)) {
                renderedBlocks.push({
                    key: "about",
                    component: (
                        <AboutSection
                            aboutSection={storeSettings.aboutSection}
                            lang={lang}
                            forceDisplay={forceDisplay}
                            as="div"
                        />
                    ),
                });
            }
        } else if (blockKey === "faq") {
            const isEnabled =
                forceDisplay ||
                Boolean(storeSettings.faqSection?.enabled || storeSettings.faqSection?.status === "active");
            const hasItems =
                Array.isArray(storeSettings.faqSection?.items) &&
                storeSettings.faqSection.items.length > 0;
            if (isEnabled && storeSettings.faqSection && (forceDisplay || hasItems)) {
                renderedBlocks.push({
                    key: "faq",
                    component: (
                        <FaqAccordion
                            faqSection={storeSettings.faqSection}
                            lang={lang}
                            forceDisplay={forceDisplay}
                            as="div"
                        />
                    ),
                });
            }
        } else if (blockKey === "contact") {
            const isEnabled = forceDisplay || Boolean(storeSettings.contactSection?.enabled);
            if (isEnabled && storeSettings.contactSection) {
                renderedBlocks.push({
                    key: "contact",
                    component: (
                        <ContactSection
                            contactSection={storeSettings.contactSection}
                            lang={lang}
                            dict={dict}
                            forceDisplay={forceDisplay}
                            as="div"
                        />
                    ),
                });
            }
        }
    });

    if (renderedBlocks.length === 0) {
        return null;
    }

    return (
        <div className={cn("relative flex flex-col gap-y-24 md:gap-y-32 w-full pb-24 md:pb-32", className)}>
            {/* Ambient Glows: positioned in absolute -z-10 behind the component flow */}
            <div
                className="absolute inset-0 -z-10 pointer-events-none overflow-hidden"
                aria-hidden="true"
            >
                {/* Radial ambient glow at the top */}
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-glow-ambient opacity-80 blur-3xl pointer-events-none" />
                {/* Primary theme radial glow on upper left */}
                <div className="absolute top-1/4 -left-48 w-[600px] h-[600px] bg-glow-primary opacity-60 blur-3xl pointer-events-none" />
                {/* Accent theme radial glow on lower right */}
                <div className="absolute top-2/3 -right-48 w-[650px] h-[650px] bg-glow-accent opacity-50 blur-3xl pointer-events-none" />
                {/* Subtle base radial glow at the bottom */}
                <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-glow-subtle opacity-70 blur-3xl pointer-events-none" />
            </div>

            {/* Injected block components, each wrapped in a semantic <section> with m-0 */}
            {renderedBlocks.map(({ key, component }) => (
                <section key={key} className="m-0 relative w-full">
                    {component}
                </section>
            ))}
        </div>
    );
}

export { CmsBlockRenderer as CmsBlocksRenderer };
export { CmsBlockRenderer as PageBlocks };
