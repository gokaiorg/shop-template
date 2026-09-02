"use client";

import React, { createContext, useContext } from 'react';
import { BrandConfig } from '@/config/types';
import { shopTemplateBrand } from '@/config/brands/shop-template';

export interface BrandContextType {
    brand: BrandConfig;
    brandKey: string;
    isCartEnabled: boolean;
    supportedLocales: string[];
    defaultLocale: string;
    isMultiLocale: boolean;
    currency: string;
    defaultTheme: 'light' | 'dark' | 'system';
}

const BrandContext = createContext<BrandContextType>({
    brand: shopTemplateBrand,
    brandKey: 'shop-template',
    isCartEnabled: true,
    supportedLocales: ['en', 'fr'],
    defaultLocale: 'en',
    isMultiLocale: true,
    currency: 'THB',
    defaultTheme: 'system',
});

export function BrandProvider({
    children,
    brand,
    brandKey,
    isCartEnabled,
    supportedLocales,
    defaultLocale,
    currency = 'THB',
    defaultTheme = 'system',
}: {
    children: React.ReactNode;
    brand: BrandConfig;
    brandKey?: string;
    isCartEnabled: boolean;
    supportedLocales: string[];
    defaultLocale: string;
    currency?: string;
    defaultTheme?: 'light' | 'dark' | 'system';
}) {
    const isMulti = supportedLocales.length > 1;
    return (
        <BrandContext.Provider
            value={{
                brand: brand || shopTemplateBrand,
                brandKey: brandKey || 'shop-template',
                isCartEnabled,
                supportedLocales,
                defaultLocale,
                isMultiLocale: isMulti,
                currency,
                defaultTheme,
            }}
        >
            {children}
        </BrandContext.Provider>
    );
}

export function useBrand(): BrandContextType {
    const context = useContext(BrandContext);
    return context;
}

export function useBrandConfig(): BrandConfig {
    const { brand } = useBrand();
    return brand;
}
