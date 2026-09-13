import { redirect } from "next/navigation";

export default async function AccountRootPage({
    params,
}: {
    params: Promise<{ lang: string }>;
}) {
    const { lang } = await params;
    redirect(`/${lang}/account/orders`);
}
