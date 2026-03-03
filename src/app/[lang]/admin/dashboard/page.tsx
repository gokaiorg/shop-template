import { auth } from "@/auth";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";

export default async function AdminDashboardPage({
    params,
}: {
    params: Promise<{ lang: Locale }>
}) {
    const session = await auth();
    const { lang } = await params;
    const dict = await getDictionary(lang);

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">{dict.admin.dashboard}</h1>

            <Card>
                <CardHeader>
                    <CardTitle>{dict.admin.welcome_title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>{dict.admin.welcome_text.replace("{email}", session?.user?.email ?? "")}</p>
                </CardContent>
            </Card>
        </div>
    );
}
