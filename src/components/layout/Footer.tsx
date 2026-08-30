import React from 'react';
import Link from 'next/link';
import { brandConfig } from '@/config/brand.config';
import { Page } from '@/types/database';
import { getLocalizedField } from '@/lib/i18n';

interface FooterProps {
    lang: string;
    dict: any;
    pages?: Page[];
}

export function Footer({ lang, dict, pages = [] }: FooterProps) {
    if (!dict) return null;
    
    const isFr = lang === 'fr';
    const legalDict = dict.legal || {};
    const headerDict = dict.header || {};
    const { identity, navigation } = brandConfig;
    const description = isFr ? identity.description.fr : identity.description.en;

    const footerPages = pages.filter((p) => p.showInFooter);

    return (
        <footer className="border-t bg-zinc-50 dark:bg-black py-12 mt-auto">
            <div className="w-full max-w-7xl mx-auto px-6 md:px-16 grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
                <div className="col-span-1 md:col-span-2">
                    <h3 className="font-bold text-lg mb-4">{identity.name}</h3>
                    <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
                        {description}
                    </p>
                    {navigation.socials && navigation.socials.length > 0 && (
                        <div className="flex items-center gap-4 mt-4">
                            {navigation.socials.map((social) => (
                                <a
                                    key={social.platform}
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
                    <h4 className="font-bold mb-4">{headerDict.shop || (isFr ? "Boutique" : "Shop")}</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>
                            <Link href={`/${lang}/shop`} className="hover:text-foreground transition-colors">
                                {isFr ? "Tous les produits" : "All Products"}
                            </Link>
                        </li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold mb-4">{legalDict.title || (isFr ? "Informations & Légal" : "Information & Legal")}</h4>
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
                    &copy; {identity.copyrightYear || new Date().getFullYear()} {identity.companyName || identity.name}. All rights reserved.
                </div>
                {identity.creator && (
                    <div>
                        Powered by{" "}
                        <a 
                            href={identity.creator.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="hover:underline hover:text-foreground transition-colors font-medium"
                        >
                            {identity.creator.name}
                        </a>
                    </div>
                )}
            </div>
        </footer>
    );
}
