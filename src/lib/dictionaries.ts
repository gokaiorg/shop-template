import "server-only";
import { cache } from "react";
import type { Locale } from "@/app/i18n-config";

export type Dictionary = typeof import("@/dictionaries/en.json");

const dictionaries: Record<string, () => Promise<Dictionary>> = {
  en: () => import("@/dictionaries/en.json").then((module) => module.default),
  fr: () => import("@/dictionaries/fr.json").then((module) => module.default),
};

export const getDictionary = cache(async (locale: Locale): Promise<Dictionary> => {
  const loader = dictionaries[locale] || dictionaries.en;
  return loader();
});
