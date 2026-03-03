"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSession, signOut } from "next-auth/react";
import { SessionProvider } from "next-auth/react";

function HeaderContent({ lang, dict }: { lang: string, dict: Record<string, string> }) {
    const pathname = usePathname();
    const router = useRouter();
    const { data: session, status } = useSession();

    // Toggle between en and fr
    const handleLanguageToggle = () => {
        const nextLang = lang === "en" ? "fr" : "en";
        // pathname always starts with /lang, e.g., /en/about
        const newPathname = pathname.replace(`/${lang}`, `/${nextLang}`);
        router.push(newPathname || `/${nextLang}`);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
                {/* Brand Logo */}
                <div className="flex items-center gap-6 md:gap-10">
                    <Link href={`/${lang}`} className="flex items-center space-x-2">
                        <span className="inline-block font-bold sm:text-lg">ShopTemplate</span>
                    </Link>

                    {/* Primary Navigation */}
                    <nav className="hidden md:flex gap-6">
                        <Link
                            href={`/${lang}/categories`}
                            className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {dict.shop}
                        </Link>
                        <Link
                            href={`/${lang}/about`}
                            className="flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            {dict.about}
                        </Link>
                    </nav>
                </div>

                {/* Right Actions */}
                <div className="flex flex-1 items-center justify-end space-x-4">
                    <Button variant="ghost" size="sm" onClick={handleLanguageToggle} title={dict.toggle_language}>
                        {lang === "en" ? "FR" : "EN"}
                    </Button>

                    {status === "loading" ? (
                        <div className="h-8 w-16 animate-pulse rounded-md bg-muted"></div>
                    ) : session ? (
                        <>
                            <Link href={`/${lang}/admin/dashboard`}>
                                <Button variant="default" size="sm">
                                    {dict.dashboard}
                                </Button>
                            </Link>
                        </>
                    ) : (
                        <Link href={`/${lang}/login`}>
                            <Button variant="outline" size="sm">
                                {dict.login}
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}

export function Header({ lang, dict }: { lang: string, dict: Record<string, string> }) {
    return (
        <SessionProvider>
            <HeaderContent lang={lang} dict={dict} />
        </SessionProvider>
    );
}
