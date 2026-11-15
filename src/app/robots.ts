import { MetadataRoute } from "next";
import { headers } from "next/headers";
import { brandConfig } from "@/config/brand.config";

export const dynamic = "force-dynamic";

const ALLOWED_PATHS = ["/en", "/fr"];

const DEFAULT_DISALLOW = [
  "/api/",
  "/admin/",
  "/_next/",
  "/*/checkout",
  "/*/cart",
  "/private/",
  "/*/admin/",
  "/checkout/",
  "/*/checkout/",
];

const USER_AGENTS = [
  "*",
  "Googlebot",
  "GPTBot",
  "OAI-SearchBot",
  "ClaudeBot",
  "PerplexityBot",
  "Google-Extended",
];

export default async function robots(): Promise<MetadataRoute.Robots> {
  let hostBaseUrl: string | undefined;
  try {
    const headersList = await headers();
    const host =
      headersList.get("x-forwarded-host") || headersList.get("host");
    if (
      host &&
      !host.includes("localhost") &&
      !host.includes("127.0.0.1") &&
      !host.includes("0.0.0.0")
    ) {
      const proto = headersList.get("x-forwarded-proto") || "https";
      hostBaseUrl = `${proto}://${host}`;
    }
  } catch {
    hostBaseUrl = undefined;
  }

  const envUrl =
    process.env.APP_URL ||
    process.env["NEXT_PUBLIC_APP_URL"] ||
    process.env.NEXT_PUBLIC_APP_URL;
  const brandUrl = brandConfig.identity.url;

  let rawBaseUrl = hostBaseUrl;
  if (
    !rawBaseUrl &&
    envUrl &&
    !envUrl.includes("localhost") &&
    !envUrl.includes("127.0.0.1")
  ) {
    rawBaseUrl = envUrl;
  }
  if (
    !rawBaseUrl &&
    brandUrl &&
    !brandUrl.includes("localhost") &&
    !brandUrl.includes("127.0.0.1")
  ) {
    rawBaseUrl = brandUrl;
  }
  if (!rawBaseUrl) {
    rawBaseUrl = envUrl || brandUrl || "https://gokai.org";
  }

  const baseUrl = rawBaseUrl.replace(/\/+$/, "");

  const isArtFate =
    process.env.NEXT_PUBLIC_BRAND === "art-fate" ||
    process.env.BRAND === "art-fate" ||
    brandConfig.identity.id === "art-fate";

  const customDisallow = brandConfig.seo?.robots?.disallow;
  const customDisallowArray = Array.isArray(customDisallow)
    ? customDisallow
    : customDisallow
      ? [customDisallow]
      : [];

  const disallowList = Array.from(
    new Set([...DEFAULT_DISALLOW, ...customDisallowArray])
  );

  const rules: MetadataRoute.Robots["rules"] = USER_AGENTS.map((agent) => ({
    userAgent: agent,
    allow: ALLOWED_PATHS,
    disallow: disallowList,
  }));

  if (isArtFate) {
    rules.push({
      userAgent: "Meta-ExternalAgent",
      disallow: "/",
    });
  }

  return {
    rules,
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
