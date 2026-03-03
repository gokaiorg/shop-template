import { LoginForm } from "@/components/LoginForm"
import { getDictionary } from "@/lib/dictionaries"
import { Locale } from "@/app/i18n-config"

export default async function LoginPage({
    params,
}: {
    params: Promise<{ lang: string }>
}) {
    const { lang } = await params;
    const dict = await getDictionary(lang as Locale);

    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
            <div className="flex w-full max-w-sm flex-col gap-6">
                <LoginForm dict={dict.auth} />
            </div>
        </div>
    )
}
