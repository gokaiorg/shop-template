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
 * Get active brand configuration.
 * Resolves brand based on `NEXT_PUBLIC_BRAND` or `BRAND` environment variable,
 * or falls back to the default brand (`shop-template`).
 */
export function getActiveBrand(): BrandConfig {
    const brandKey = (process.env.NEXT_PUBLIC_BRAND || process.env.BRAND || 'shop-template')
        .toLowerCase()
        .trim();
    return BRANDS[brandKey] || shopTemplateBrand;
}

export const brandConfig: BrandConfig = new Proxy({} as BrandConfig, {
    get(_target, prop: keyof BrandConfig) {
        const active = getActiveBrand();
        return active[prop];
    },
});

export default brandConfig;
