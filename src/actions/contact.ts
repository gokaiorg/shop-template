"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getActiveBrand, getActiveBrandKey } from "@/config/brand.config";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(5, "Subject must be at least 5 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export async function submitContactForm(data: ContactFormData) {
  try {
    // Validate the data
    const validatedData = contactSchema.parse(data);
    const brandKey = getActiveBrandKey();
    const brand = getActiveBrand();

    // Insert into Firestore with multi-tenant traceability metadata
    await adminDb.collection("contact_messages").add({
      ...validatedData,
      brandKey,
      brandName: brand.identity?.name || brandKey,
      status: "unread",
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error) {
    console.error("Error submitting contact form:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed", details: error.issues };
    }
    return { success: false, error: "Failed to send message. Please try again later." };
  }
}

export async function updateMessageStatus(id: string, status: "unread" | "read" | "archived") {
  const session = await auth();
  const userRole = (session?.user?.role || "").toLowerCase();
  if (userRole !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const docRef = adminDb.collection("contact_messages").doc(id);
    await docRef.update({
      status,
      updatedAt: new Date().toISOString(),
    });

    revalidatePath("/[lang]/admin/messages", "page");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating message status:", error);
    return { success: false, error: error?.message || "Failed to update status." };
  }
}

export async function deleteContactMessage(id: string) {
  const session = await auth();
  const userRole = (session?.user?.role || "").toLowerCase();
  if (userRole !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    await adminDb.collection("contact_messages").doc(id).delete();
    revalidatePath("/[lang]/admin/messages", "page");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting message:", error);
    return { success: false, error: error?.message || "Failed to delete message." };
  }
}
