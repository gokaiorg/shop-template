import { BrandConfig } from './types';
import { shopTemplateBrand } from './brands/shop-template';
import { artFateBrand } from './brands/art-fate';
import { gokaiLabsBrand } from './brands/gokai-labs';
import { greenGhostBrand } from './brands/green-ghost';

export const BRANDS: Record<string, BrandConfig> = {
    'shop-template': shopTemplateBrand,
    'art-fate': artFateBrand,
    'gokai-labs': gokaiLabsBrand,
    'green-ghost': greenGhostBrand,
};

/**
 * Resolves active brand identifier dynamically from server runtime environment.
 */
export function getActiveBrandKey(): string {
    return (
        process.env.BRAND ||
        process.env.NEXT_PUBLIC_BRAND ||
        'shop-template'
    )
        .toLowerCase()
        .trim();
}

/**
 * Get active brand configuration.
 * Resolves brand based on runtime `BRAND` or `NEXT_PUBLIC_BRAND` environment variable,
 * or falls back to the default brand (`shop-template`).
 */
export function getActiveBrand(): BrandConfig {
    const brandKey = getActiveBrandKey();
    return BRANDS[brandKey] || shopTemplateBrand;
}

/**
 * Resolves whether the cart feature flag is enabled dynamically at server runtime.
 */
export function getIsCartEnabled(): boolean {
    const flag = process.env.ENABLE_CART || process.env.NEXT_PUBLIC_ENABLE_CART;
    return flag !== "false";
}

export const brandConfig: BrandConfig = new Proxy({} as BrandConfig, {
    get(_target, prop: keyof BrandConfig) {
        const active = getActiveBrand();
        return active[prop];
    },
});

export default brandConfig;
