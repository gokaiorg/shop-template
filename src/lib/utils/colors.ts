import { getActiveBrand } from "@/config/brand.config";

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Resolves a CSS variable to a raw color string.
 * Handles both client-side DOM resolution (getComputedStyle) and server-side fallback from brand configuration.
 */
export function resolveCssVariable(variableName: string, fallback?: string): string {
  if (!variableName) return fallback || "#0f172a";

  const cleanName = variableName
    .replace(/^var\(/, "")
    .replace(/\)$/, "")
    .split(",")[0]
    .trim();

  // Deterministic brand theme resolution (guarantees identical classes on server & client)
  try {
    const brand = getActiveBrand();
    const colors = brand?.theme?.colors;

    if (cleanName === "--primary" || cleanName === "--theme-primary") {
      const brandPrimary = colors?.dark?.primary || colors?.light?.primary;
      if (brandPrimary) return brandPrimary;
      if (brand?.identity?.id === "art-fate") return "#14B3F6";
      if (brand?.identity?.id === "green-ghost") return "oklch(0.85 0.14 140)";
      return "#0f172a";
    }

    if (cleanName === "--accent") {
      return (colors?.dark?.accent || colors?.light?.accent) || "#22c55e";
    }

    if (cleanName === "--background") {
      return (colors?.dark?.background || colors?.light?.background) || "#09090b";
    }
  } catch {
    // Fallback below
  }

  // Client-side DOM resolution fallback for custom variables
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    try {
      const computed = getComputedStyle(document.documentElement).getPropertyValue(cleanName).trim();
      if (computed) {
        if (computed.startsWith("var(") || computed.startsWith("--")) {
          return resolveCssVariable(computed, fallback);
        }
        return computed;
      }
    } catch {
      // Fallback to static resolution below
    }
  }

  return fallback || "#0f172a";
}

/**
 * Parses any color format (HEX, RGB, RGBA, HSL, HSLA, OKLCH, or CSS variable) into an RGB object.
 */
export function parseColorToRgb(color: string): RGB | null {
  if (!color || typeof color !== "string") return null;
  let c = color.trim().toLowerCase();

  // If input is a CSS variable (e.g. var(--primary) or --theme-primary), resolve it first
  if (c.startsWith("var(") || c.startsWith("--")) {
    const resolved = resolveCssVariable(c);
    if (resolved && resolved !== c) {
      c = resolved.trim().toLowerCase();
    }
  }

  // Named colors
  if (c === "white") return { r: 255, g: 255, b: 255 };
  if (c === "black") return { r: 0, g: 0, b: 0 };
  if (c === "transparent") return { r: 0, g: 0, b: 0 };

  // Hex (#RGB, #RGBA, #RRGGBB, #RRGGBBAA)
  if (c.startsWith("#")) {
    const hex = c.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return { r, g, b };
    }
    if (hex.length === 6 || hex.length === 8) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b };
    }
    return null;
  }

  // RGB / RGBA (both legacy commas and modern space syntax)
  const rgbMatch = c.match(/^rgba?\(\s*([\d.]+)(%?)\s*[,\s]\s*([\d.]+)(%?)\s*[,\s]\s*([\d.]+)(%?)/);
  if (rgbMatch) {
    let r = parseFloat(rgbMatch[1]);
    let g = parseFloat(rgbMatch[3]);
    let b = parseFloat(rgbMatch[5]);
    if (rgbMatch[2] === "%") r = (r / 100) * 255;
    if (rgbMatch[4] === "%") g = (g / 100) * 255;
    if (rgbMatch[6] === "%") b = (b / 100) * 255;
    return {
      r: Math.round(Math.max(0, Math.min(255, r))),
      g: Math.round(Math.max(0, Math.min(255, g))),
      b: Math.round(Math.max(0, Math.min(255, b))),
    };
  }

  // HSL / HSLA (both legacy and modern syntax)
  const hslMatch = c.match(/^hsla?\(\s*([\d.]+)(deg)?\s*[,\s]\s*([\d.]+)%\s*[,\s]\s*([\d.]+)%/);
  if (hslMatch) {
    const h = (parseFloat(hslMatch[1]) % 360) / 360;
    const s = parseFloat(hslMatch[3]) / 100;
    const l = parseFloat(hslMatch[4]) / 100;

    let r: number, g: number, b: number;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        let val = t;
        if (val < 0) val += 1;
        if (val > 1) val -= 1;
        if (val < 1 / 6) return p + (q - p) * 6 * val;
        if (val < 1 / 2) return q;
        if (val < 2 / 3) return p + (q - p) * (2 / 3 - val) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return {
      r: Math.round(Math.max(0, Math.min(255, r * 255))),
      g: Math.round(Math.max(0, Math.min(255, g * 255))),
      b: Math.round(Math.max(0, Math.min(255, b * 255))),
    };
  }

  // OKLCH: oklch(L C H) or oklch(L% C H)
  const oklchMatch = c.match(/^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)(%?)\s+([\d.]+)(deg)?/);
  if (oklchMatch) {
    let L = parseFloat(oklchMatch[1]);
    if (oklchMatch[2] === "%") L /= 100;
    let C = parseFloat(oklchMatch[3]);
    if (oklchMatch[4] === "%") C = (C / 100) * 0.4;
    const H = parseFloat(oklchMatch[5]);

    const hRad = (H * Math.PI) / 180;
    const a = C * Math.cos(hRad);
    const b = C * Math.sin(hRad);

    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;

    const lLinear = l_ * l_ * l_;
    const mLinear = m_ * m_ * m_;
    const sLinear = s_ * s_ * s_;

    const rLinear = +4.0767416621 * lLinear - 3.3077115913 * mLinear + 0.2309699292 * sLinear;
    const gLinear = -1.2684380046 * lLinear + 2.6097574011 * mLinear - 0.3413193965 * sLinear;
    const bLinear = -0.0041960863 * lLinear - 0.7034186147 * mLinear + 1.707614701 * sLinear;

    const linearToSrgb = (val: number) => {
      const clamped = Math.max(0, Math.min(1, val));
      return clamped <= 0.0031308
        ? 12.92 * clamped
        : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
    };

    return {
      r: Math.round(Math.max(0, Math.min(255, linearToSrgb(rLinear) * 255))),
      g: Math.round(Math.max(0, Math.min(255, linearToSrgb(gLinear) * 255))),
      b: Math.round(Math.max(0, Math.min(255, linearToSrgb(bLinear) * 255))),
    };
  }

  return null;
}

/**
 * Calculates WCAG 2.1 relative luminance for an sRGB color.
 * Returns a value between 0.0 (pure black) and 1.0 (pure white).
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const sR = r / 255;
  const sG = g / 255;
  const sB = b / 255;

  const R = sR <= 0.04045 ? sR / 12.92 : Math.pow((sR + 0.055) / 1.055, 2.4);
  const G = sG <= 0.04045 ? sG / 12.92 : Math.pow((sG + 0.055) / 1.055, 2.4);
  const B = sB <= 0.04045 ? sB / 12.92 : Math.pow((sB + 0.055) / 1.055, 2.4);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculates standard YIQ perceived brightness from RGB.
 * Formula: ((r * 299) + (g * 587) + (b * 114)) / 1000
 */
export function getYIQ(r: number, g: number, b: number): number {
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/**
 * Infallible YIQ contrast calculation accepting strictly a HEX color.
 * Formula: const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
 * If yiq >= 128: returns dark color (default: '#0f172a').
 * If yiq < 128: returns light color (default: '#ffffff').
 */
export function getContrastYIQ(
  hexColor: string,
  darkColor: string = "#0f172a",
  lightColor: string = "#ffffff"
): string {
  if (!hexColor || typeof hexColor !== "string") {
    return lightColor;
  }

  let cleanHex = hexColor.trim().replace(/^#/, "");

  // Expand shorthand hex (#RGB or #RGBA)
  if (cleanHex.length === 3 || cleanHex.length === 4) {
    cleanHex =
      cleanHex[0] + cleanHex[0] +
      cleanHex[1] + cleanHex[1] +
      cleanHex[2] + cleanHex[2];
  }

  if (cleanHex.length !== 6 && cleanHex.length !== 8) {
    // Attempt parseColorToRgb if non-standard string passed
    const parsed = parseColorToRgb(hexColor);
    if (parsed) {
      const yiq = getYIQ(parsed.r, parsed.g, parsed.b);
      return yiq >= 128 ? darkColor : lightColor;
    }
    return lightColor;
  }

  const r = parseInt(cleanHex.slice(0, 2), 16);
  const g = parseInt(cleanHex.slice(2, 4), 16);
  const b = parseInt(cleanHex.slice(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return lightColor;
  }

  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return yiq >= 128 ? darkColor : lightColor;
}

/**
 * Determines whether a hex color is considered light (YIQ >= 128).
 */
export function isLightHex(hexColor: string): boolean {
  return getContrastYIQ(hexColor, "dark", "light") === "dark";
}

/**
 * Returns the relative luminance for any color format or CSS variable.
 */
export function getLuminance(color: string): number {
  const rgb = parseColorToRgb(color);
  if (!rgb) return 0;
  return getRelativeLuminance(rgb.r, rgb.g, rgb.b);
}

/**
 * Determines whether a color is considered "light" (requiring dark text for accessibility)
 * or "dark" (requiring light text for accessibility).
 */
export function isLightColor(color: string): boolean {
  return isLightHex(color);
}

/**
 * Calculates the exact WCAG contrast ratio between two colors (ranging from 1.0 to 21.0).
 */
export function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

export interface ContrastTextColorOptions {
  darkClass?: string;
  lightClass?: string;
}

/**
 * Returns the appropriate Tailwind text color class based on YIQ luminance.
 */
export function getContrastTextColor(
  color: string,
  options?: ContrastTextColorOptions
): string {
  const { darkClass = "text-gray-900", lightClass = "text-white" } = options || {};
  return getContrastYIQ(color, darkClass, lightClass);
}

/**
 * Returns a hex color string for contrast (`#0f172a` or `#ffffff`).
 * Useful for injecting dynamic CSS variable values (e.g. `--primary-foreground`).
 */
export function getContrastHex(
  color: string,
  lightHex = "#ffffff",
  darkHex = "#0f172a"
): string {
  return getContrastYIQ(color, darkHex, lightHex);
}
