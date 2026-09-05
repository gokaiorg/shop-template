"use client";

import { Button } from "@/components/ui/button";
import { Product } from "@/types/database";
import { useCart } from "@/store/useCart";
import { toast } from "sonner";
import { useBrand } from "@/components/providers/BrandProvider";

interface AddToCartButtonProps {
    product: Product;
    lang: string;
    label: string;
    title: string;
    className?: string;
    size?: "default" | "sm" | "lg" | "icon";
}

export function AddToCartButton({ product, lang, label, title, className, size = "default" }: AddToCartButtonProps) {
    const { isCartEnabled } = useBrand();
    const addItem = useCart(state => state.addItem);

    if (!isCartEnabled) {
        return null;
    }

    const isOutOfStock = (product.stock ?? 0) <= 0;

    if (isOutOfStock) {
        return (
            <Button
                size={size}
                disabled
                className={`rounded-full shadow-xs cursor-not-allowed opacity-50 ${className || ""}`}
                aria-label={`Sold Out - ${title}`}
            >
                Sold Out
            </Button>
        );
    }

    const handleAddToCart = () => {
        addItem(product);
        toast.success(label, {
            description: title,
        });
    };

    return (
        <Button
            size={size}
            className={`rounded-full shadow-xs cursor-pointer ${className || ""}`}
            onClick={handleAddToCart}
            aria-label={`${label} ${title}`}
        >
            {label}
        </Button>
    );
}
