import { getDefaultLocale, getSupportedLocales } from "@/app/i18n-config";

export function getLocalizedField(
    field: Record<string, string> | string | undefined | null,
    lang?: string,
    fallbackLang?: string
): string {
    if (!field) return "";
    if (typeof field === "string") return field;
    if (typeof field === "object") {
        const targetLang = (lang || getDefaultLocale()).toLowerCase();
        if (typeof field[targetLang] === "string" && field[targetLang].trim().length > 0) {
            return field[targetLang];
        }

        const fallback = (fallbackLang || getDefaultLocale()).toLowerCase();
        if (typeof field[fallback] === "string" && field[fallback].trim().length > 0) {
            return field[fallback];
        }

        const firstVal = Object.values(field).find((v) => typeof v === "string" && v.trim().length > 0);
        if (firstVal) return firstVal;
    }
    return "";
}

const LOCALE_NAMES: Record<string, string> = {
    en: "English (EN)",
    fr: "Français (FR)",
    es: "Español (ES)",
    de: "Deutsch (DE)",
    it: "Italiano (IT)",
    ja: "日本語 (JA)",
    zh: "中文 (ZH)",
    pt: "Português (PT)",
    nl: "Nederlands (NL)",
};

export function getLocaleDisplayName(locale: string): string {
    const lower = locale.toLowerCase();
    if (LOCALE_NAMES[lower]) return LOCALE_NAMES[lower];
    try {
        const languageNames = new Intl.DisplayNames([locale], { type: "language" });
        const name = languageNames.of(locale);
        if (name) {
            return `${name.charAt(0).toUpperCase() + name.slice(1)} (${locale.toUpperCase()})`;
        }
    } catch {
        // Fallback
    }
    return locale.toUpperCase();
}
