"use client";

import { useCart } from "@/store/useCart";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useMounted } from "@/hooks/useMounted";

export function CartSheet() {
    const { items, totalItems, totalPrice, removeItem, updateQuantity } = useCart();
    // useMounted hook to prevent hydration mismatch since we are using localStorage
    const mounted = useMounted();

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
                <SheetHeader>
                    <SheetTitle>Shopping Cart</SheetTitle>
                </SheetHeader>

                <div className="flex flex-1 flex-col gap-4 py-6">
                    {items.length === 0 ? (
                        <div className="flex flex-1 items-center justify-center">
                            <p className="text-muted-foreground">Your cart is empty.</p>
                        </div>
                    ) : (
                        <div className="flex flex-1 flex-col gap-6">
                            {items.map((item) => {
                                const imageUrl = item.images && item.images.length > 0
                                    ? item.images[0]
                                    : "https://images.unsplash.com/photo-1595246140625-573b715d11dc?q=80&w=2670&auto=format&fit=crop";

                                return (
                                    <div key={item.id} className="flex items-center gap-4">
                                        <div className="relative h-16 w-16 overflow-hidden rounded-md border bg-muted">
                                            <Image
                                                src={imageUrl}
                                                alt={item.nameEn}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />
                                        </div>
                                        <div className="flex flex-1 flex-col justify-between">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex flex-col gap-1">
                                                    <h3 className="line-clamp-1 font-medium">{item.nameEn}</h3>
                                                    <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-red-500 cursor-pointer"
                                                    onClick={() => removeItem(item.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    <span className="sr-only">Remove item</span>
                                                </Button>
                                            </div>

                                            <div className="mt-2 flex items-center gap-3">
                                                <div className="flex items-center rounded-md border">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-none cursor-pointer"
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                    >
                                                        <Minus className="h-3 w-3" />
                                                    </Button>
                                                    <div className="flex h-8 w-8 items-center justify-center text-sm">
                                                        {item.quantity}
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 rounded-none cursor-pointer"
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                    >
                                                        <Plus className="h-3 w-3" />
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
                        <Button className="w-full cursor-pointer" size="lg">
                            Checkout
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
