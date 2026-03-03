import type { NextAuthConfig } from "next-auth";

export const authConfig = {
    pages: {
        signIn: "/api/auth/signin",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
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
