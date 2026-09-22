"use client";

import { useCurrency } from "@/hooks/useCurrency";
import { cn } from "@/lib/utils";

interface ProductPriceProps {
    price: number | string | null | undefined;
    locale?: string;
    className?: string;
}

/**
 * Client component that displays a product's price dynamically converted
 * to the customer's selected currency using the useCurrency hook.
 */
export function ProductPrice({ price, locale = "en", className }: ProductPriceProps) {
    const { formattedPrice } = useCurrency(price, locale);

    return <span className={cn(className)}>{formattedPrice}</span>;
}
