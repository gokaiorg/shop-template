import React from 'react';
import Link from 'next/link';
import { brandConfig } from '@/config/brand.config';
import { Page, Category, SocialLink } from '@/types/database';
import { getLocalizedField } from '@/lib/i18n';
import { adminDb } from '@/lib/firebase-admin';
import { getStoreSettings } from '@/lib/services/settings';

interface FooterProps {
    lang: string;
    dict: any;
    pages?: Page[];
    catalogTitle?: Record<string, string>;
    catalogSlug?: string;
    brandName?: string;
    footerDescription?: Record<string, string>;
    socialLinks?: SocialLink[];
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
}: FooterProps) {
    if (!dict) return null;
    
    // Fetch settings if not fully passed as props
    const settings = (!brandName || !footerDescription || !socialLinks)
        ? await getStoreSettings()
        : null;

    const activeBrandName = brandName || settings?.brandName || brandConfig.identity.name;
    const activeCatalogTitle = catalogTitle || settings?.catalogTitle;
    const activeCatalogSlug = catalogSlug || settings?.catalogSlug || 'shop';
    const activeFooterDesc = footerDescription || settings?.footerDescription;
    const activeSocialLinks = socialLinks || settings?.socialLinks || brandConfig.navigation?.socials || [];

    const isFr = lang === 'fr';
    const legalDict = dict.legal || {};
    const headerDict = dict.header || {};
    const { navigation } = brandConfig;
    const description = getLocalizedField(activeFooterDesc, lang)
        || (isFr ? brandConfig.identity.description?.fr : brandConfig.identity.description?.en)
        || '';

    const footerPages = pages.filter((p) => p.showInFooter);
    const displayCatalogTitle = getLocalizedField(activeCatalogTitle, lang) || headerDict.shop || (isFr ? "Boutique" : "Shop");

    let categories: Category[] = [];
    try {
        const catSnap = await adminDb.collection('categories').get();
        categories = catSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Category));
    } catch (e) {
        console.error("Error fetching categories for footer:", e);
    }

    const allCatalogLabel = isFr
        ? `Tous les ${displayCatalogTitle}`
        : `All ${displayCatalogTitle}`;

    return (
        <footer className="border-t bg-zinc-50 dark:bg-black py-12 mt-auto">
            <div className="w-full max-w-7xl mx-auto px-6 md:px-16 grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
                <div className="col-span-1 md:col-span-2">
                    <h2 className="font-bold text-lg mb-4">{activeBrandName}</h2>
                    {description && (
                        <p className="text-muted-foreground text-sm max-w-sm leading-relaxed whitespace-pre-line">
                            {description}
                        </p>
                    )}
                    {activeSocialLinks && activeSocialLinks.length > 0 && (
                        <div className="flex items-center gap-4 mt-4">
                            {activeSocialLinks.map((social, idx) => (
                                <a
                                    key={`${social.platform}-${idx}`}
                                    href={social.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {social.platform}
                                </a>
                            ))}
                        </div>
                    )}
                </div>
                
                <div>
                    <h2 className="font-bold mb-4">{displayCatalogTitle}</h2>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>
                            <Link href={`/${lang}/${activeCatalogSlug}`} className="hover:text-foreground transition-colors">
                                {allCatalogLabel}
                            </Link>
                        </li>
                        {categories.map((category) => {
                            const catSlug = getLocalizedField(category.slug, lang) || (isFr ? category.slugFr : category.slugEn) || category.id;
                            const catName = getLocalizedField(category.name, lang) || (isFr ? category.nameFr : category.nameEn);
                            if (!catName) return null;

                            return (
                                <li key={category.id}>
                                    <Link
                                        href={`/${lang}/${activeCatalogSlug}?category=${catSlug}`}
                                        className="hover:text-foreground transition-colors"
                                    >
                                        {catName}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </div>

                <div>
                    <h2 className="font-bold mb-4">{legalDict.title || (isFr ? "Informations & Légal" : "Information & Legal")}</h2>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        {footerPages.length > 0 ? (
                            footerPages.map((page) => {
                                const label = getLocalizedField(page.title, lang) || (isFr ? page.title_fr : page.title_en) || page.slug;
                                return (
                                    <li key={page.id || page.slug}>
                                        <Link href={`/${lang}/pages/${page.slug}`} className="hover:text-foreground transition-colors">
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
                                        <Link href={href} className="hover:text-foreground transition-colors">
                                            {label}
                                        </Link>
                                    </li>
                                );
                            })
                        )}
                    </ul>
                </div>
            </div>
            
            <div className="max-w-7xl mx-auto mt-12 pt-8 px-6 md:px-16 border-t flex flex-col sm:flex-row items-center justify-between text-sm text-muted-foreground gap-4">
                <div>
                    &copy; {new Date().getFullYear()} {activeBrandName}. All rights reserved.
                </div>
                <div>
                    Powered by{" "}
                    <a 
                        href="https://gokai.org" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="hover:underline hover:text-foreground transition-colors font-medium"
                    >
                        Gokai Labs
                    </a>
                </div>
            </div>
        </footer>
    );
}
