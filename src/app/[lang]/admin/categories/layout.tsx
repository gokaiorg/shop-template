import { protectAdminRoute } from "@/lib/auth-utils";

export default async function CategoriesLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    await protectAdminRoute(lang);
    return <>{children}</>;
}
