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
  website_url: z.string().optional(),
  confirm_email: z.string().optional(),
  honeypot: z.string().optional(),
  timestamp: z.number().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

export async function submitContactForm(data: ContactFormData) {
  try {
    const validatedData = contactSchema.parse(data);

    const isHoneypotTriggered = Boolean(
      (validatedData.honeypot && validatedData.honeypot.trim().length > 0) ||
      (validatedData.website_url && validatedData.website_url.trim().length > 0) ||
      (validatedData.confirm_email && validatedData.confirm_email.trim().length > 0)
    );

    if (isHoneypotTriggered) {
      return { success: true };
    }

    if (
      typeof validatedData.timestamp === "number" &&
      (Date.now() - validatedData.timestamp < 2500 || validatedData.timestamp > Date.now() + 60000)
    ) {
      return { success: true };
    }

    const brandKey = getActiveBrandKey();
    const brand = getActiveBrand();

    await adminDb.collection("contact_messages").add({
      name: validatedData.name,
      email: validatedData.email,
      message: validatedData.message,
      brandKey,
      brandName: brand.identity?.name || brandKey,
      source: "Contact",
      status: "unread",
      userUnread: false,
      replies: [],
      createdAt: new Date().toISOString(),
    });

    return { success: true };
  } catch (error: unknown) {
    console.error("Error submitting contact form:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed", details: error.issues };
    }
    const message = error instanceof Error ? error.message : "Failed to send message. Please try again later.";
    return { success: false, error: message };
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

    try {
      const userDoc = await adminDb.collection("users").doc(session.user.id).get();
      if (userDoc.exists) {
        const uData = userDoc.data();
        if (uData?.name && typeof uData.name === "string" && uData.name.trim()) {
          userName = uData.name.trim();
        }
      }
    } catch (e: unknown) {
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
      status: "unread",
      userUnread: false,
      replies: [],
      brandKey,
      brandName: brand.identity?.name || brandKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    revalidatePath("/[lang]/account/messages", "page");
    revalidatePath("/[lang]/admin/messages", "page");
    return { success: true, id: docRef.id };
  } catch (error: unknown) {
    console.error("Error sending user message:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed", details: error.issues };
    }
    const message = error instanceof Error ? error.message : "Failed to send message.";
    return { success: false, error: message };
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

    const updatePayload: Record<string, unknown> = {
      replies: FieldValue.arrayUnion(newReply),
      updatedAt: new Date().toISOString(),
    };

    if (isAdmin) {
      updatePayload.status = "read";
      updatePayload.userUnread = true;
    } else {
      updatePayload.status = "unread";
      updatePayload.userUnread = false;
    }

    await docRef.update(updatePayload);

    revalidatePath("/[lang]/admin/messages", "page");
    revalidatePath("/[lang]/account/messages", "page");

    return { success: true, reply: newReply };
  } catch (error: unknown) {
    console.error("Error replying to message:", error);
    const message = error instanceof Error ? error.message : "Failed to send reply.";
    return { success: false, error: message };
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
    }
    return { success: true };
  } catch (error: unknown) {
    console.error("Error marking messages as read for user:", error);
    const message = error instanceof Error ? error.message : "Failed to mark messages as read.";
    return { success: false, error: message };
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
  } catch (error: unknown) {
    console.error("Error updating message status:", error);
    const message = error instanceof Error ? error.message : "Failed to update status.";
    return { success: false, error: message };
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
  } catch (error: unknown) {
    console.error("Error deleting message:", error);
    const message = error instanceof Error ? error.message : "Failed to delete message.";
    return { success: false, error: message };
  }
}

export async function batchDeleteContactMessages(ids: string[]) {
  const session = await auth();
  const userRole = (session?.user?.role || "").toLowerCase();
  if (userRole !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return { success: true, count: 0 };
  }

  try {
    const batch = adminDb.batch();
    for (const id of ids) {
      const docRef = adminDb.collection("contact_messages").doc(id);
      batch.delete(docRef);
    }
    await batch.commit();

    revalidatePath("/[lang]/admin/messages", "page");
    return { success: true, count: ids.length };
  } catch (error: unknown) {
    console.error("Error batch deleting contact messages:", error);
    const message = error instanceof Error ? error.message : "Failed to delete messages.";
    return { success: false, error: message };
  }
}

export async function batchArchiveContactMessages(ids: string[]) {
  const session = await auth();
  const userRole = (session?.user?.role || "").toLowerCase();
  if (userRole !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return { success: true, count: 0 };
  }

  try {
    const batch = adminDb.batch();
    const now = new Date().toISOString();
    for (const id of ids) {
      const docRef = adminDb.collection("contact_messages").doc(id);
      batch.update(docRef, {
        status: "archived",
        updatedAt: now,
      });
    }
    await batch.commit();

    revalidatePath("/[lang]/admin/messages", "page");
    return { success: true, count: ids.length };
  } catch (error: unknown) {
    console.error("Error batch archiving contact messages:", error);
    const message = error instanceof Error ? error.message : "Failed to archive messages.";
    return { success: false, error: message };
  }
}

export async function cleanupSpamMessages(options?: {
  ids?: string[];
  action?: "delete" | "archive";
}) {
  const session = await auth();
  const userRole = (session?.user?.role || "").toLowerCase();
  if (userRole !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  const action = options?.action || "delete";
  const providedIds = options?.ids;

  if (providedIds && Array.isArray(providedIds) && providedIds.length > 0) {
    if (action === "archive") {
      return batchArchiveContactMessages(providedIds);
    }
    return batchDeleteContactMessages(providedIds);
  }

  try {
    const snapshot = await adminDb.collection("contact_messages").get();
    const spamKeywords = [
      "viagra",
      "cialis",
      "casino",
      "crypto",
      "bitcoin",
      "forex",
      "seo ranking",
      "guest post",
      "backlink",
    ];

    const spamIds: string[] = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const text = `${data.name || ""} ${data.email || ""} ${data.subject || ""} ${data.message || ""}`.toLowerCase();
      if (spamKeywords.some((keyword) => text.includes(keyword))) {
        spamIds.push(doc.id);
      }
    }

    if (spamIds.length === 0) {
      return { success: true, count: 0 };
    }

    if (action === "archive") {
      return batchArchiveContactMessages(spamIds);
    }
    return batchDeleteContactMessages(spamIds);
  } catch (error: unknown) {
    console.error("Error cleaning up spam messages:", error);
    const message = error instanceof Error ? error.message : "Failed to cleanup spam messages.";
    return { success: false, error: message };
  }
}

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
    } catch (error: unknown) {
      console.error("Error getting admin unread messages count:", error);
      return 0;
    }
  }

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
  } catch (error: unknown) {
    console.error("Error getting user unread messages count:", error);
    return 0;
  }
}
