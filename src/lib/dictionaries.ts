import "server-only";
import type { Locale } from "@/app/i18n-config";

const dictionaries: Record<string, () => Promise<any>> = {
    en: () => import("@/dictionaries/en.json").then((module) => module.default),
    fr: () => import("@/dictionaries/fr.json").then((module) => module.default),
};

export const getDictionary = async (locale: Locale) => {
    const loader = dictionaries[locale] || dictionaries.en;
    return loader();
};
