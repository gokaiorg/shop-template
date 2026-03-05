import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import prisma from "@/lib/prisma";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    adapter: PrismaAdapter(prisma),
    session: { strategy: "jwt" },
    pages: {
        signIn: '/login',
    },
    providers: [
        Google(),
        Credentials({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string },
                });

                // Basic lookup for now (will implement proper password hashing comparison later)
                // If user exists and password matches (assuming plaintext for this initial setup step until bcrypt is wired up)
                if (user && user.password === credentials.password) {
                    return {
                        id: user.id,
                        email: user.email,
                        role: user.role,
                    };
                }

                return null;
            },
        }),
    ],
});
