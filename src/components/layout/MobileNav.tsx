"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, ChevronDown, X } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { LangToggle } from "./LangToggle";
import { CurrencySwitcher } from "./CurrencySwitcher";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useBrand } from "@/components/providers/BrandProvider";
import { Page, Category, SocialLink } from "@/types/database";
import { getLocalizedField } from "@/lib/i18n";
import { cn } from "@/lib/utils";

// =============================================================================
// Minimalist Social SVG Icons
// =============================================================================

function SocialIcon({ platform }: { platform: string }) {
    const p = (platform || "").toLowerCase().trim();

    if (p === "github") {
        return (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
        );
    }

    if (p === "x" || p === "twitter") {
        return (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
        );
    }

    if (p === "linkedin") {
        return (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
        );
    }

    if (p === "instagram") {
        return (
            <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true">
                <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
            </svg>
        );
    }

    if (p === "facebook") {
        return (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
        );
    }

    if (p === "tiktok") {
        return (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.86 4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-3.04-1.52z" />
            </svg>
        );
    }

    if (p === "youtube") {
        return (
            <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
        );
    }

    // Generic link fallback
    return (
        <svg className="w-5 h-5 fill-none stroke-current stroke-2" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" x2="22" y1="12" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
    );
}

// =============================================================================
// Mobile Navigation Component
// =============================================================================

export interface MobileNavProps {
    lang: string;
    dict: Record<string, any>;
    pages?: Page[];
    categories?: Category[];
    footerPages?: Page[];
    socialLinks?: SocialLink[];
}

export function MobileNav({
    lang,
    dict,
    pages = [],
    categories = [],
    footerPages = [],
    socialLinks = [],
}: MobileNavProps) {
    const [open, setOpen] = useState(false);
    const [solutionsExpanded, setSolutionsExpanded] = useState(true);
    const pathname = usePathname();
    const { brand, catalogTitle, catalogSlug } = useBrand();
    const { logo } = brand.assets;
    const brandName = brand.identity.name;

    const headerDict = dict?.header || dict || {};
    const legalDict = dict?.legal || {};
    const isFr = lang === "fr";

    // 1. Catalog & Solutions Link
    const activeCatalogSlug = (typeof catalogSlug === "object" ? getLocalizedField(catalogSlug, lang) : catalogSlug) || "shop";
    const catalogHref = `/${lang}/${activeCatalogSlug}`;
    const isCatalogActive = pathname === catalogHref;
    const catalogLabel = getLocalizedField(catalogTitle, lang) || headerDict.shop || (isFr ? "Solutions" : "Solutions");

    // 2. Separate Main Pages vs Contact CTA
    const mainPages = pages.filter((p) => {
        const s = (typeof p.slug === "object" ? Object.values(p.slug).join(" ") : p.slug || p.id).toLowerCase();
        return !s.includes("contact");
    });

    const contactLabel = headerDict.contact || dict?.contact || (isFr ? "Contactez-nous" : "Contact Us");
    const contactHref = `/${lang}/contact`;

    // 3. Footer Legal Links (Discreet text links)
    const legalItems = footerPages.length > 0
        ? footerPages.map((p) => {
            const pageSlug = getLocalizedField(p.slug, lang) || (typeof p.slug === "string" ? p.slug : p.id);
            const label = getLocalizedField(p.title, lang) || (isFr ? p.title_fr : p.title_en) || pageSlug;
            return { label, href: `/${lang}/${pageSlug}` };
        })
        : (brand.navigation?.footerSections?.legal || []).map((item) => ({
            label: legalDict[item.key] || item.key.replace(/_/g, " "),
            href: item.href.startsWith("http") ? item.href : `/${lang}${item.href}`,
        }));

    const legalTitle = legalDict.title || (isFr ? "Légal" : "Legal");

    // 4. Social Links (Minimalist SVG Icons)
    const activeSocials = socialLinks.length > 0
        ? socialLinks
        : (brand.navigation?.socials || []);

    const menuLabel = headerDict?.toggle_menu || "Toggle menu";

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label={menuLabel}
                    className="md:hidden cursor-pointer bg-transparent text-foreground hover:text-primary hover:bg-transparent focus-visible:text-primary transition-colors"
                >
                    <Menu className="h-6 w-6 transition-colors" />
                    <span className="sr-only">{menuLabel}</span>
                </Button>
            </SheetTrigger>

            {/* 1. Structure Principale: Full height (h-screen / h-dvh), flex, flex-col, justify-between */}
            <SheetContent
                side="left"
                showCloseButton={false}
                className="h-screen max-h-screen w-[310px] sm:w-[360px] p-6 flex flex-col justify-between overflow-hidden bg-background"
            >
                {/* Brand Header & Centered Close Button */}
                <SheetHeader className="text-left shrink-0 pb-4 border-b border-border/40">
                    <div className="flex items-center justify-between w-full">
                        <SheetTitle asChild>
                            <Link
                                href={`/${lang}`}
                                onClick={() => setOpen(false)}
                                className="flex items-center gap-2.5 font-bold text-lg tracking-tight group"
                            >
                                <Image
                                    src={logo.src}
                                    alt={logo.alt || `${brandName} Logo`}
                                    width={logo.width || 32}
                                    height={logo.height || 32}
                                    className="object-contain transition-transform group-hover:scale-105"
                                />
                                <span>{brandName}</span>
                            </Link>
                        </SheetTitle>

                        <SheetClose asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                aria-label={dict?.header?.close_menu || (isFr ? "Fermer le menu" : "Close menu")}
                                className="cursor-pointer bg-transparent text-foreground hover:text-primary hover:bg-transparent focus-visible:text-primary transition-colors"
                            >
                                <X className="h-6 w-6 transition-colors" />
                                <span className="sr-only">
                                    {dict?.header?.close_menu || (isFr ? "Fermer le menu" : "Close menu")}
                                </span>
                            </Button>
                        </SheetClose>
                    </div>
                </SheetHeader>

                {/* 2. Navigation Haute & Corps Déroulant */}
                <div className="flex-1 flex flex-col justify-between overflow-y-auto overflow-x-hidden py-5 space-y-6 pr-1">
                    <div className="flex flex-col gap-4">
                        {/* Solutions Dropdown / Link */}
                        <div className="flex flex-col gap-1 w-full">
                            <div className="flex items-center justify-between w-full">
                                <Link
                                    href={catalogHref}
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        "text-base font-semibold transition-colors hover:text-primary",
                                        isCatalogActive ? "text-primary font-bold" : "text-foreground"
                                    )}
                                >
                                    {catalogLabel}
                                </Link>
                                {categories.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={() => setSolutionsExpanded(!solutionsExpanded)}
                                        aria-label={solutionsExpanded ? "Collapse solutions" : "Expand solutions"}
                                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                                    >
                                        <ChevronDown
                                            className={cn(
                                                "h-4 w-4 transition-transform duration-200",
                                                solutionsExpanded && "rotate-180"
                                            )}
                                        />
                                    </button>
                                )}
                            </div>

                            {/* Sub-categories */}
                            {categories.length > 0 && solutionsExpanded && (
                                <ul className="flex flex-col gap-1 pl-3 my-1 border-l-2 border-border/50">
                                    {categories.map((category) => {
                                        const rawCatSlug =
                                            (typeof category.slug === "object" && category.slug?.[lang])
                                                ? category.slug[lang]
                                                : (isFr ? category.nameFr : category.nameEn) ||
                                                getLocalizedField(category.slug, lang) ||
                                                (typeof category.slug === "string" ? category.slug : category.id);
                                        const catSlug = rawCatSlug ? rawCatSlug.replace(/^\/+/, "") : "";
                                        const href = `/${lang}/${activeCatalogSlug}/${catSlug}`;
                                        const isActive = pathname === href || pathname.startsWith(`${href}/`);
                                        const label =
                                            getLocalizedField(category.name, lang) ||
                                            (isFr ? category.nameFr : category.nameEn) ||
                                            catSlug;

                                        return (
                                            <li key={category.id || catSlug}>
                                                <Link
                                                    href={href}
                                                    onClick={() => setOpen(false)}
                                                    className={cn(
                                                        "block py-1 text-sm transition-colors hover:text-primary",
                                                        isActive ? "text-primary font-medium" : "text-muted-foreground"
                                                    )}
                                                >
                                                    {label}
                                                </Link>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        {/* Other Primary Pages (e.g. About) */}
                        {mainPages.map((page) => {
                            const pageSlug = getLocalizedField(page.slug, lang) || (typeof page.slug === "string" ? page.slug : page.id);
                            const href = `/${lang}/${pageSlug}`;
                            const isActive = pathname === href;
                            const label = getLocalizedField(page.title, lang) || (isFr ? page.title_fr : page.title_en) || pageSlug;

                            return (
                                <Link
                                    key={page.id || pageSlug}
                                    href={href}
                                    onClick={() => setOpen(false)}
                                    className={cn(
                                        "text-base font-semibold transition-colors hover:text-primary",
                                        isActive ? "text-primary font-bold" : "text-foreground"
                                    )}
                                >
                                    {label}
                                </Link>
                            );
                        })}

                        {/* Full-width Contact CTA Button */}
                        <div className="w-full pt-2">
                            <Link
                                href={contactHref}
                                onClick={() => setOpen(false)}
                                className="w-full flex items-center justify-center py-2.5 px-4 rounded-xl bg-primary text-primary-foreground font-semibold shadow-sm hover:opacity-90 active:scale-[0.99] transition-all text-center text-sm tracking-tight cursor-pointer"
                            >
                                {contactLabel}
                            </Link>
                        </div>
                    </div>

                    {/* Discreet Legal Section */}
                    {legalItems.length > 0 && (
                        <div className="flex flex-col gap-2 pt-4 border-t border-border/40">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                                {legalTitle}
                            </span>
                            <ul className="flex flex-col gap-1.5">
                                {legalItems.map((item, idx) => (
                                    <li key={`${item.href}-${idx}`}>
                                        <Link
                                            href={item.href}
                                            onClick={() => setOpen(false)}
                                            className="text-xs text-muted-foreground hover:text-foreground transition-colors py-0.5 inline-block"
                                        >
                                            {item.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                {/* 3. Zone Basse (Sticky Bottom / Footer du menu) */}
                <div className="mt-auto shrink-0 pt-4 border-t border-border/60 flex flex-col gap-3">
                    {/* Aligned Currency, Language & Theme Toggles */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground font-medium">
                            {isFr ? "Options" : "Options"}
                        </span>
                        <div className="flex items-center gap-1.5">
                            <CurrencySwitcher />
                            <ThemeToggle dict={headerDict} />
                            <LangToggle lang={lang} dict={headerDict} />
                        </div>
                    </div>

                    {/* Minimalist Horizontal SVG Social Icons Row (No horizontal overflow) */}
                    {activeSocials.length > 0 && (
                        <div className="flex flex-row justify-center items-center gap-3 flex-wrap max-w-full overflow-x-hidden pt-1">
                            {activeSocials.map((social, idx) => (
                                <a
                                    key={`${social.platform}-${idx}`}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={social.platform}
                                    className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-muted/60 transition-colors"
                                >
                                    <SocialIcon platform={social.platform} />
                                </a>
                            ))}
                        </div>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}

