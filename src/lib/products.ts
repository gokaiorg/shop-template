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
