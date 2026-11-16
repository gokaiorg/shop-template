import type { Metadata } from "next";
import { brandConfig } from "./brand.config";
import { resolveSiteBaseUrl, toAbsoluteUrl } from "@/lib/seo/metadata";

export function formatTitle(title?: string, brandName?: string): string {
  const activeBrandName = brandName || brandConfig.identity.name;
  if (!title) return `${activeBrandName} - Store`;
  return `%s | ${activeBrandName}`.replace("%s", title);
}

export function constructSiteMetadata({
  title,
  description,
  image,
  lang = "en",
  noIndex = false,
  brandName,
  faviconUrl,
}: {
  title?: string;
  description?: string;
  image?: string;
  lang?: "en" | "fr" | string;
  noIndex?: boolean;
  brandName?: string;
  faviconUrl?: string;
} = {}): Metadata {
  const isFr = lang === "fr";
  const activeBrandName = brandName || brandConfig.identity.name;
  const siteTitle = title
    ? formatTitle(title, activeBrandName)
    : `${activeBrandName} - Store`;
  const siteDescription = description || "";
  const siteUrl = resolveSiteBaseUrl(brandConfig.identity.url);
  const rawOgImage =
    image ||
    brandConfig.assets.ogImage ||
    brandConfig.assets.heroBanner ||
    brandConfig.assets.logo.src;
  const ogImage = toAbsoluteUrl(siteUrl, rawOgImage);
  const activeIcon = faviconUrl || brandConfig.assets.icon || "/icon.png";

  return {
    title: {
      default: siteTitle,
      template: `%s | ${activeBrandName}`,
    },
    description: siteDescription,
    metadataBase: new URL(siteUrl),
    authors: [
      {
        name: activeBrandName,
        url: siteUrl,
      },
    ],
    creator: activeBrandName,
    generator: "Gokai Labs",
    icons: {
      icon: [{ url: activeIcon, sizes: "any" }],
      shortcut: [{ url: activeIcon }],
      apple: [{ url: activeIcon }],
    },
    openGraph: {
      title: siteTitle,
      description: siteDescription,
      url: siteUrl,
      siteName: activeBrandName,
      locale: isFr ? "fr_FR" : "en_US",
      type: "website",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: activeBrandName,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDescription,
      creator: brandConfig.seo?.twitterHandle || activeBrandName,
      images: [ogImage],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
        },
  };
}
