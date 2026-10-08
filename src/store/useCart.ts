import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product } from '@/types/database';

export interface CartItem extends Product {
    quantity: number;
}

interface CartState {
    items: CartItem[];
    addItem: (product: Product, quantity?: number) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
}

export const useCart = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],
            totalItems: 0,
            totalPrice: 0,

            addItem: (product, quantity = 1) => {
                set((state) => {
                    const rawStock = product.stock;
                    const maxStock = typeof rawStock === 'number' && !isNaN(rawStock)
                        ? Math.floor(rawStock)
                        : Infinity;

                    if (maxStock <= 0) {
                        return state;
                    }

                    const existingItem = state.items.find((item) => item.id === product.id);
                    let newItems;

                    if (existingItem) {
                        const newQuantity = Math.min(existingItem.quantity + quantity, maxStock);
                        if (newQuantity === existingItem.quantity) {
                            return state;
                        }
                        newItems = state.items.map((item) =>
                            item.id === product.id
                                ? { ...item, quantity: newQuantity }
                                : item
                        );
                    } else {
                        const newQuantity = Math.min(Math.max(1, quantity), maxStock);
                        newItems = [...state.items, { ...product, quantity: newQuantity }];
                    }

                    const totalItems = newItems.reduce((total, item) => total + item.quantity, 0);
                    const totalPrice = newItems.reduce((total, item) => total + item.price * item.quantity, 0);

                    return {
                        items: newItems,
                        totalItems,
                        totalPrice,
                    };
                });
            },

            removeItem: (productId) => {
                set((state) => {
                    const newItems = state.items.filter((item) => item.id !== productId);

                    const totalItems = newItems.reduce((total, item) => total + item.quantity, 0);
                    const totalPrice = newItems.reduce((total, item) => total + item.price * item.quantity, 0);

                    return {
                        items: newItems,
                        totalItems,
                        totalPrice,
                    };
                });
            },

            updateQuantity: (productId, quantity) => {
                set((state) => {
                    if (quantity <= 0) {
                        const newItems = state.items.filter((item) => item.id !== productId);
                        const totalItems = newItems.reduce((total, item) => total + item.quantity, 0);
                        const totalPrice = newItems.reduce((total, item) => total + item.price * item.quantity, 0);
                        return {
                            items: newItems,
                            totalItems,
                            totalPrice,
                        };
                    }

                    const existingItem = state.items.find((item) => item.id === productId);
                    const rawStock = existingItem?.stock;
                    const maxStock = typeof rawStock === 'number' && !isNaN(rawStock)
                        ? Math.floor(rawStock)
                        : Infinity;

                    const safeQuantity = Math.min(quantity, maxStock);

                    const newItems = state.items.map((item) =>
                        item.id === productId ? { ...item, quantity: safeQuantity } : item
                    );

                    const totalItems = newItems.reduce((total, item) => total + item.quantity, 0);
                    const totalPrice = newItems.reduce((total, item) => total + item.price * item.quantity, 0);

                    return {
                        items: newItems,
                        totalItems,
                        totalPrice,
                    };
                });
            },

            clearCart: () => set({ items: [], totalItems: 0, totalPrice: 0 }),
        }),
        {
            name: 'shopping-cart-storage', // key in localStorage
        }
    )
);
