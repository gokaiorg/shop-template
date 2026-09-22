import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CurrencyItem {
    code: string;
    symbol: string;
    name: string;
    flag?: string;
}

export const SUPPORTED_CURRENCIES: CurrencyItem[] = [
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'THB', symbol: '฿', name: 'Thai Baht' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
    { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar' },
    { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
];

interface CurrencyState {
    selectedCurrency: string | null;
    setCurrency: (currency: string) => void;
    initializeDefault: (defaultCurrency: string) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
    persist(
        (set, get) => ({
            selectedCurrency: null,

            setCurrency: (currency: string) => {
                const normalized = (currency || 'EUR').toUpperCase();
                // Set cookie for potential SSR / middleware reading
                if (typeof document !== 'undefined') {
                    document.cookie = `app_currency=${normalized}; path=/; max-age=31536000; SameSite=Lax`;
                }
                set({ selectedCurrency: normalized });
            },

            initializeDefault: (defaultCurrency: string) => {
                // Only set if not already set by user in localStorage
                if (!get().selectedCurrency && defaultCurrency) {
                    set({ selectedCurrency: defaultCurrency.toUpperCase() });
                }
            },
        }),
        {
            name: 'app-currency-storage',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
