import Stripe from "stripe";
import { getIsCartEnabled } from "@/config/brand.config";

let stripeInstance: Stripe | null = null;

/**
 * Returns the Stripe SDK instance only if the cart/e-commerce feature is enabled.
 * Prevents runtime 500 crashes and unhandled exceptions on showcase/portfolio sites without Stripe keys.
 */
export function getStripe(): Stripe | null {
    if (!getIsCartEnabled()) {
        return null;
    }

    if (!stripeInstance) {
        const apiKey = process.env.STRIPE_SECRET_KEY;
        if (!apiKey) {
            console.warn("[STRIPE_INIT_WARNING] STRIPE_SECRET_KEY is not defined, but cart is enabled.");
            return null;
        }

        stripeInstance = new Stripe(apiKey, {
            apiVersion: "2026-02-25.clover",
            typescript: true,
        });
    }

    return stripeInstance;
}

// Proxy wrapper for backward compatibility
export const stripe = new Proxy({} as Stripe, {
    get(_target, prop: keyof Stripe) {
        const instance = getStripe();
        if (!instance) {
            throw new Error("Stripe is not available because ENABLE_CART is false or STRIPE_SECRET_KEY is missing.");
        }
        return (instance as any)[prop];
    },
});
