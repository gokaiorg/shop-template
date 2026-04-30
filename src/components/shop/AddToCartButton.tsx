"use client";

import { Button } from "@/components/ui/button";
import { Product } from "@/types/database";
import { useCart } from "@/store/useCart";
import { toast } from "sonner";

interface AddToCartButtonProps {
    product: Product;
    lang: string;
    label: string;
    title: string;
    className?: string;
    size?: "default" | "sm" | "lg" | "icon";
}

export function AddToCartButton({ product, lang, label, title, className, size = "default" }: AddToCartButtonProps) {
    const addItem = useCart(state => state.addItem);

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
