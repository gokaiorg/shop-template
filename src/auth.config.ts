import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: "/api/auth/signin",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;

                // RBAC Logic: Check if user email is in ADMIN_EMAILS
                const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim()) || [];
                if (user.email && adminEmails.includes(user.email)) {
                    token.role = "ADMIN";
                } else {
                    token.role = user.role || "CUSTOMER";
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.id = token.id as string;
                session.user.role = token.role as string;
            }
            return session;
        },
    },
    providers: [], // Add providers with Edge incompatibilities in auth.ts
} satisfies NextAuthConfig;
