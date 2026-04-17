import NextAuth from "next-auth";
import { FirestoreAdapter } from "@auth/firebase-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
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

                    // Compare provided password against stored hashed password securely
                    if (user && user.password) {
                        let isValidPassword = false;

                        // Try bcrypt compare first
                        isValidPassword = await bcrypt.compare(
                            credentials.password as string,
                            user.password
                        );

                        // Fallback for existing plaintext passwords (migration path)
                        // Make sure the stored password is not already a hash to prevent Pass-the-Hash
                        if (
                            !isValidPassword &&
                            typeof user.password === 'string' &&
                            !/^\$2[aby]\$/.test(user.password) &&
                            user.password === credentials.password
                        ) {
                            isValidPassword = true;
                            // Hash the password for future logins
                            const hashedPassword = await bcrypt.hash(credentials.password as string, 10);
                            await usersRef.doc(userDoc.id).update({
                                password: hashedPassword
                            });
                        }

                        if (isValidPassword) {
                            return {
                                id: userDoc.id,
                                email: user.email,
                                role: user.role || "CUSTOMER",
                            };
                        }
                    }
                } catch (error) {
                    console.error("Error authorizing via Firebase:", error);
                }

                return null;
            },
        }),
    ],
});
