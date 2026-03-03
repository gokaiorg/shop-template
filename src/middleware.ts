import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';
import { i18n } from '@/app/i18n-config';

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
        // Check if the user is an admin from the token
        if (req.auth?.user?.role !== 'ADMIN') {
            return NextResponse.redirect(new URL('/', nextUrl));
        }
    }

    // Handle i18n Routing
    const pathnameIsMissingLocale = i18n.locales.every(
        (locale) => !nextUrl.pathname.startsWith(`/${locale}/`) && nextUrl.pathname !== `/${locale}`
    );

    if (pathnameIsMissingLocale) {
        const locale = i18n.defaultLocale;
        return NextResponse.redirect(
            new URL(`/${locale}${nextUrl.pathname === '/' ? '' : nextUrl.pathname}`, req.url)
        );
    }

    return NextResponse.next();
});

export const config = {
    // Matcher ignoring `/_next/`, api, and standard public files
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
