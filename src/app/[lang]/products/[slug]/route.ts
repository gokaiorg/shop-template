import { NextRequest } from "next/server";
import { resolveProductRedirect } from "@/lib/services/shopify-redirects";

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ lang: string; slug: string }> }
) {
    const { slug } = await context.params;
    return resolveProductRedirect(slug, request.url);
}
