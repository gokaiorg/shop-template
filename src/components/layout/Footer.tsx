import React from 'react';
import Link from 'next/link';
import parse from 'html-react-parser';
import DOMPurify from 'isomorphic-dompurify';
import { brandConfig } from '@/config/brand.config';
import { Page, Category, SocialLink } from '@/types/database';
import { getLocalizedField } from '@/lib/i18n';
import { adminDb } from '@/lib/firebase-admin';
import { getStoreSettings } from '@/lib/services/settings';
import { AdminEditBadge } from '@/components/admin/AdminEditBadge';

interface FooterProps {
    lang: string;
    dict: any;
    pages?: Page[];
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
    catalogTitle,
    catalogSlug = 'shop',
    brandName,
    footerDescription,
    socialLinks,
    footerRightMenuTitle,
}: FooterProps) {
    if (!dict) return null;
    
    // Fetch settings if not fully passed as props
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

    const legalDict = dict.legal || {};
    const headerDict = dict.header || {};
    const { navigation } = brandConfig;
    const description = getLocalizedField(activeFooterDesc, lang)
        || (isFr ? brandConfig.identity.description?.fr : brandConfig.identity.description?.en)
        || '';

    const footerPages = pages
        .filter((p) => p.showInFooter)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const displayCatalogTitle = getLocalizedField(activeCatalogTitle, lang) || headerDict.shop || (isFr ? "Boutique" : "Shop");

    let categories: Category[] = [];
    try {
        const catSnap = await adminDb.collection('categories').orderBy('order', 'asc').get();
        categories = catSnap.docs
            .map((doc) => ({ id: doc.id, ...doc.data() } as Category))
            .filter((c) => (c.status ?? 'published') === 'published');
        categories.sort((a, b) => {
            const orderDiff = (a.order ?? 0) - (b.order ?? 0);
            if (orderDiff !== 0) return orderDiff;
            const nameA = getLocalizedField(a.name, lang) || (isFr ? a.nameFr : a.nameEn) || '';
            const nameB = getLocalizedField(b.name, lang) || (isFr ? b.nameFr : b.nameEn) || '';
            return nameA.localeCompare(nameB, lang);
        });
    } catch (e) {
        console.error("Error fetching categories for footer:", e);
    }

    return (
        <footer className="border-t bg-zinc-50 dark:bg-black py-12 mt-auto relative">
            {/* Quick Edit shortcut for Footer & Social Links */}
            <AdminEditBadge
                href="/admin/settings#footer-social-links"
                locale={lang}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20"
            />
            <div className="w-full max-w-7xl mx-auto px-6 md:px-16 grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
                <div className="col-span-1 md:col-span-2">
                    <h3 className="font-bold text-lg mb-4">{activeBrandName}</h3>
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
                    <h3 className="font-bold mb-4">
                        <Link href={`/${lang}/${activeCatalogSlug}`} className="hover:text-primary transition-colors">
                            {displayCatalogTitle}
                        </Link>
                    </h3>
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
                    <h3 className="font-bold mb-4">{activeFooterRightTitle || legalDict.title || (isFr ? "Informations & Légal" : "Legal")}</h3>
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
                            navigation.footerSections.legal.map((item) => {
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
