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
    const kService = (process.env.K_SERVICE || "").toLowerCase();
    const fbProject = (process.env.FIREBASE_PROJECT_ID || "").toLowerCase();
    
    if (kService.includes("art-fate") || fbProject.includes("art-fate")) {
        return "art-fate";
    }
    if (kService.includes("green-ghost") || fbProject.includes("green-ghost")) {
        return "green-ghost";
    }
    if (kService.includes("gokai-labs") || fbProject.includes("gokai-labs")) {
        return "gokai-labs";
    }

    if (typeof window !== "undefined") {
        const host = window.location.hostname.toLowerCase();
        if (host.includes("art-fate")) return "art-fate";
        if (host.includes("green-ghost")) return "green-ghost";
        if (host.includes("gokai-labs")) return "gokai-labs";
    }

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
 * Handles boolean string representations ("false", "0", "off", "no", "true", "1", "on", "yes").
 */
export function getIsCartEnabled(): boolean {
    const rawFlag = process.env.ENABLE_CART ?? process.env.NEXT_PUBLIC_ENABLE_CART;
    if (rawFlag !== undefined && rawFlag !== "") {
        const normalized = String(rawFlag).trim().toLowerCase();
        if (normalized === "false" || normalized === "0" || normalized === "off" || normalized === "no") {
            return false;
        }
        if (normalized === "true" || normalized === "1" || normalized === "on" || normalized === "yes") {
            return true;
        }
    }
    const brand = getActiveBrand();
    return brand.features?.cart ?? true;
}

export const brandConfig: BrandConfig = new Proxy({} as BrandConfig, {
    get(_target, prop: keyof BrandConfig) {
        const active = getActiveBrand();
        return active[prop];
    },
});

export default brandConfig;
