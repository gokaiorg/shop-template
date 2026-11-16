import { MetadataRoute } from "next";
import { headers } from "next/headers";
import { brandConfig } from "@/config/brand.config";
import { getSupportedLocales } from "@/app/i18n-config";
import { resolveSiteBaseUrl } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

const DEFAULT_DISALLOW = [
  "/api/",
  "/admin/",
  "/*/admin/",
  "/checkout/",
  "/*/checkout/",
  "/*/checkout",
  "/*/cart",
  "/account/",
  "/*/account/",
  "/login",
  "/*/login",
  "/private/",
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
      const proto =
        process.env.NODE_ENV === "production"
          ? "https"
          : headersList.get("x-forwarded-proto") || "https";
      hostBaseUrl = `${proto}://${host}`;
    }
  } catch {
    hostBaseUrl = undefined;
  }

  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
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

  const baseUrl = resolveSiteBaseUrl(rawBaseUrl);
  const allowedPaths = [
    "/",
    ...getSupportedLocales().map((locale) => `/${locale}`),
    "/_next/static/",
    "/_next/image",
  ];

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
    allow: allowedPaths,
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
