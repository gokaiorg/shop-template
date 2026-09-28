import { Geist, Geist_Mono, Inter, Space_Grotesk, Manrope, Jersey_25 } from "next/font/google";

export const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

export const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  display: "swap",
});

export const jersey25 = Jersey_25({
  weight: "400",
  variable: "--font-jersey-25",
  subsets: ["latin"],
  display: "swap",
});

export type FontFamilyKey =
  | "Geist"
  | "Inter"
  | "Space Grotesk"
  | "Manrope"
  | "Jersey 25"
  | "Pixelify Sans"
  | "geist"
  | "inter"
  | "space-grotesk"
  | "manrope"
  | "jersey-25"
  | "pixelify-sans";

export interface FontOption {
  id: string;
  label: string;
  cssVariable: string;
  fontFamilyValue: string;
  fontClass: string;
}

export const FONT_OPTIONS: Record<string, FontOption> = {
  Geist: {
    id: "Geist",
    label: "Geist",
    cssVariable: "var(--font-geist-sans)",
    fontFamilyValue: "var(--font-geist-sans, 'Geist'), sans-serif",
    fontClass: geistSans.variable,
  },
  Inter: {
    id: "Inter",
    label: "Inter",
    cssVariable: "var(--font-inter)",
    fontFamilyValue: "var(--font-inter, 'Inter'), 'Inter', sans-serif",
    fontClass: inter.variable,
  },
  "Space Grotesk": {
    id: "Space Grotesk",
    label: "Space Grotesk",
    cssVariable: "var(--font-space-grotesk)",
    fontFamilyValue: "var(--font-space-grotesk, 'Space Grotesk'), 'Space Grotesk', sans-serif",
    fontClass: spaceGrotesk.variable,
  },
  Manrope: {
    id: "Manrope",
    label: "Manrope",
    cssVariable: "var(--font-manrope)",
    fontFamilyValue: "var(--font-manrope, 'Manrope'), 'Manrope', sans-serif",
    fontClass: manrope.variable,
  },
  "Jersey 25": {
    id: "Jersey 25",
    label: "Jersey 25",
    cssVariable: "var(--font-jersey-25)",
    fontFamilyValue: "var(--font-jersey-25, 'Jersey 25'), 'Jersey 25', sans-serif",
    fontClass: jersey25.variable,
  },
  "Pixelify Sans": {
    id: "Jersey 25",
    label: "Jersey 25",
    cssVariable: "var(--font-jersey-25)",
    fontFamilyValue: "var(--font-jersey-25, 'Jersey 25'), 'Jersey 25', sans-serif",
    fontClass: jersey25.variable,
  },
};

export const GEIST_FONT_CLASSES = [
  geistSans.variable,
  geistMono.variable,
].join(" ");

export const ALL_FONT_CLASSES = [
  geistSans.variable,
  geistMono.variable,
  inter.variable,
  spaceGrotesk.variable,
  manrope.variable,
  jersey25.variable,
].join(" ");

export function getStorefrontFontVariable(fontFamily?: string): string {
  switch (fontFamily) {
    case "Space Grotesk":
    case "space-grotesk":
      return "var(--font-space-grotesk)";
    case "Manrope":
    case "manrope":
      return "var(--font-manrope)";
    case "Jersey 25":
    case "jersey-25":
    case "jersey":
    case "Pixelify Sans":
    case "pixelify-sans":
    case "pixelify":
      return "var(--font-jersey-25)";
    case "Inter":
    case "inter":
      return "var(--font-inter)";
    case "Geist":
    case "geist":
    default: {
      const lower = (fontFamily || "").trim().toLowerCase();
      if (lower.includes("space")) return "var(--font-space-grotesk)";
      if (lower.includes("manrope")) return "var(--font-manrope)";
      if (lower.includes("jersey") || lower.includes("pixel")) return "var(--font-jersey-25)";
      if (lower.includes("inter")) return "var(--font-inter)";
      return "var(--font-geist-sans)";
    }
  }
}

export function getFontConfig(fontFamily?: string): FontOption {
  const variable = getStorefrontFontVariable(fontFamily);
  if (variable === "var(--font-space-grotesk)") return FONT_OPTIONS["Space Grotesk"];
  if (variable === "var(--font-manrope)") return FONT_OPTIONS["Manrope"];
  if (variable === "var(--font-jersey-25)") return FONT_OPTIONS["Jersey 25"];
  if (variable === "var(--font-inter)") return FONT_OPTIONS["Inter"];
  return FONT_OPTIONS["Geist"];
}

export const FONT_OPTIONS_LIST: { value: string; label: string }[] = [
  { value: "Geist", label: "Geist" },
  { value: "Inter", label: "Inter" },
  { value: "Space Grotesk", label: "Space Grotesk" },
  { value: "Manrope", label: "Manrope" },
  { value: "Jersey 25", label: "Jersey 25" },
];
