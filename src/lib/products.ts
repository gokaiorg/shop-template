import { Product } from '@/types/database';

/**
 * Checks whether a product has positive stock (> 0) and is not marked 'out-of-stock'.
 * Safe for use in both Client Components and Server Components (no node/firebase-admin dependencies).
 */
export const isProductInStock = (product: Product | Record<string, any>): boolean => {
    // 1. Stock check: must be strictly positive
    const stock = typeof product.stock === 'number' ? product.stock : 0;
    if (stock <= 0) return false;

    // 2. Status check: exclude explicit 'out-of-stock'
    const status = typeof product.status === 'object'
        ? (product.status?.en || product.status?.fr)
        : product.status;
    if (status === 'out-of-stock') return false;

    return true;
};

/**
 * Obsolete custom specification keys to permanently remove from product schema and initial states.
 * - originalType, karon_stock, karon_entry, wsp, rawai_entry, rawai_stock
 */
export const OBSOLETE_METADATA_KEYS = [
    "originalType",
    "type",
    "karon_stock",
    "karon_entry",
    "wsp",
    "rawai_entry",
    "rawai_stock",
] as const;

export const OBSOLETE_METADATA_KEYS_SET = new Set(
    OBSOLETE_METADATA_KEYS.map((k) => k.toLowerCase())
);

/**
 * Maps raw stock value from external sources (such as a Google Sheet 'rawai_stock' column)
 * directly to the root `stock` property as a number (supporting decimals, e.g. 49.7).
 * This guarantees the root `stock` is the Single Source of Truth and prevents `rawai_stock`
 * from being placed into `metadata`.
 */
export function mapExternalProductStock(rawStock: unknown): number {
    if (typeof rawStock === "number" && !isNaN(rawStock)) {
        return Math.max(0, rawStock);
    }
    const str = String(rawStock || "0").trim().replace(",", ".");
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : Math.max(0, parsed);
}

/**
 * Known translatable metadata fields that should be stored as multilingual objects { en: "...", fr: "..." }.
 */
export const KNOWN_TRANSLATABLE_METADATA_KEYS = [
    "effects",
    "relieves",
] as const;

export const KNOWN_TRANSLATABLE_METADATA_KEYS_SET = new Set(
    KNOWN_TRANSLATABLE_METADATA_KEYS.map((k) => k.toLowerCase())
);

/**
 * Utility that sanitizes product metadata:
 * 1. Permanently strips obsolete keys (originalType, karon_stock, karon_entry, wsp, rawai_entry).
 * 2. Merges legacy flat locale keys (e.g. effects_en, effects_fr, relieves_en, relieves_fr)
 *    into nested objects { en: "...", fr: "..." }.
 * 3. Preserves universal scalar values (thc, cbd, rawai_stock, dominance, etc.).
 */
export function cleanAndMigrateMetadata(
    raw: Record<string, any> | undefined,
    supportedLocales: string[] = ["en", "fr"]
): Record<string, any> {
    if (!raw || typeof raw !== "object") return {};

    const result: Record<string, any> = {};

    for (const [rawKey, rawVal] of Object.entries(raw)) {
        if (!rawKey || rawVal === null || rawVal === undefined) continue;

        const trimmedKey = rawKey.trim();
        // Remove obsolete keys
        if (OBSOLETE_METADATA_KEYS_SET.has(trimmedKey.toLowerCase())) continue;

        // Check if key is a legacy localized flat key like effects_en or relieves_fr
        const match = trimmedKey.match(/^(.*)_([a-zA-Z]{2})$/);
        const suffixLoc = match ? match[2].toLowerCase() : null;

        if (match && suffixLoc && (supportedLocales.includes(suffixLoc) || ["en", "fr"].includes(suffixLoc))) {
            const baseKey = match[1];
            if (OBSOLETE_METADATA_KEYS_SET.has(baseKey.toLowerCase())) continue;

            if (typeof result[baseKey] !== "object" || result[baseKey] === null || Array.isArray(result[baseKey])) {
                result[baseKey] = {};
            }

            result[baseKey][suffixLoc] = typeof rawVal === "object" ? JSON.stringify(rawVal) : String(rawVal);
            continue;
        }

        // If already an object (multilingual)
        if (typeof rawVal === "object" && !Array.isArray(rawVal)) {
            const objVal: Record<string, string> = {};
            Object.entries(rawVal).forEach(([k, v]) => {
                objVal[k] = v !== null && v !== undefined ? String(v) : "";
            });
            result[trimmedKey] = objVal;
            continue;
        }

        // If known translatable key but currently a string
        if (KNOWN_TRANSLATABLE_METADATA_KEYS_SET.has(trimmedKey.toLowerCase())) {
            const currentObj = typeof result[trimmedKey] === "object" && result[trimmedKey] !== null
                ? result[trimmedKey]
                : {};
            const defLoc = supportedLocales[0] || "en";
            if (!currentObj[defLoc]) {
                currentObj[defLoc] = String(rawVal);
            }
            result[trimmedKey] = currentObj;
            continue;
        }

        // Universal scalar value: preserve number or boolean if already numeric/boolean
        if (typeof rawVal === "number" || typeof rawVal === "boolean") {
            result[trimmedKey] = rawVal;
        } else {
            const strVal = String(rawVal).trim();
            if (strVal.toLowerCase() === "true") {
                result[trimmedKey] = true;
            } else if (strVal.toLowerCase() === "false") {
                result[trimmedKey] = false;
            } else if (!isNaN(Number(strVal)) && strVal !== "") {
                result[trimmedKey] = Number(strVal);
            } else {
                result[trimmedKey] = strVal;
            }
        }
    }

    return result;
}

