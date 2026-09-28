"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useTheme } from "next-themes";

interface StorefrontThemeManagerProps {
  isSquared: boolean;
  storefrontFont: string;
  defaultTheme?: string;
  forcedTheme?: string;
}

export function StorefrontThemeManager({
  isSquared,
  storefrontFont,
  defaultTheme,
  forcedTheme,
}: StorefrontThemeManagerProps) {
  const pathname = usePathname();
  const isAdmin = pathname?.includes("/admin") ?? false;
  const { resolvedTheme, theme: currentTheme, setTheme } = useTheme();

  const effectiveTheme = forcedTheme || resolvedTheme || currentTheme || defaultTheme;

  useEffect(() => {
    if (forcedTheme && currentTheme !== forcedTheme) {
      setTheme(forcedTheme);
    }
  }, [forcedTheme, currentTheme, setTheme]);

  useEffect(() => {
    const root = document.documentElement;

    if (effectiveTheme === "dark") {
      if (!root.classList.contains("dark")) {
        root.classList.add("dark");
      }
    } else if (effectiveTheme === "light") {
      if (root.classList.contains("dark")) {
        root.classList.remove("dark");
      }
    }

    if (isAdmin) {
      root.setAttribute("data-admin", "true");
      root.setAttribute("data-admin-root", "true");
      document.body.setAttribute("data-admin", "true");
      document.body.setAttribute("data-admin-root", "true");
      root.classList.remove("theme-squared");
      root.style.setProperty("--font-storefront", "var(--font-geist-sans)");
      root.style.setProperty("--font-sans", "var(--font-geist-sans)");
      root.style.setProperty("--radius", "0.625rem");
      document.body.style.setProperty("--font-storefront", "var(--font-geist-sans)");
      document.body.style.setProperty("--font-sans", "var(--font-geist-sans)");
      document.body.style.setProperty("font-family", "var(--font-geist-sans), sans-serif");
    } else {
      root.removeAttribute("data-admin");
      root.removeAttribute("data-admin-root");
      document.body.removeAttribute("data-admin");
      document.body.removeAttribute("data-admin-root");
      if (isSquared) {
        root.classList.add("theme-squared");
        root.style.setProperty("--radius", "0px");
      } else {
        root.classList.remove("theme-squared");
        root.style.removeProperty("--radius");
      }
      root.style.setProperty("--font-storefront", storefrontFont);
      root.style.setProperty("--font-sans", "var(--font-storefront)");
      document.body.style.setProperty("--font-storefront", storefrontFont);
      document.body.style.setProperty("font-family", "var(--font-storefront), sans-serif");
    }
  }, [isAdmin, isSquared, storefrontFont, effectiveTheme, pathname]);

  return null;
}
