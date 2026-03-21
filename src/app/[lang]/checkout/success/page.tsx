import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getDictionary } from "@/lib/dictionaries";
import { Locale } from "@/app/i18n-config";

export default async function CheckoutSuccessPage({
    params,
    searchParams
}: {
    params: Promise<{ lang: string }>;
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const { lang } = await params;
    const { session_id } = await searchParams;
    const dict = await getDictionary(lang as Locale);

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-10 border rounded-2xl shadow-sm text-center">
                <div className="flex justify-center">
                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                </div>
                <div>
                    <h2 className="mt-4 text-3xl font-extrabold text-gray-900">
                        {lang === 'fr' ? "Paiement réussi!" : "Payment Successful!"}
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {lang === 'fr' 
                           ? "Merci pour votre commande. Nous la préparons dès maintenant." 
                           : "Thank you for your order. We are getting it ready right now."}
                    </p>
                    {session_id && (
                        <p className="mt-4 text-xs text-gray-400 break-all">
                            Session ID: {session_id}
                        </p>
                    )}
                </div>

                <div className="mt-8">
                    <Link
                        href={`/${lang}/shop`}
                        className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 transition-colors"
                    >
                        {lang === 'fr' ? "Retour à la boutique" : "Return to Shop"}
                    </Link>
                </div>
            </div>
        </main>
    );
}
