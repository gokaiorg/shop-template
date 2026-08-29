import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { brandConfig } from "@/config/brand.config";
import { constructSiteMetadata } from "@/config/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  return constructSiteMetadata({ lang });
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}>) {
  const { lang } = await params;
  const { theme } = brandConfig;
  const colors = theme.colors;

  const brandStyles = `
    :root {
      --radius: ${theme.radius || '0.625rem'};
      ${colors?.light?.primary ? `--primary: ${colors.light.primary};` : ''}
      ${colors?.light?.accent ? `--accent: ${colors.light.accent};` : ''}
      ${colors?.light?.background ? `--background: ${colors.light.background};` : ''}
      ${colors?.light?.foreground ? `--foreground: ${colors.light.foreground};` : ''}
    }
    .dark {
      ${colors?.dark?.primary ? `--primary: ${colors.dark.primary};` : ''}
      ${colors?.dark?.accent ? `--accent: ${colors.dark.accent};` : ''}
      ${colors?.dark?.background ? `--background: ${colors.dark.background};` : ''}
      ${colors?.dark?.foreground ? `--foreground: ${colors.dark.foreground};` : ''}
    }
  `;

  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{ __html: brandStyles }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
