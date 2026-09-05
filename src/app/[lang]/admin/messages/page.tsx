import { adminDb } from "@/lib/firebase-admin";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { protectAdminRoute } from "@/lib/auth-utils";
import { ContactMessage } from "@/types/database";
import { MessagesTable } from "@/components/admin/MessagesTable";

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

      return {
        id: doc.id,
        name: data.name || "",
        email: data.email || "",
        subject: data.subject || "",
        message: data.message || "",
        status: (data.status as "unread" | "read" | "archived") || "unread",
        createdAt: createdAtStr,
        brandKey: data.brandKey || "",
        brandName: data.brandName,
        updatedAt: data.updatedAt,
      };
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const messagesDict = dict?.admin?.messages_section || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {messagesDict.title || (lang === "fr" ? "Messages" : "Messages")}
        </h1>
        <p className="text-muted-foreground">
          {messagesDict.subtitle ||
            (lang === "fr"
              ? "Consultez et gérez les demandes de contact reçues depuis la boutique."
              : "View and manage contact inquiries sent from the storefront.")}
        </p>
      </div>

      <MessagesTable initialMessages={messages} lang={lang} dict={dict} />
    </div>
  );
}
