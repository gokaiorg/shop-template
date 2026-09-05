"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Category, Product } from "@/types/database";
import { Pencil, GripVertical } from "lucide-react";
import { getLocalizedField } from "@/lib/i18n";
import { formatPrice } from "@/lib/currency";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, writeBatch } from "firebase/firestore";
import { reorderProducts } from "@/actions/admin";

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface ProductWithCategories extends Product {
    categoryIds: string[];
    categories: Category[];
}

interface SortableProductRowProps {
    product: ProductWithCategories;
    currency: string;
    lang: string;
}

function SortableProductRow({ product, currency, lang }: SortableProductRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: product.id });

    const style: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        position: isDragging ? "relative" : undefined,
        opacity: isDragging ? 0.5 : 1,
    };

    const status = getLocalizedField(product.status, lang) || (lang === 'fr' ? product.statusFr : product.statusEn) || "draft";
    const isPublished = status === 'published' || status === 'publié';

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={`border-b last:border-0 transition-colors ${
                isDragging ? "bg-muted/40 shadow-sm" : "hover:bg-muted/20"
            }`}
        >
            <td className="px-4 py-4 w-12 text-center">
                <button
                    type="button"
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground touch-none inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    aria-label={lang === "fr" ? "Glisser pour réorganiser" : "Drag to reorder"}
                    title={lang === "fr" ? "Glisser pour réorganiser" : "Drag to reorder"}
                >
                    <GripVertical className="h-4 w-4" />
                </button>
            </td>
            <td className="px-6 py-4 font-medium">
                {getLocalizedField(product.name, lang) || (lang === 'fr' ? product.nameFr : product.nameEn) || "Unnamed"}
            </td>
            <td className="px-6 py-4 text-muted-foreground">
                <div className="flex flex-wrap gap-1">
                    {product.categories && product.categories.length > 0 ? (
                        product.categories.map((cat: any) => (
                            <span key={cat.id} className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-muted text-foreground border">
                                {getLocalizedField(cat.name, lang) || (lang === 'fr' ? cat.nameFr : cat.nameEn) || "Unnamed"}
                            </span>
                        ))
                    ) : (
                        <span className="text-xs text-muted-foreground">None</span>
                    )}
                </div>
            </td>
            <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    isPublished
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                    {status}
                </span>
            </td>
            <td className="px-6 py-4 font-medium">{formatPrice(product.price, currency, lang)}</td>
            <td className="px-6 py-4">
                {(product.stock ?? 0) > 0 ? (
                    product.stock
                ) : (
                    <Badge variant="destructive" className="text-xs">
                        Out of stock
                    </Badge>
                )}
            </td>
            <td className="px-6 py-4 text-right">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/${lang}/admin/products/${product.id}/edit`}>
                        <Pencil className="w-4 h-4" />
                    </Link>
                </Button>
            </td>
        </tr>
    );
}

interface ProductTableProps {
    products: ProductWithCategories[];
    currency: string;
    lang: string;
}

export function ProductTable({ products: initialProducts, currency, lang }: ProductTableProps) {
    const router = useRouter();
    const [products, setProducts] = useState<ProductWithCategories[]>(initialProducts);

    useEffect(() => {
        setProducts(initialProducts);
    }, [initialProducts]);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = products.findIndex((p) => p.id === active.id);
        const newIndex = products.findIndex((p) => p.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        // Snapshot previous state for rollback on error
        const previousProducts = [...products];

        // Optimistic UI state update
        const reordered = arrayMove(products, oldIndex, newIndex).map((prod, idx) => ({
            ...prod,
            order: idx,
        }));
        setProducts(reordered);

        // Find items whose order actually changed
        const changedItems: { id: string; order: number }[] = [];
        reordered.forEach((prod, idx) => {
            const prev = previousProducts.find((p) => p.id === prod.id);
            if (!prev || prev.order !== idx) {
                changedItems.push({ id: prod.id, order: idx });
            }
        });

        if (changedItems.length === 0) return;

        try {
            // Firestore Batch Write
            const batch = writeBatch(db);
            changedItems.forEach(({ id, order }) => {
                const productRef = doc(db, "products", id);
                batch.update(productRef, { order });
            });

            await batch.commit();
            toast.success(
                lang === "fr"
                    ? "Ordre des produits mis à jour avec succès !"
                    : "Product order updated successfully!"
            );
            router.refresh();
        } catch (clientError: any) {
            console.warn("Client batch write failed, attempting server action fallback:", clientError);
            try {
                const res = await reorderProducts(changedItems);
                if (res.success) {
                    toast.success(
                        lang === "fr"
                            ? "Ordre des produits mis à jour avec succès !"
                            : "Product order updated successfully!"
                    );
                    router.refresh();
                } else {
                    setProducts(previousProducts);
                    toast.error(
                        res.error ||
                        (lang === "fr"
                            ? "Échec de l'enregistrement de l'ordre des produits"
                            : "Failed to update product order")
                    );
                }
            } catch (serverError: any) {
                console.error("Server action fallback failed:", serverError);
                setProducts(previousProducts);
                toast.error(
                    lang === "fr"
                        ? "Erreur lors de l'enregistrement de l'ordre"
                        : "Failed to save product order"
                );
            }
        }
    };

    return (
        <div className="bg-background border rounded-lg p-0 overflow-hidden">
            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                        <tr>
                            <th className="px-4 py-3 w-12 text-center" aria-label="Order Handle"></th>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Categories</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3">Price</th>
                            <th className="px-6 py-3">Stock</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <SortableContext
                        items={products.map((p) => p.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <tbody>
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                                        {lang === "fr"
                                            ? "Aucun produit trouvé. Créez un nouveau produit."
                                            : "No products found. Generate demo data or create a new product."}
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <SortableProductRow
                                        key={product.id}
                                        product={product}
                                        currency={currency}
                                        lang={lang}
                                    />
                                ))
                            )}
                        </tbody>
                    </SortableContext>
                </table>
            </DndContext>
        </div>
    );
}
