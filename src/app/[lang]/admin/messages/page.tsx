import { adminDb } from "@/lib/firebase-admin";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { protectAdminRoute } from "@/lib/auth-utils";
import { ContactMessage } from "@/types/database";
import { MessagesTable } from "@/components/admin/MessagesTable";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { Mail } from "lucide-react";

export default async function AdminMessagesPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  await protectAdminRoute(lang);

  const [dict, messagesSnapshot] = await Promise.all([
    getDictionary(lang as Locale),
    adminDb.collection("contact_messages").get(),
  ]);

  // Dynamically resolve real names from users collection if userId exists
  const userIds = Array.from(
    new Set(
      messagesSnapshot.docs
        .map((d) => d.data().userId)
        .filter((id): id is string => typeof id === "string" && id.length > 0)
    )
  );

  const userNamesMap = new Map<string, string>();
  if (userIds.length > 0) {
    await Promise.all(
      userIds.map(async (uid) => {
        try {
          const uDoc = await adminDb.collection("users").doc(uid).get();
          if (uDoc.exists) {
            const uData = uDoc.data();
            if (uData?.name && typeof uData.name === "string" && uData.name.trim()) {
              userNamesMap.set(uid, uData.name.trim());
            }
          }
        } catch {
          // ignore
        }
      })
    );
  }

  const messages: ContactMessage[] = messagesSnapshot.docs
    .map((doc) => {
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

      const source = data.source || (data.userId ? "User" : "Contact");
      const replies = Array.isArray(data.replies) ? data.replies : [];
      const resolvedName =
        (data.userId && userNamesMap.get(data.userId)) ||
        data.name ||
        "";

      return {
        id: doc.id,
        name: resolvedName,
        email: data.email || "",
        subject: data.subject || "",
        message: data.message || "",
        status: (data.status as "unread" | "read" | "archived") || "unread",
        createdAt: createdAtStr,
        brandKey: data.brandKey || "",
        brandName: data.brandName,
        updatedAt: data.updatedAt,
        source: source as "Contact" | "User",
        userId: data.userId || undefined,
        userUnread: data.userUnread || false,
        replies,
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const messagesDict = dict?.admin?.messages_section || {};

  return (
    <AdminPageLayout
      title={messagesDict.title || "Messages"}
      description={messagesDict.subtitle ||
        (lang === "fr"
          ? "Demandes de contact reçues depuis la boutique."
          : "Contact inquiries received from your store.")}
      icon={Mail}
    >
      <MessagesTable initialMessages={messages} lang={lang} dict={dict} />
    </AdminPageLayout>
  );
}
