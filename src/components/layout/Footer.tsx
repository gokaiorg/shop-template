import React from 'react';
import Link from 'next/link';
import parse from 'html-react-parser';
import DOMPurify from 'isomorphic-dompurify';
import { brandConfig } from '@/config/brand.config';
import { Page, Category, SocialLink } from '@/types/database';
import { Dictionary } from '@/lib/dictionaries';
import { getLocalizedField } from '@/lib/i18n';
import { getAllPublishedCategories } from '@/lib/services/categories';
import { getStoreSettings } from '@/lib/services/settings';
import { AdminEditBadge } from '@/components/admin/AdminEditBadge';

interface FooterProps {
    lang: string;
    dict: Dictionary;
    pages?: Page[];
    categories?: Category[];
    catalogTitle?: Record<string, string>;
    catalogSlug?: string | Record<string, string>;
    brandName?: string;
    footerDescription?: Record<string, string>;
    socialLinks?: SocialLink[];
    footerRightMenuTitle?: Record<string, string>;
}

export async function Footer({
    lang,
    dict,
    pages = [],
    categories: initialCategories,
    catalogTitle,
    catalogSlug = 'shop',
    brandName,
    footerDescription,
    socialLinks,
    footerRightMenuTitle,
}: FooterProps) {
    if (!dict) return null;

    const settings = (!brandName || !footerDescription || !socialLinks || !footerRightMenuTitle)
        ? await getStoreSettings()
        : null;

    const activeBrandName = brandName || settings?.brandName || brandConfig.identity.name;
    const activeCatalogTitle = catalogTitle || settings?.catalogTitle;
    const activeCatalogSlug = (typeof catalogSlug === 'object' ? getLocalizedField(catalogSlug, lang) : catalogSlug)
        || (typeof settings?.catalogSlug === 'object' ? getLocalizedField(settings.catalogSlug, lang) : settings?.catalogSlug)
        || 'shop';
    const activeFooterDesc = footerDescription || settings?.footerDescription;
    const activeSocialLinks = socialLinks || settings?.socialLinks || brandConfig.navigation?.socials || [];
    const isFr = lang === 'fr';
    const activeFooterRightTitle = getLocalizedField(footerRightMenuTitle, lang) || getLocalizedField(settings?.footerRightMenuTitle, lang) || (isFr ? 'Légal' : 'Legal');

    const legalDict = (dict.legal || {}) as Record<string, string | undefined>;
    const headerDict = (dict.header || {}) as Record<string, string | undefined>;
    const { navigation } = brandConfig;
    const description = getLocalizedField(activeFooterDesc, lang)
        || getLocalizedField(settings?.footerDescription, lang)
        || '';

    const footerPages = pages
        .filter((p) => p.showInFooter)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const displayCatalogTitle = getLocalizedField(activeCatalogTitle, lang) || headerDict.shop || (isFr ? "Boutique" : "Shop");

    const sourceCategories = initialCategories ?? await getAllPublishedCategories();
    const categories = [...sourceCategories]
        .filter((c) => (c.status ?? 'published') === 'published')
        .sort((a, b) => {
            const orderDiff = (a.order ?? 0) - (b.order ?? 0);
            if (orderDiff !== 0) return orderDiff;
            const nameA = getLocalizedField(a.name, lang) || (isFr ? a.nameFr : a.nameEn) || '';
            const nameB = getLocalizedField(b.name, lang) || (isFr ? b.nameFr : b.nameEn) || '';
            return nameA.localeCompare(nameB, lang);
        });

    return (
        <footer className="border-t bg-zinc-50 dark:bg-black py-12 mt-auto relative">
            <AdminEditBadge
                href="/admin/settings#footer-social-links"
                locale={lang}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20"
            />
            <div className="w-full max-w-7xl mx-auto px-6 md:px-16 grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
                <div className="col-span-1 md:col-span-2">
                    <h2 className="font-bold text-lg mb-4">{activeBrandName}</h2>
                    {description ? (
                        <div className="text-muted-foreground text-sm max-w-sm leading-relaxed whitespace-pre-line [&_a]:underline [&_a]:hover:text-primary">
                            {parse(DOMPurify.sanitize(description, { ADD_ATTR: ['target'] }))}
                        </div>
                    ) : null}
                    {activeSocialLinks && activeSocialLinks.length > 0 && (
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2.5 mt-4 max-w-full">
                            {activeSocialLinks.map((social, idx) => (
                                <a
                                    key={`${social.platform}-${idx}`}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors py-0.5 whitespace-nowrap"
                                >
                                    {social.platform}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
                
                <div>
                    <h2 className="font-bold text-base mb-4">
                        <Link href={`/${lang}/${activeCatalogSlug}`} className="hover:text-primary transition-colors">
                            {displayCatalogTitle}
                        </Link>
                    </h2>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        {categories.slice(0, 6).map((category) => {
                            const catSlug = 
                                (typeof category.slug === 'object' && category.slug?.[lang])
                                    ? category.slug[lang]
                                    : (isFr ? category.slugFr : category.slugEn) ||
                                      getLocalizedField(category.slug, lang) ||
                                      (typeof category.slug === 'string' ? category.slug : category.id);
                            const catName = getLocalizedField(category.name, lang) || (isFr ? category.nameFr : category.nameEn);
                            if (!catName) return null;

                            return (
                                <li key={category.id}>
                                    <Link
                                        href={`/${lang}/${activeCatalogSlug}/${catSlug}`}
                                        className="hover:text-primary transition-colors"
                                    >
                                        {catName}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div>
                    <h2 className="font-bold text-base mb-4">{activeFooterRightTitle || legalDict.title || (isFr ? "Informations & Légal" : "Legal")}</h2>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        {footerPages.length > 0 ? (
                            footerPages.map((page) => {
                                const pageSlug = getLocalizedField(page.slug, lang) || (typeof page.slug === 'string' ? page.slug : page.id);
                                const label = getLocalizedField(page.title, lang) || (isFr ? page.title_fr : page.title_en) || pageSlug;
                                return (
                                    <li key={page.id || pageSlug}>
                                        <Link href={`/${lang}/${pageSlug}`} className="hover:text-primary transition-colors">
                                            {label}
                                        </Link>
                                    </li>
                                );
                            })
                        ) : (
                            (navigation?.footerSections?.legal || []).map((item) => {
                                const label = legalDict[item.key] || item.key;
                                const href = item.href.startsWith('http') ? item.href : `/${lang}${item.href}`;
                                return (
                                    <li key={item.key + item.href}>
                                        <Link href={href} className="hover:text-primary transition-colors">
                                            {label}
                                        </Link>
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            </div>
            
            <div className="w-full max-w-7xl mx-auto mt-12 pt-8 px-6 md:px-16 border-t flex flex-col sm:flex-row items-center justify-between text-sm text-muted-foreground gap-4">
                <div>
                    &copy; {new Date().getFullYear()} {activeBrandName}. All rights reserved.
                </div>
                <div>
                    Powered by{" "}
                    <a 
                        href="https://gokai.org" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:underline hover:text-primary transition-colors font-medium"
                    >
                        Gokai Labs
                    </a>
                </div>
            </div>
        </footer>
    );
}
