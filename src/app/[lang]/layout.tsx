import type { Metadata } from "next";
import { headers } from "next/headers";
import { ALL_FONT_CLASSES, GEIST_FONT_CLASSES, getStorefrontFontVariable } from "@/app/fonts";
import { StorefrontThemeManager } from "@/components/providers/StorefrontThemeManager";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { BrandProvider } from "@/components/providers/BrandProvider";
import { getActiveBrand, getActiveBrandKey, getIsCartEnabled } from "@/config/brand.config";
import { getSupportedLocales, getDefaultLocale } from "@/app/i18n-config";
import { getStoreSettings } from "@/lib/services/settings";
import { constructSiteMetadata } from "@/config/site";
import { BrandConfig } from "@/config/types";
import { getLocalizedField } from "@/lib/i18n";
import { GoogleTagManager } from "@next/third-parties/google";
import { getContrastHex } from "@/lib/utils/colors";
import "./globals.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  const storeSettings = await getStoreSettings();
  const rawBrand = getActiveBrand();
  const brandName = storeSettings.brandName || rawBrand.identity.name || "Store";
  const rawBaseUrl = process.env.NEXT_PUBLIC_APP_URL || rawBrand.identity.url || "http://localhost:3000";
  const baseUrl = rawBaseUrl.replace(/\/+$/, "");

  const baseMetadata = constructSiteMetadata({
    lang,
    brandName,
    faviconUrl: storeSettings.faviconUrl,
  });

  return {
    ...baseMetadata,
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
  const { lang } = await params;
  const rawBrand = getActiveBrand();
  const brandKey = getActiveBrandKey();
  const supportedLocales = getSupportedLocales();
  const defaultLocale = getDefaultLocale();
  const storeSettings = await getStoreSettings();
  const isCartEnabled = typeof storeSettings.cartEnabled === 'boolean'
    ? storeSettings.cartEnabled
    : getIsCartEnabled();
  const defaultTheme = storeSettings.defaultTheme || 'system';
  const forcedTheme = (defaultTheme === 'light' || defaultTheme === 'dark') ? defaultTheme : undefined;
  const defaultCurrency = storeSettings.defaultCurrency || 'THB';

  const brand: BrandConfig = {
    ...rawBrand,
    identity: {
      ...rawBrand.identity,
      name: storeSettings.brandName || rawBrand.identity.name,
      tagline: storeSettings.heroTitle ? (storeSettings.heroTitle as any) : undefined,
      description: storeSettings.heroDescription ? (storeSettings.heroDescription as any) : undefined,
    },
    assets: {
      ...rawBrand.assets,
      logo: {
        ...rawBrand.assets.logo,
        src: storeSettings.logoUrl || rawBrand.assets.logo.src,
      },
      favicon: storeSettings.faviconUrl || rawBrand.assets.favicon || rawBrand.assets.icon || '/icon.png',
    },
    contact: {
      email: storeSettings.contactEmail || rawBrand.contact?.email || '',
      phone: storeSettings.contactPhone || rawBrand.contact?.phone || '',
      supportHours: {
        en: storeSettings.supportHoursEn || (rawBrand.contact?.supportHours as any)?.en || '',
        fr: storeSettings.supportHoursFr || (rawBrand.contact?.supportHours as any)?.fr || '',
      },
      address: {
        street: storeSettings.seoAddressStreet || rawBrand.contact?.address?.street || '',
        city: storeSettings.seoAddressLocality || rawBrand.contact?.address?.city || '',
        postalCode: storeSettings.seoPostalCode || rawBrand.contact?.address?.postalCode || '',
        country: storeSettings.seoCountry || rawBrand.contact?.address?.country || '',
      },
    },
    navigation: {
      ...(rawBrand.navigation || {}),
      socials: storeSettings.socialLinks && storeSettings.socialLinks.length > 0
        ? (storeSettings.socialLinks as any)
        : rawBrand.navigation?.socials || [],
    },
  };

  const { theme } = brand;
  const colors = theme.colors;

  const headersList = await headers();
  const headerPathname = headersList.get("x-pathname") || "";
  const isAdmin = headerPathname.includes("/admin");

  const isSquared = storeSettings.borderStyle === "squared";
  const brandRadius = (!isAdmin && isSquared) ? "0px" : (theme.radius || "0.625rem");

  // Switch / case pour assigner la valeur de la base de données à la variable pivot --font-storefront
  let storefrontFontVariable = "var(--font-geist-sans)";
  switch (storeSettings.fontFamily) {
    case "Space Grotesk":
    case "space-grotesk":
      storefrontFontVariable = "var(--font-space-grotesk)";
      break;
    case "Manrope":
    case "manrope":
      storefrontFontVariable = "var(--font-manrope)";
      break;
    case "Jersey 25":
    case "jersey-25":
    case "jersey":
    case "Pixelify Sans":
    case "pixelify-sans":
    case "pixelify":
      storefrontFontVariable = "var(--font-jersey-25)";
      break;
    case "Inter":
    case "inter":
      storefrontFontVariable = "var(--font-inter)";
      break;
    case "Geist":
    case "geist":
      storefrontFontVariable = "var(--font-geist-sans)";
      break;
    default:
      storefrontFontVariable = getStorefrontFontVariable(storeSettings.fontFamily);
      break;
  }

  const fallbackPrimaryColor = brandKey === "art-fate" ? "#14B3F6" : "#0f172a";
  const primaryColor = storeSettings.primaryColor || fallbackPrimaryColor;
  const lightPrimaryForeground = getContrastHex(primaryColor, "#ffffff", "#111827");
  const darkPrimaryColor = storeSettings.primaryColor || colors?.dark?.primary || primaryColor;
  const darkPrimaryForeground = getContrastHex(darkPrimaryColor, "#ffffff", "#111827");

  const brandStyles = `
    :root {
      --radius: ${brandRadius};
      --font-storefront: ${isAdmin ? 'var(--font-geist-sans)' : storefrontFontVariable};
      --font-sans: ${isAdmin ? 'var(--font-geist-sans)' : 'var(--font-storefront)'};
      --theme-primary: ${primaryColor};
      --primary: var(--theme-primary);
      --primary-foreground: ${lightPrimaryForeground};
      ${colors?.light?.accent ? `--accent: ${colors.light.accent};` : ''}
      ${colors?.light?.background ? `--background: ${colors.light.background};` : ''}
      ${colors?.light?.foreground ? `--foreground: ${colors.light.foreground};` : ''}
    }
    ${!isAdmin ? `
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
    ` : ''}
    .dark {
      --theme-primary: ${darkPrimaryColor};
      --primary: var(--theme-primary);
      --primary-foreground: ${darkPrimaryForeground};
      ${colors?.dark?.accent ? `--accent: ${colors.dark.accent};` : ''}
      ${colors?.dark?.background ? `--background: ${colors.dark.background};` : ''}
      ${colors?.dark?.foreground ? `--foreground: ${colors.dark.foreground};` : ''}
    }
  `;

  const fallbackGtmId = brandKey === "art-fate"
    ? "GTM-PJLLHFPX"
    : brandKey === "gokai-labs"
    ? "GTM-52G2C5XV"
    : "GTM-MZ8XFFHJ";
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID || fallbackGtmId;

  return (
    <html
      lang={lang}
      suppressHydrationWarning
      data-admin={isAdmin ? "true" : undefined}
      data-admin-root={isAdmin ? "true" : undefined}
      className={`${ALL_FONT_CLASSES} ${!isAdmin && isSquared ? "theme-squared" : ""} ${forcedTheme === "dark" || defaultTheme === "dark" ? "dark" : ""}`.trim()}
    >
      <head>
        {brand.assets.favicon && <link rel="icon" href={brand.assets.favicon} />}
        <style dangerouslySetInnerHTML={{ __html: brandStyles }} />
      </head>
      <body
        suppressHydrationWarning
        data-admin={isAdmin ? "true" : undefined}
        data-admin-root={isAdmin ? "true" : undefined}
        style={isAdmin ? {
          ['--font-storefront' as any]: 'var(--font-geist-sans)',
          ['--font-sans' as any]: 'var(--font-geist-sans)',
          fontFamily: 'var(--font-geist-sans), sans-serif',
        } : {
          ['--font-storefront' as any]: storefrontFontVariable,
          fontFamily: 'var(--font-storefront)',
        }}
        className={`${isAdmin ? GEIST_FONT_CLASSES : ALL_FONT_CLASSES} antialiased font-sans`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme={defaultTheme}
          forcedTheme={forcedTheme}
          enableSystem={defaultTheme === 'system'}
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
            catalogSlug={typeof storeSettings.catalogSlug === 'object' ? getLocalizedField(storeSettings.catalogSlug, lang) || 'shop' : (storeSettings.catalogSlug || 'shop')}
            catalogSlugs={typeof storeSettings.catalogSlug === 'object' ? storeSettings.catalogSlug : { [defaultLocale]: storeSettings.catalogSlug || 'shop' }}
            productImageRatio={storeSettings.productImageRatio || brand.theme?.productImageRatio || (brandKey === 'green-ghost' ? 'square' : 'default')}
          >
            {children}
          </BrandProvider>
        </ThemeProvider>
        <GoogleTagManager gtmId={gtmId} />
      </body>
    </html>
  );
}
