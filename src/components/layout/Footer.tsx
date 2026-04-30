import React from 'react';
import Link from 'next/link';

interface FooterProps {
    lang: string;
    dict: any;
}

export function Footer({ lang, dict }: FooterProps) {
    if (!dict) return null;
    
    const legalDict = dict.legal;

    return (
        <footer className="border-t bg-zinc-50 dark:bg-black py-12 mt-auto">
            <div className="w-full max-w-7xl mx-auto px-6 md:px-16 grid grid-cols-1 md:grid-cols-4 gap-12 text-left">
                <div className="col-span-1 md:col-span-2">
                    <h3 className="font-bold text-lg mb-4">Shop Template</h3>
                    <p className="text-muted-foreground text-sm max-w-xs">
                        The ultimate full-stack boilerplate for e-commerce and digital agencies.
                        Built with Next.js, Firebase, and Tailwind CSS.
                    </p>
                </div>
                
                <div>
                    <h4 className="font-bold mb-4">{dict.header.shop}</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li><Link href={`/${lang}/shop`} className="hover:text-foreground transition-colors">{dict.header.shop}</Link></li>
                        <li><Link href={`/${lang}/about`} className="hover:text-foreground transition-colors">{dict.header.about}</Link></li>
                        <li><Link href={`/${lang}/contact`} className="hover:text-foreground transition-colors">{dict.header.contact}</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold mb-4">{legalDict.title}</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                        <li><Link href={`/${lang}/mentions-legales`} className="hover:text-foreground transition-colors">{legalDict.mentions_legales}</Link></li>
                        <li><Link href={`/${lang}/cgv`} className="hover:text-foreground transition-colors">{legalDict.cgv}</Link></li>
                        <li><Link href={`/${lang}/privacy-policy`} className="hover:text-foreground transition-colors">{legalDict.privacy_policy}</Link></li>
                        <li><Link href={`/${lang}/returns`} className="hover:text-foreground transition-colors">{legalDict.returns}</Link></li>
                    </ul>
                </div>
            </div>
            
            <div className="max-w-7xl mx-auto mt-12 pt-8 px-6 md:px-16 border-t text-center text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()}. Made with AI by <a href="https://gokai.org" target="_blank" rel="noopener noreferrer" className="hover:underline hover:text-foreground transition-colors">Gokai Labs</a>
            </div>
        </footer>
    );
}
