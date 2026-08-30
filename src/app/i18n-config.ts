export function getSupportedLocales(): string[] {
    const raw = process.env.SUPPORTED_LOCALES || process.env.NEXT_PUBLIC_SUPPORTED_LOCALES;
    if (!raw) return ['en', 'fr'];
    const list = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    return list.length > 0 ? list : ['en'];
}

export function getDefaultLocale(): string {
    const raw = process.env.DEFAULT_LOCALE || process.env.NEXT_PUBLIC_DEFAULT_LOCALE;
    return (raw || getSupportedLocales()[0] || 'en').trim().toLowerCase();
}

export function isMultiLocale(): boolean {
    return getSupportedLocales().length > 1;
}

export const i18n = {
    get defaultLocale() {
        return getDefaultLocale();
    },
    get locales() {
        return getSupportedLocales();
    },
};

export type Locale = string;
