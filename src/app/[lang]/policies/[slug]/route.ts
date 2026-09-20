import { NextRequest } from "next/server";
import { resolvePolicyRedirect } from "@/lib/services/shopify-redirects";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ lang: string; slug: string }> }
) {
    const { slug } = await context.params;
    return resolvePolicyRedirect(slug, request.url);
}
