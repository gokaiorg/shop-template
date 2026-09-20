import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { adminDb } from "@/lib/firebase-admin";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { ProfileForm } from "@/components/account/ProfileForm";

interface ProfilePageProps {
    params: Promise<{ lang: string }>;
}

export default async function CustomerProfilePage({ params }: ProfilePageProps) {
    const { lang } = await params;
    const session = await auth();

    if (!session?.user?.id) {
        redirect(`/${lang}/login`);
    }

    const dict = await getDictionary(lang as Locale);

    // Fetch freshest user data from Firestore
    let userName = session.user.name || "";
    let userEmail = session.user.email || "";

    try {
        const userDoc = await adminDb.collection("users").doc(session.user.id).get();
        if (userDoc.exists) {
            const data = userDoc.data();
            if (data?.name) userName = data.name;
            if (data?.email) userEmail = data.email;
        }
    } catch (e) {
        console.error("Error fetching user profile from Firestore:", e);
    }

    return (
        <ProfileForm
            initialName={userName}
            initialEmail={userEmail}
            lang={lang}
            dict={dict}
        />
    );
}
