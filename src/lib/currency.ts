/**
 * Utility functions for currency and monetary price formatting.
 */

// Stripe currencies with no decimal places (unit amount is in whole currency units)
export const ZERO_DECIMAL_CURRENCIES = new Set([
    "bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", 
    "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf"
]);

/**
 * Checks whether a given currency code is zero-decimal in Stripe.
 */
export function isZeroDecimalCurrency(currency: string): boolean {
    return ZERO_DECIMAL_CURRENCIES.has((currency || "").toLowerCase());
}

/**
 * Calculates the unit amount (in smallest currency unit) required for Stripe Checkout.
 * E.g., for USD / EUR / THB (100.50 -> 10050 cents/satang), for JPY (1000 -> 1000).
 */
export function toStripeUnitAmount(amount: number, currency: string): number {
    const isZeroDecimal = isZeroDecimalCurrency(currency);
    return isZeroDecimal ? Math.round(amount) : Math.round(amount * 100);
}

/**
 * Formats a numerical amount into a localized currency string using Intl.NumberFormat.
 * 
 * @param amount - The price amount (number or string)
 * @param currency - The 3-letter currency code (e.g. 'THB', 'EUR', 'USD')
 * @param locale - BCP 47 language tag (e.g. 'en', 'fr')
 * @returns Formatted currency string, e.g. "฿1,200.00", "1 200,00 €", "$1,200.00"
 */
export function formatPrice(
    amount: number | string | null | undefined,
    currency: string = "THB",
    locale: string = "en"
): string {
    const numericAmount = typeof amount === "string" ? parseFloat(amount) : (amount || 0);
    const validAmount = isNaN(numericAmount) ? 0 : numericAmount;
    const normalizedCurrency = (currency || "THB").trim().toUpperCase();

    try {
        return new Intl.NumberFormat(locale, {
            style: "currency",
            currency: normalizedCurrency,
        }).format(validAmount);
    } catch {
        // Fallback in case of unsupported or invalid currency code
        return `${validAmount.toFixed(2)} ${normalizedCurrency}`;
    }
}
