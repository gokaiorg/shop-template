import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import { getSupportedLocales, getDefaultLocale, isMultiLocale } from '@/app/i18n-config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;
    const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth');

    // Allow auth API routes to pass through
    if (isApiAuthRoute) return NextResponse.next();

    // Check if trying to access an admin route
    const isAdminRoute = nextUrl.pathname.includes('/admin');

    // If it's an admin route, check role
    if (isAdminRoute) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL('/api/auth/signin', nextUrl));
        }
        
        const role = (req.auth?.user?.role || "").toLowerCase();
        const isAuthorized = role === "admin" || role === "user";

        if (!isAuthorized) {
            return NextResponse.redirect(new URL('/', nextUrl));
        }
    }

    const locales = getSupportedLocales();
    const defaultLocale = getDefaultLocale();
    const isMulti = isMultiLocale();
    const pathname = nextUrl.pathname;

    if (!isMulti || locales.length <= 1) {
        // Single-locale mode: strip locale prefix if present and internally rewrite
        const matchedLocalePrefix = locales.find(
            (loc) => pathname === `/${loc}` || pathname.startsWith(`/${loc}/`)
        );

        if (matchedLocalePrefix) {
            const strippedPathname = pathname.slice(matchedLocalePrefix.length + 1) || '/';
            const cleanUrl = new URL(strippedPathname + nextUrl.search, req.url);
            return NextResponse.redirect(cleanUrl);
        }

        // Internally rewrite clean path to /[defaultLocale]/...
        const rewriteUrl = new URL(`/${defaultLocale}${pathname === '/' ? '' : pathname}${nextUrl.search}`, req.url);
        return NextResponse.rewrite(rewriteUrl);
    } else {
        // Multi-locale mode: ensure valid locale prefix
        const pathnameIsMissingLocale = locales.every(
            (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
        );

        if (pathnameIsMissingLocale) {
            return NextResponse.redirect(
                new URL(`/${defaultLocale}${pathname === '/' ? '' : pathname}${nextUrl.search}`, req.url)
            );
        }
    }

    return NextResponse.next();
});

export const config = {
    // Matcher ignoring `/_next/`, api, and standard public files & metadata routes
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
