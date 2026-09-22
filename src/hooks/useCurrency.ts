"use client";

import { useCurrencyStore } from "@/store/useCurrencyStore";
import { useBrand } from "@/components/providers/BrandProvider";
import { formatPrice } from "@/lib/currency";
import { useMounted } from "@/hooks/useMounted";

/**
 * Exchange rates dictionary anchored on EUR (1.0).
 * Easily replaceable with a live API fetcher (e.g. ExchangeRate-API / Fixer) in the future.
 */
export const DEFAULT_EXCHANGE_RATES: Record<string, number> = {
    EUR: 1.0,
    USD: 1.08,
    GBP: 0.85,
    THB: 39.50,
    JPY: 165.0,
    CNY: 7.85,
    RUB: 100.0,
    CAD: 1.48,
    AUD: 1.65,
    CHF: 0.96,
};

/**
 * Calculates exchange rate between any two currencies using the EUR base table.
 * Example: EUR -> USD: 1.08 / 1.0 = 1.08
 * Example: THB -> USD: 1.08 / 39.50 = 0.0273
 */
export function getExchangeRate(fromCurrency: string = "EUR", toCurrency: string = "EUR"): number {
    const from = (fromCurrency || "EUR").trim().toUpperCase();
    const to = (toCurrency || "EUR").trim().toUpperCase();

    if (from === to) return 1.0;

    const rateFrom = DEFAULT_EXCHANGE_RATES[from] ?? 1.0;
    const rateTo = DEFAULT_EXCHANGE_RATES[to] ?? 1.0;

    return rateTo / rateFrom;
}

/**
 * Custom hook to convert a base price from the store's configured currency
 * to the customer's selected display currency.
 *
 * @param basePrice - Original product price in store's base currency
 * @param locale - BCP-47 locale code (e.g. 'fr', 'en') for number formatting
 * @returns Converted price, active currency, rate and formatted string
 */
export function useCurrency(
    basePrice: number | string | null | undefined,
    locale: string = "en"
) {
    const { currency: storeBaseCurrency } = useBrand();
    const selectedCurrency = useCurrencyStore((state) => state.selectedCurrency);
    const mounted = useMounted();

    const baseCurr = (storeBaseCurrency || "EUR").trim().toUpperCase();
    // Prior to mounting on client, default to store currency to avoid hydration mismatch
    const activeCurrency = (mounted && selectedCurrency)
        ? selectedCurrency.trim().toUpperCase()
        : baseCurr;

    const numericPrice = typeof basePrice === "string" ? parseFloat(basePrice) : (basePrice || 0);
    const validPrice = isNaN(numericPrice) ? 0 : numericPrice;

    const rate = getExchangeRate(baseCurr, activeCurrency);
    const convertedPrice = validPrice * rate;

    const formattedPrice = formatPrice(convertedPrice, activeCurrency, locale);

    return {
        originalPrice: validPrice,
        convertedPrice,
        currency: activeCurrency,
        baseCurrency: baseCurr,
        rate,
        formattedPrice,
    };
}
