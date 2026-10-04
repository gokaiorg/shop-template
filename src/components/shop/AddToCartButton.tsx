"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Product } from "@/types/database";
import { useCart } from "@/store/useCart";
import { toast } from "sonner";
import { useBrand } from "@/components/providers/BrandProvider";
import { Minus, Plus } from "lucide-react";

interface AddToCartButtonProps {
    product: Product;
    lang: string;
    label: string;
    title: string;
    className?: string;
    size?: "default" | "sm" | "lg" | "icon";
}

export function AddToCartButton({
    product,
    lang,
    label,
    title,
    className,
    size = "default",
}: AddToCartButtonProps) {
    const { isCartEnabled } = useBrand();
    const addItem = useCart((state) => state.addItem);
    const [quantity, setQuantity] = useState<number>(1);

    if (!isCartEnabled) {
        return null;
    }

    const rawStock = product.stock;
    const stock = typeof rawStock === "number" && !isNaN(rawStock) ? rawStock : 0;
    const maxAvailable = Math.floor(stock);
    const isOutOfStock = stock <= 0 || maxAvailable <= 0;

    if (isOutOfStock) {
        return (
            <Button
                size={size}
                disabled
                className={`rounded-full shadow-xs cursor-not-allowed opacity-50 ${className || ""}`}
                aria-label={`Sold - ${title}`}
            >
                {lang === "fr" ? "Épuisé" : "Sold"}
            </Button>
        );
    }

    const handleAddToCart = () => {
        addItem(product, quantity);
        toast.success(label, {
            description: quantity > 1 ? `${quantity}x ${title}` : title,
        });
    };

    // 2. Rendu conditionnel du sélecteur : N'affichez QUE SI product.stock > 1
    if (product.stock > 1 && maxAvailable > 1) {
        return (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {/* Sélecteur de quantité */}
                <div className="inline-flex items-center justify-between sm:justify-center border border-border/80 bg-muted/40 rounded-full p-1 h-11 shrink-0 select-none">
                    <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        aria-label={lang === "fr" ? "Diminuer la quantité" : "Decrease quantity"}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-foreground hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer select-none"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <input
                        type="number"
                        min={1}
                        max={product.stock}
                        value={quantity}
                        onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (isNaN(val)) {
                                setQuantity(1);
                            } else {
                                setQuantity(Math.max(1, Math.min(maxAvailable, val)));
                            }
                        }}
                        aria-label={lang === "fr" ? "Quantité" : "Quantity"}
                        className="w-12 text-center text-sm sm:text-base font-semibold bg-transparent border-none text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none select-none"
                    />
                    <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.min(maxAvailable, q + 1))}
                        disabled={quantity >= product.stock || quantity >= maxAvailable}
                        aria-label={lang === "fr" ? "Augmenter la quantité" : "Increase quantity"}
                        className="w-9 h-9 rounded-full flex items-center justify-center text-foreground hover:bg-muted/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer select-none"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Bouton d'ajout au panier */}
                <Button
                    size={size}
                    className={`rounded-full shadow-xs cursor-pointer ${className || ""}`}
                    onClick={handleAddToCart}
                    aria-label={`${label} ${title}`}
                >
                    {label}
                </Button>
            </div>
        );
    }

    // Si product.stock <= 1, affichez uniquement le bouton "Add to cart" classique
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
