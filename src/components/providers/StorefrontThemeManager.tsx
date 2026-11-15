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

function setStyleIfChanged(
  element: HTMLElement,
  property: string,
  value: string
): void {
  if (element.style.getPropertyValue(property) !== value) {
    element.style.setProperty(property, value);
  }
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

  const effectiveTheme =
    forcedTheme || resolvedTheme || currentTheme || defaultTheme;

  useEffect(() => {
    if (forcedTheme && currentTheme !== forcedTheme) {
      setTheme(forcedTheme);
    }
  }, [forcedTheme, currentTheme, setTheme]);

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const root = document.documentElement;
      const body = document.body;

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
        if (root.getAttribute("data-admin") !== "true") {
          root.setAttribute("data-admin", "true");
          root.setAttribute("data-admin-root", "true");
          body.setAttribute("data-admin", "true");
          body.setAttribute("data-admin-root", "true");
        }
        if (root.classList.contains("theme-squared")) {
          root.classList.remove("theme-squared");
        }
        setStyleIfChanged(root, "--font-storefront", "var(--font-geist-sans)");
        setStyleIfChanged(root, "--font-sans", "var(--font-geist-sans)");
        setStyleIfChanged(root, "--radius", "0.625rem");
        setStyleIfChanged(body, "--font-storefront", "var(--font-geist-sans)");
        setStyleIfChanged(body, "--font-sans", "var(--font-geist-sans)");
        setStyleIfChanged(
          body,
          "font-family",
          "var(--font-geist-sans), sans-serif"
        );
      } else {
        if (root.hasAttribute("data-admin")) {
          root.removeAttribute("data-admin");
          root.removeAttribute("data-admin-root");
          body.removeAttribute("data-admin");
          body.removeAttribute("data-admin-root");
        }
        if (isSquared) {
          if (!root.classList.contains("theme-squared")) {
            root.classList.add("theme-squared");
          }
          setStyleIfChanged(root, "--radius", "0px");
        } else {
          if (root.classList.contains("theme-squared")) {
            root.classList.remove("theme-squared");
          }
          if (root.style.getPropertyValue("--radius")) {
            root.style.removeProperty("--radius");
          }
        }
        setStyleIfChanged(root, "--font-storefront", storefrontFont);
        setStyleIfChanged(root, "--font-sans", "var(--font-storefront)");
        setStyleIfChanged(body, "--font-storefront", storefrontFont);
        setStyleIfChanged(
          body,
          "font-family",
          "var(--font-storefront), sans-serif"
        );
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [isAdmin, isSquared, storefrontFont, effectiveTheme, pathname]);

  return null;
}
