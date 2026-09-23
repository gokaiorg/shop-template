import { getActiveBrand } from '@/config/brand.config';

function getRuntimeEnv(key: string): string | undefined {
    if (typeof process === "undefined" || !process.env) return undefined;
    return process.env[key];
}

export function getSupportedLocales(): string[] {
    const raw =
        getRuntimeEnv("SUPPORTED_LOCALES") ??
        getRuntimeEnv("NEXT_PUBLIC_SUPPORTED_LOCALES") ??
        process.env.SUPPORTED_LOCALES;

    if (raw) {
        const list = raw.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
        if (list.length > 0) return list;
    }

    try {
        const brand = getActiveBrand();
        if (brand?.supportedLocales && brand.supportedLocales.length > 0) {
            return brand.supportedLocales;
        }
    } catch {
        // Fallback if brand resolution fails
    }

    return ['en', 'fr'];
}

export function getDefaultLocale(): string {
    const raw =
        getRuntimeEnv("DEFAULT_LOCALE") ??
        getRuntimeEnv("NEXT_PUBLIC_DEFAULT_LOCALE") ??
        process.env.DEFAULT_LOCALE;

    if (raw) return raw.trim().toLowerCase();

    try {
        const brand = getActiveBrand();
        if (brand?.defaultLocale) {
            return brand.defaultLocale.trim().toLowerCase();
        }
    } catch {
        // Fallback
    }

    return getSupportedLocales()[0] || 'en';
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

