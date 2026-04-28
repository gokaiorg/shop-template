import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";
import { LoginForm } from "@/components/LoginForm";
import { GoogleSignInButton } from "./GoogleSignInButton";

export default async function LoginPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    const dict = await getDictionary(lang as Locale);

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 border rounded-xl shadow-sm">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 mb-8">
                        {dict.auth?.login_title || "Sign in to your account"}
                    </h2>
                </div>

                <LoginForm dict={dict.auth} />
                
                <div className="mt-6 relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">Or continue with</span>
                    </div>
                </div>

                <div className="mt-6">
                    <GoogleSignInButton />
                </div>
            </div>
        </main>
    );
}
