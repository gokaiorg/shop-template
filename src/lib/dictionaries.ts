import "server-only";
import type { Locale } from "@/app/i18n-config";

const dictionaries = {
    en: () => import("@/dictionaries/en.json").then((module) => module.default),
    fr: () => import("@/dictionaries/fr.json").then((module) => module.default),
};

export const getDictionary = async (locale: Locale) => {
    return dictionaries[locale]?.() ?? dictionaries.en();
};
