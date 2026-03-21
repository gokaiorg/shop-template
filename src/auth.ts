import NextAuth from "next-auth";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { adminDb } from "@/lib/firebase-admin";
import { authConfig } from "./auth.config";

export const { handlers, signIn, signOut, auth } = NextAuth({
    ...authConfig,
    adapter: FirestoreAdapter(adminDb),
    session: { strategy: "jwt" },
    pages: {
        signIn: '/login',
    },
    providers: [
        Google({}),
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

                try {
                    const usersRef = adminDb.collection('users');
                    const snapshot = await usersRef.where('email', '==', credentials.email).limit(1).get();

                    if (snapshot.empty) {
                        return null;
                    }

                    const userDoc = snapshot.docs[0];
                    const user = userDoc.data();

                    // Basic lookup for now (will implement proper password hashing comparison later)
                    if (user && user.password === credentials.password) {
                        return {
                            id: userDoc.id,
                            email: user.email,
                            role: user.role || "CUSTOMER",
                        };
                    }
                } catch (error) {
                    console.error("Error authorizing via Firebase:", error);
                }

                return null;
            },
        }),
    ],
});
