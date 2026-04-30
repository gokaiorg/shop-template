import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function protectAdminRoute(lang: string) {
    const session = await auth();
    const userRole = (session?.user?.role || "").toLowerCase();
    
    if (!session || userRole !== "admin") {
        redirect(`/${lang}/admin/dashboard`);
    }
}
