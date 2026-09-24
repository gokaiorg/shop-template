"use server";

import { adminDb } from "@/lib/firebase-admin";
import { getActiveBrand, getActiveBrandKey } from "@/config/brand.config";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { z } from "zod";
import { FieldValue } from "firebase-admin/firestore";
import { MessageReply } from "@/types/database";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
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
      source: "Contact",
      status: "unread",
      userUnread: false,
      replies: [],
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

const userMessageSchema = z.object({
  subject: z.string().optional(),
  message: z.string().min(5, "Message must be at least 5 characters"),
});

export async function sendUserAccountMessage(data: { subject?: string; message: string }) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized: Please log in to send a message." };
  }

  try {
    const validated = userMessageSchema.parse(data);
    const brandKey = getActiveBrandKey();
    const brand = getActiveBrand();

    let userName = session.user.name || "";
    const userEmail = session.user.email || "";

    // Always fetch freshest user profile from Firestore to ensure the real name
    try {
      const userDoc = await adminDb.collection("users").doc(session.user.id).get();
      if (userDoc.exists) {
        const uData = userDoc.data();
        if (uData?.name && typeof uData.name === "string" && uData.name.trim()) {
          userName = uData.name.trim();
        }
      }
    } catch (e) {
      console.error("Error fetching user profile name:", e);
    }

    if (!userName || userName.trim() === "") {
      userName = userEmail.split("@")[0] || "User";
    }

    const docRef = await adminDb.collection("contact_messages").add({
      name: userName,
      email: userEmail,
      userId: session.user.id,
      source: "User",
      subject: validated.subject?.trim() || "Message client",
      message: validated.message.trim(),
      status: "unread", // unread for admin
      userUnread: false, // sender already read their own message
      replies: [],
      brandKey,
      brandName: brand.identity?.name || brandKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    revalidatePath("/[lang]/account/messages", "page");
    revalidatePath("/[lang]/admin/messages", "page");
    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error sending user message:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed", details: error.issues };
    }
    return { success: false, error: error?.message || "Failed to send message." };
  }
}

export async function replyToMessage(messageId: string, replyMessage: string) {
  const session = await auth();
  if (!session?.user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!replyMessage || replyMessage.trim().length === 0) {
    return { success: false, error: "Reply cannot be empty" };
  }

  const isAdmin = (session.user.role || "").toLowerCase() === "admin";
  const userId = session.user.id;

  try {
    const docRef = adminDb.collection("contact_messages").doc(messageId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) {
      return { success: false, error: "Message not found" };
    }

    const docData = docSnap.data();

    // If user is not admin, verify ownership
    if (!isAdmin && docData?.userId !== userId && docData?.email !== session.user.email) {
      return { success: false, error: "Unauthorized" };
    }

    const replyId = crypto.randomUUID();
    const newReply: MessageReply = {
      id: replyId,
      senderRole: isAdmin ? "admin" : "user",
      senderName: session.user.name || (isAdmin ? "Support Team" : "User"),
      senderEmail: session.user.email || undefined,
      message: replyMessage.trim(),
      createdAt: new Date().toISOString(),
    };

    const updatePayload: Record<string, any> = {
      replies: FieldValue.arrayUnion(newReply),
      updatedAt: new Date().toISOString(),
    };

    if (isAdmin) {
      // Admin replied: mark status as read for admin, and userUnread = true for user
      updatePayload.status = "read";
      updatePayload.userUnread = true;
    } else {
      // User replied: mark status as unread for admin, and userUnread = false
      updatePayload.status = "unread";
      updatePayload.userUnread = false;
    }

    await docRef.update(updatePayload);

    revalidatePath("/[lang]/admin/messages", "page");
    revalidatePath("/[lang]/account/messages", "page");

    return { success: true, reply: newReply };
  } catch (error: any) {
    console.error("Error replying to message:", error);
    return { success: false, error: error?.message || "Failed to send reply." };
  }
}

export async function markUserMessagesAsRead(messageIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const batch = adminDb.batch();
    for (const id of messageIds) {
      const docRef = adminDb.collection("contact_messages").doc(id);
      batch.update(docRef, { userUnread: false });
    }
    try {
      revalidatePath("/[lang]/account/messages", "page");
    } catch {
      // Ignore if called during server component render
    }
    return { success: true };
  } catch (error: any) {
    console.error("Error marking messages as read for user:", error);
    return { success: false, error: error?.message };
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

/**
 * Returns the count of unread messages.
 * If user is admin: returns count of all unread contact_messages + messages.
 * If user is regular logged-in user: returns count of contact_messages where userId == session.user.id and userUnread == true.
 */
export async function getUnreadMessagesCount(targetUserId?: string): Promise<number> {
  const session = await auth();
  if (!session?.user) {
    return 0;
  }

  const userRole = (session.user.role || "").toLowerCase();
  const isAdmin = userRole === "admin";

  if (isAdmin) {
    try {
      const [cmSnap, mSnap] = await Promise.all([
        adminDb.collection("contact_messages").where("status", "==", "unread").count().get(),
        adminDb.collection("messages").where("status", "==", "unread").count().get(),
      ]);
      return (cmSnap.data().count || 0) + (mSnap.data().count || 0);
    } catch (error) {
      console.error("Error getting admin unread messages count:", error);
      return 0;
    }
  }

  // Regular authenticated user
  const effectiveUserId = targetUserId || session.user.id;
  if (!effectiveUserId) {
    return 0;
  }

  try {
    const snap = await adminDb
      .collection("contact_messages")
      .where("userId", "==", effectiveUserId)
      .where("userUnread", "==", true)
      .count()
      .get();
    return snap.data().count || 0;
  } catch (error) {
    console.error("Error getting user unread messages count:", error);
    return 0;
  }
}

