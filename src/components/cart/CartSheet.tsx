"use client";

import { useCart } from "@/store/useCart";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from "@/components/ui/sheet";
import { ShoppingCart, Trash2, Plus, Minus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useMounted } from "@/hooks/useMounted";
import { createCheckoutSession } from "@/actions/checkout";
import { useParams } from "next/navigation";
import { useState } from "react";

export function CartSheet() {
    // Optimization: Use individual selectors to prevent unnecessary re-renders when other parts of the cart state change
    const items = useCart(state => state.items);
    const totalItems = useCart(state => state.totalItems);
    const totalPrice = useCart(state => state.totalPrice);
    const removeItem = useCart(state => state.removeItem);
    const updateQuantity = useCart(state => state.updateQuantity);

    const params = useParams();
    const lang = (params?.lang as string) || "en";
    const [isLoading, setIsLoading] = useState(false);

    // useMounted hook to prevent hydration mismatch since we are using localStorage
    const mounted = useMounted();

    const handleCheckout = async () => {
        try {
            setIsLoading(true);
            const { url } = await createCheckoutSession(items, lang);
            if (url) {
                window.location.href = url;
            }
        } catch (error) {
            console.error("Checkout error:", error);
            // You might want to add a toast notification here
        } finally {
            setIsLoading(false);
        }
    };

    if (!mounted) {
        return (
            <div className="relative p-2">
                <ShoppingCart className="h-5 w-5" />
            </div>
        );
    }

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative cursor-pointer">
                    <ShoppingCart className="h-5 w-5" />
                    {totalItems > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            {totalItems}
                        </span>
                    )}
                    <span className="sr-only">Open cart</span>
                </Button>
            </SheetTrigger>
            <SheetContent className="flex w-full flex-col sm:max-w-lg overflow-y-auto p-6">
                <SheetHeader className="mb-6">
                    <SheetTitle>Shopping Cart</SheetTitle>
                </SheetHeader>

                <div className="flex flex-1 flex-col gap-4">
                    {items.length === 0 ? (
                        <div className="flex flex-1 flex-col items-center justify-center gap-4">
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                                <ShoppingCart className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
                            </div>
                            <p className="text-lg font-medium">Your cart is empty</p>
                            <SheetClose asChild>
                                <Button variant="outline" className="mt-2 cursor-pointer">
                                    Continue Shopping
                                </Button>
                            </SheetClose>
                        </div>
                    ) : (
                        <div className="flex flex-1 flex-col gap-6">
                            {items.map((item) => {
                                const imageUrl = item.images && item.images.length > 0
                                    ? item.images[0]
                                    : "https://images.unsplash.com/photo-1595246140625-573b715d11dc?q=80&w=2670&auto=format&fit=crop";

                                const itemName = lang === "fr" ? item.nameFr : item.nameEn;
                                return (
                                    <div key={item.id} className="flex items-center gap-4">
                                        <div className="relative h-16 w-16 overflow-hidden rounded-md border bg-muted">
                                            <Image
                                                src={imageUrl}
                                                alt={itemName}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />
                                        </div>
                                        <div className="flex flex-1 flex-col justify-between">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <h3 className="line-clamp-1 font-medium">
                                                        {itemName}
                                                    </h3>
                                                    <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-red-500 cursor-pointer"
                                                    onClick={() => removeItem(item.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Remove {itemName}</span>
                                                </Button>
                                            </div>

                                            <div className="mt-2 flex items-center gap-3">
                                                <div className="flex items-center rounded-md border">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-none cursor-pointer"
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        disabled={isLoading}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                        <span className="sr-only">Decrease quantity of {itemName}</span>
                                                    </Button>
                                                    <div className="flex h-8 w-8 items-center justify-center text-sm">
                                                        {item.quantity}
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-none cursor-pointer"
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        disabled={isLoading}
                                                    >
                                                        <Plus className="h-3 w-3" />
                                                        <span className="sr-only">Increase quantity of {itemName}</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {items.length > 0 && (
                    <div className="mt-auto flex flex-col gap-4 border-t pt-6">
                        <div className="flex items-center justify-between text-base font-medium">
                            <span>Total</span>
                            <span>${totalPrice.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Shipping and taxes calculated at checkout.
                        </p>
                        <Button
                            className="w-full cursor-pointer"
                            size="lg"
                            onClick={handleCheckout}
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? "Processing..." : "Checkout"}
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
