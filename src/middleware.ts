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
        // Single-locale mode:
        // If the path already has the default locale prefix (e.g. /en or /en/shop),
        // let it pass through directly without redirecting to prevent circular redirect loops.
        if (pathname === `/${defaultLocale}` || pathname.startsWith(`/${defaultLocale}/`)) {
            return NextResponse.next();
        }

        // Check if path starts with a non-default locale prefix
        const otherLocale = locales.find(
            (loc) => loc !== defaultLocale && (pathname === `/${loc}` || pathname.startsWith(`/${loc}/`))
        );
        const targetPath = otherLocale
            ? pathname.slice(otherLocale.length + 1) || '/'
            : pathname;

        // Internally rewrite clean path to /[defaultLocale]/... without redirecting the browser
        const rewriteUrl = new URL(
            `/${defaultLocale}${targetPath === '/' ? '' : targetPath}${nextUrl.search}`,
            req.url
        );
        return NextResponse.rewrite(rewriteUrl);
    } else {
        // Multi-locale mode: ensure a valid locale prefix is present in the URL
        const pathnameIsMissingLocale = locales.every(
            (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
        );

        if (pathnameIsMissingLocale) {
            return NextResponse.redirect(
                new URL(
                    `/${defaultLocale}${pathname === '/' ? '' : pathname}${nextUrl.search}`,
                    req.url
                )
            );
        }
    }

    return NextResponse.next();
});

export const config = {
    // Matcher ignoring `/_next/`, api, and standard public files & metadata routes
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|robots\\.txt|sitemap\\.xml|manifest\\.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)'],
};
