/**
 * Canonical isomorphic slug generator.
 * Safe to use in both client and server environments.
 * Converts strings to URL-friendly lowercase slugs without accents or special characters.
 */
export function slugify(text?: string | null): string {
    if (!text) return "";
    return text
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
}

export const generateSlug = slugify;
