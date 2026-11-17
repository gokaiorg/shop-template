import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { headers } from "next/headers";
import {
  GEIST_FONT_CLASSES,
  geistMono,
  getFontConfig,
  getStorefrontFontVariable,
} from "@/app/fonts";
import { StorefrontThemeManager } from "@/components/providers/StorefrontThemeManager";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { BrandProvider } from "@/components/providers/BrandProvider";
import {
  getActiveBrand,
  getActiveBrandKey,
  getIsCartEnabled,
} from "@/config/brand.config";
import { getSupportedLocales, getDefaultLocale } from "@/app/i18n-config";
import { getStoreSettings } from "@/lib/services/settings";
import { constructSiteMetadata } from "@/config/site";
import {
  constructLocalizedMetadata,
  resolveSiteBaseUrl,
} from "@/lib/seo/metadata";
import { BrandConfig, SocialLink as BrandSocialLink } from "@/config/types";
import { getLocalizedField } from "@/lib/i18n";
import { GoogleTagManager } from "@next/third-parties/google";
import { getContrastYIQ } from "@/lib/utils/colors";
import "./globals.css";

type CustomCssVariables = CSSProperties & {
  "--font-storefront"?: string;
  "--font-sans"?: string;
};

const VALID_PLATFORMS: ReadonlySet<BrandSocialLink["platform"]> = new Set([
  "instagram",
  "twitter",
  "x",
  "facebook",
  "youtube",
  "linkedin",
  "github",
  "tiktok",
]);

function isValidPlatform(
  platform: string
): platform is BrandSocialLink["platform"] {
  return VALID_PLATFORMS.has(platform as BrandSocialLink["platform"]);
}

function toBilingualRecord(
  value?: Record<string, string>
): { en: string; fr: string } | undefined {
  if (!value) return undefined;
  const en = value.en || value.fr || "";
  const fr = value.fr || value.en || "";
  if (!en && !fr) return undefined;
  return { en, fr };
}

function normalizeSocialLinks(
  links?: Array<{ platform: string; url: string }>
): BrandSocialLink[] {
  if (!links || links.length === 0) return [];
  return links
    .filter((item) => Boolean(item.url && isValidPlatform(item.platform)))
    .map((item) => ({
      platform: item.platform as BrandSocialLink["platform"],
      url: item.url,
    }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const [{ lang }, storeSettings] = await Promise.all([
    params,
    getStoreSettings(),
  ]);
  const rawBrand = getActiveBrand();
  const brandName =
    storeSettings.brandName || rawBrand.identity.name || "Store";
  const baseUrl = resolveSiteBaseUrl(
    process.env.NEXT_PUBLIC_APP_URL || rawBrand.identity.url
  );
  const heroDesc =
    getLocalizedField(storeSettings.heroDescription, lang) ||
    getLocalizedField(storeSettings.footerDescription, lang) ||
    `${brandName} official platform`;

  const baseMetadata = constructSiteMetadata({
    lang,
    brandName,
    faviconUrl: storeSettings.faviconUrl,
  });

  const supportedLocales = getSupportedLocales();
  const defaultLocale = getDefaultLocale();
  const languageAlternates = Object.fromEntries([
    ...supportedLocales.map((locale) => [locale, `${baseUrl}/${locale}`]),
    ["x-default", `${baseUrl}/${defaultLocale}`],
  ]);

  const localizedMetadata = constructLocalizedMetadata({
    locale: lang,
    title: `${brandName} - Store`,
    description: heroDesc,
    siteName: brandName,
    baseUrl,
    canonicalPath: `/${lang}`,
    languages: languageAlternates,
    imageUrl:
      storeSettings.heroBackgroundImageUrl ||
      rawBrand.assets.ogImage ||
      rawBrand.assets.heroBanner,
  });

  return {
    ...baseMetadata,
    ...localizedMetadata,
    metadataBase: new URL(baseUrl),
    title: {
      default: `${brandName} - Store`,
      template: `%s | ${brandName}`,
    },
    authors: [{ name: brandName, url: baseUrl }],
    creator: brandName,
    generator: "Gokai Labs",
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const [{ lang }, storeSettings, headersList] = await Promise.all([
    params,
    getStoreSettings(),
    headers(),
  ]);

  const rawBrand = getActiveBrand();
  const brandKey = getActiveBrandKey();
  const supportedLocales = getSupportedLocales();
  const defaultLocale = getDefaultLocale();
  const isCartEnabled =
    typeof storeSettings.cartEnabled === "boolean"
      ? storeSettings.cartEnabled
      : getIsCartEnabled();
  const defaultTheme = storeSettings.defaultTheme || "system";
  const forcedTheme =
    defaultTheme === "light" || defaultTheme === "dark"
      ? defaultTheme
      : undefined;
  const defaultCurrency = storeSettings.defaultCurrency || "THB";

  const normalizedSocials = normalizeSocialLinks(storeSettings.socialLinks);

  const brand: BrandConfig = {
    ...rawBrand,
    identity: {
      ...rawBrand.identity,
      name: storeSettings.brandName || rawBrand.identity.name,
      tagline: toBilingualRecord(storeSettings.heroTitle),
      description: toBilingualRecord(storeSettings.heroDescription),
    },
    assets: {
      ...rawBrand.assets,
      logo: {
        ...rawBrand.assets.logo,
        src: storeSettings.logoUrl || rawBrand.assets.logo.src,
      },
      favicon:
        storeSettings.faviconUrl ||
        rawBrand.assets.favicon ||
        rawBrand.assets.icon ||
        "/icon.png",
    },
    contact: {
      email: storeSettings.contactEmail || rawBrand.contact?.email || "",
      phone: storeSettings.contactPhone || rawBrand.contact?.phone || "",
      supportHours: {
        en:
          storeSettings.supportHoursEn ||
          rawBrand.contact?.supportHours?.en ||
          "",
        fr:
          storeSettings.supportHoursFr ||
          rawBrand.contact?.supportHours?.fr ||
          "",
      },
      address: {
        street:
          storeSettings.seoAddressStreet ||
          rawBrand.contact?.address?.street ||
          "",
        city:
          storeSettings.seoAddressLocality ||
          rawBrand.contact?.address?.city ||
          "",
        postalCode:
          storeSettings.seoPostalCode ||
          rawBrand.contact?.address?.postalCode ||
          "",
        country:
          storeSettings.seoCountry || rawBrand.contact?.address?.country || "",
      },
    },
    navigation: {
      ...(rawBrand.navigation || {}),
      socials:
        normalizedSocials.length > 0
          ? normalizedSocials
          : rawBrand.navigation?.socials || [],
    },
  };

  const { theme } = brand;
  const colors = theme.colors;

  const headerPathname = headersList.get("x-pathname") || "";
  const isAdmin = headerPathname.includes("/admin");

  const isSquared = storeSettings.borderStyle === "squared";
  const brandRadius =
    !isAdmin && isSquared ? "0px" : theme.radius || "0.625rem";

  const activeFontConfig = getFontConfig(storeSettings.fontFamily);
  const storefrontFontVariable =
    activeFontConfig?.cssVariable ||
    getStorefrontFontVariable(storeSettings.fontFamily);
  const activeFontClasses = isAdmin
    ? GEIST_FONT_CLASSES
    : `${activeFontConfig.fontClass} ${geistMono.variable}`;

  const fallbackPrimaryColor = brandKey === "art-fate" ? "#14B3F6" : "#0f172a";
  const primaryColor = storeSettings.primaryColor || fallbackPrimaryColor;
  const primaryForeground = getContrastYIQ(primaryColor, "#0f172a", "#ffffff");

  const brandStyles = `
    :root {
      --radius: ${brandRadius};
      --font-storefront: ${isAdmin ? "var(--font-geist-sans)" : storefrontFontVariable};
      --font-sans: ${isAdmin ? "var(--font-geist-sans)" : "var(--font-storefront)"};
      --theme-primary: ${primaryColor};
      --primary: var(--theme-primary);
      --primary-foreground: ${primaryForeground};
      ${colors?.light?.accent ? `--accent: ${colors.light.accent};` : ""}
      ${colors?.light?.background ? `--background: ${colors.light.background};` : ""}
      ${colors?.light?.foreground ? `--foreground: ${colors.light.foreground};` : ""}
    }
    ${
      !isAdmin
        ? `
    html:not([data-admin]):not([data-admin-root]) body:not([data-admin]):not([data-admin-root]) {
      --font-storefront: ${storefrontFontVariable};
      font-family: var(--font-storefront);
    }
    html:not([data-admin]):not([data-admin-root]) body:not([data-admin]):not([data-admin-root]) input,
    html:not([data-admin]):not([data-admin-root]) body:not([data-admin]):not([data-admin-root]) button,
    html:not([data-admin]):not([data-admin-root]) body:not([data-admin]):not([data-admin-root]) select,
    html:not([data-admin]):not([data-admin-root]) body:not([data-admin]):not([data-admin-root]) textarea {
      font-family: var(--font-storefront);
    }
    `
        : ""
    }
    .dark {
      --theme-primary: ${primaryColor};
      --primary: var(--theme-primary);
      --primary-foreground: ${primaryForeground};
      ${colors?.dark?.accent ? `--accent: ${colors.dark.accent};` : ""}
      ${colors?.dark?.background ? `--background: ${colors.dark.background};` : ""}
      ${colors?.dark?.foreground ? `--foreground: ${colors.dark.foreground};` : ""}
    }
  `;

  const fallbackGtmId =
    brandKey === "art-fate"
      ? "GTM-PJLLHFPX"
      : brandKey === "gokai-labs"
        ? "GTM-52G2C5XV"
        : "GTM-MZ8XFFHJ";
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID || fallbackGtmId;

  const bodyStyle: CustomCssVariables = isAdmin
    ? {
        "--font-storefront": "var(--font-geist-sans)",
        "--font-sans": "var(--font-geist-sans)",
        fontFamily: "var(--font-geist-sans), sans-serif",
      }
    : {
        "--font-storefront": storefrontFontVariable,
        fontFamily: "var(--font-storefront)",
      };

  return (
    <html
      lang={lang}
      suppressHydrationWarning
      data-admin={isAdmin ? "true" : undefined}
      data-admin-root={isAdmin ? "true" : undefined}
      className={`${activeFontClasses} ${!isAdmin && isSquared ? "theme-squared" : ""} ${forcedTheme === "dark" || defaultTheme === "dark" ? "dark" : ""}`.trim()}
    >
      <head>
        {brand.assets.favicon && (
          <link rel="icon" href={brand.assets.favicon} />
        )}
        <style dangerouslySetInnerHTML={{ __html: brandStyles }} />
      </head>
      <body
        suppressHydrationWarning
        data-admin={isAdmin ? "true" : undefined}
        data-admin-root={isAdmin ? "true" : undefined}
        style={bodyStyle}
        className={`${activeFontClasses} antialiased font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme={defaultTheme}
          forcedTheme={forcedTheme}
          enableSystem={defaultTheme === "system"}
          disableTransitionOnChange
        >
          <StorefrontThemeManager
            isSquared={isSquared}
            storefrontFont={storefrontFontVariable}
            defaultTheme={defaultTheme}
            forcedTheme={forcedTheme}
          />
          <BrandProvider
            brand={brand}
            brandKey={brandKey}
            isCartEnabled={isCartEnabled}
            supportedLocales={supportedLocales}
            defaultLocale={defaultLocale}
            currency={defaultCurrency}
            defaultTheme={defaultTheme}
            catalogTitle={storeSettings.catalogTitle}
            catalogSlug={
              typeof storeSettings.catalogSlug === "object"
                ? getLocalizedField(storeSettings.catalogSlug, lang) || "shop"
                : storeSettings.catalogSlug || "shop"
            }
            catalogSlugs={
              typeof storeSettings.catalogSlug === "object"
                ? storeSettings.catalogSlug
                : { [defaultLocale]: storeSettings.catalogSlug || "shop" }
            }
            productImageRatio={
              storeSettings.productImageRatio ||
              brand.theme?.productImageRatio ||
              (brandKey === "green-ghost" ? "square" : "default")
            }
          >
            {children}
          </BrandProvider>
        </ThemeProvider>
        <GoogleTagManager gtmId={gtmId} />
      </body>
    </html>
  );
}
