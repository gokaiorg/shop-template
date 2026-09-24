import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { ContactMessage } from "@/types/database";
import { AccountMessagesView } from "@/components/account/AccountMessagesView";
import { markUserMessagesAsRead } from "@/actions/contact";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Messages | Mon Compte",
  robots: {
    index: false,
    follow: false,
  },
};

interface MessagesPageProps {
  params: Promise<{ lang: string }>;
}

export default async function CustomerMessagesPage({ params }: MessagesPageProps) {
  const { lang } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/${lang}/login`);
  }

  const userId = session.user.id;
  const userEmail = session.user.email;

  const dict = await getDictionary(lang as Locale);

  // Fetch messages belonging to this user
  const messagesMap = new Map<string, ContactMessage>();
  const unreadDocIds: string[] = [];

  try {
    const userSnapshot = await adminDb
      .collection("contact_messages")
      .where("userId", "==", userId)
      .get();

    userSnapshot.forEach((doc) => {
      const data = doc.data();
      let createdAtStr = new Date().toISOString();
      if (data.createdAt) {
        if (typeof data.createdAt.toDate === "function") {
          createdAtStr = data.createdAt.toDate().toISOString();
        } else if (typeof data.createdAt === "string") {
          createdAtStr = data.createdAt;
        } else if (data.createdAt instanceof Date) {
          createdAtStr = data.createdAt.toISOString();
        }
      }

      if (data.userUnread === true) {
        unreadDocIds.push(doc.id);
      }

      messagesMap.set(doc.id, {
        id: doc.id,
        name: data.name || "",
        email: data.email || "",
        subject: data.subject || "",
        message: data.message || "",
        status: data.status || "unread",
        source: data.source || "User",
        userId: data.userId,
        userUnread: false, // will be marked as read
        replies: Array.isArray(data.replies) ? data.replies : [],
        createdAt: createdAtStr,
        updatedAt: data.updatedAt,
        brandKey: data.brandKey || "",
        brandName: data.brandName,
      });
    });

    // Also include if any by email with source User (e.g. if created across session updates)
    if (userEmail) {
      const emailSnapshot = await adminDb
        .collection("contact_messages")
        .where("email", "==", userEmail)
        .where("source", "==", "User")
        .get();

      emailSnapshot.forEach((doc) => {
        if (!messagesMap.has(doc.id)) {
          const data = doc.data();
          let createdAtStr = new Date().toISOString();
          if (data.createdAt) {
            if (typeof data.createdAt.toDate === "function") {
              createdAtStr = data.createdAt.toDate().toISOString();
            } else if (typeof data.createdAt === "string") {
              createdAtStr = data.createdAt;
            } else if (data.createdAt instanceof Date) {
              createdAtStr = data.createdAt.toISOString();
            }
          }

          if (data.userUnread === true) {
            unreadDocIds.push(doc.id);
          }

          messagesMap.set(doc.id, {
            id: doc.id,
            name: data.name || "",
            email: data.email || "",
            subject: data.subject || "",
            message: data.message || "",
            status: data.status || "unread",
            source: data.source || "User",
            userId: data.userId || userId,
            userUnread: false,
            replies: Array.isArray(data.replies) ? data.replies : [],
            createdAt: createdAtStr,
            updatedAt: data.updatedAt,
            brandKey: data.brandKey || "",
            brandName: data.brandName,
          });
        }
      });
    }

    // Mark any unread messages as read so the notification badge clears
    if (unreadDocIds.length > 0) {
      await markUserMessagesAsRead(unreadDocIds);
    }
  } catch (error) {
    console.error("Error fetching user messages:", error);
  }

  const messages: ContactMessage[] = Array.from(messagesMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <AccountMessagesView
      initialMessages={messages}
      lang={lang}
      dict={dict}
    />
  );
}
