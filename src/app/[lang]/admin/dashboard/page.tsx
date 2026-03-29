import { auth } from "@/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function AdminDashboardPage({
    params,
}: {
    params: Promise<{ lang: string }>
}) {
    const { lang } = await params;

    // Fetch session and dictionary in parallel to reduce TTFB
    const [session, dict] = await Promise.all([
        auth(),
        getDictionary(lang as Locale)
    ]);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">{dict.admin.dashboard}</h1>

            <Card>
                <CardHeader>
                    <CardTitle>{dict.admin.welcome_title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p>{dict.admin.welcome_text.replace("{email}", session?.user?.email ?? "")}</p>

                    <div className="pt-4 border-t flex gap-4">
                        <Button asChild>
                            <Link href={`/${lang}/admin/categories`}>
                                {dict.admin.categories}
                            </Link>
                        </Button>
                        <Button asChild variant="secondary">
                            <Link href={`/${lang}/admin/products`}>
                                {dict.admin.products}
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
