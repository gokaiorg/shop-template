"use server";

import { auth } from "@/auth";
import { adminDb } from "@/lib/firebase-admin";
import { Role } from "@/types/database";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function registerUser(formData: FormData) {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const validatedFields = registerSchema.safeParse({
        name,
        email,
        password,
    });

    if (!validatedFields.success) {
        return { error: validatedFields.error.flatten().fieldErrors };
    }

    try {
        const usersRef = adminDb.collection("users");
        
        // Check if user already exists
        const existingUser = await usersRef.where("email", "==", email).get();
        if (!existingUser.empty) {
            return { error: "User already exists with this email." };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            name,
            email,
            password: hashedPassword,
            role: Role.USER,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await usersRef.add(newUser);

        return { success: true };
    } catch (error) {
        console.error("Registration error:", error);
        return { error: "Failed to create account. Please try again." };
    }
}

export async function updateProfile(uid: string, data: { name?: string, email?: string, password?: string }) {
    const { adminAuth, adminDb } = await import("@/lib/firebase-admin");

    const session = await auth();
    const userRole = (session?.user?.role || "").toLowerCase();

    // Authorization check: user must be admin or updating their own profile
    if (!session || (userRole !== "admin" && session.user?.id !== uid)) {
        return { error: "Unauthorized" };
    }

    try {
        const updateData: any = {};
        if (data.name) updateData.displayName = data.name;
        if (data.email) updateData.email = data.email;
        if (data.password) updateData.password = data.password;

        if (Object.keys(updateData).length > 0) {
            try {
                await adminAuth.updateUser(uid, updateData);
            } catch (authError) {
                // If user doesn't exist in Firebase Auth (e.g. Credentials user only in Firestore), 
                // we ignore this error and proceed with Firestore update.
                console.warn("Firebase Auth update skipped or failed:", authError);
            }
        }

        // Also update Firestore document
        const firestoreUpdate: any = {};
        if (data.name) firestoreUpdate.name = data.name;
        if (data.email) firestoreUpdate.email = data.email;
        if (data.password) {
            firestoreUpdate.password = await bcrypt.hash(data.password, 10);
        }
        firestoreUpdate.updatedAt = new Date().toISOString();

        await adminDb.collection("users").doc(uid).update(firestoreUpdate);

        return { success: true };
    } catch (error: any) {
        console.error("Profile update error:", error);
        return { error: error.message || "Failed to update profile." };
    }
}
