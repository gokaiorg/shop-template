"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Category, Product } from "@/types/database";
import { Pencil, GripVertical, Filter } from "lucide-react";
import { getLocalizedField } from "@/lib/i18n";
import { formatPrice } from "@/lib/currency";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, writeBatch } from "firebase/firestore";
import { reorderProducts } from "@/actions/admin";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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
    categories?: Category[];
    currency: string;
    lang: string;
}

export function ProductTable({
    products: initialProducts,
    categories: initialCategories = [],
    currency,
    lang,
}: ProductTableProps) {
    const router = useRouter();
    const [products, setProducts] = useState<ProductWithCategories[]>(initialProducts);
    const [selectedCategory, setSelectedCategory] = useState<string>("all");

    useEffect(() => {
        setProducts(initialProducts);
    }, [initialProducts]);

    // Gather unique available categories
    const availableCategories = useMemo(() => {
        if (initialCategories && initialCategories.length > 0) {
            return initialCategories;
        }
        const map = new Map<string, Category>();
        products.forEach((p) => {
            p.categories?.forEach((c) => {
                if (c && c.id && !map.has(c.id)) {
                    map.set(c.id, c);
                }
            });
        });
        return Array.from(map.values());
    }, [initialCategories, products]);

    // Products displayed according to active category filter, preserving manual catalog order
    const displayedProducts = useMemo(() => {
        if (selectedCategory === "all") {
            return products;
        }
        return products.filter((p) => {
            return (
                p.categoryIds?.includes(selectedCategory) ||
                p.categories?.some((c: any) => c.id === selectedCategory)
            );
        });
    }, [products, selectedCategory]);

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

        const oldFilteredIndex = displayedProducts.findIndex((p) => p.id === active.id);
        const newFilteredIndex = displayedProducts.findIndex((p) => p.id === over.id);
        if (oldFilteredIndex === -1 || newFilteredIndex === -1) return;

        // Reorder within the filtered subset
        const reorderedFiltered = arrayMove(displayedProducts, oldFilteredIndex, newFilteredIndex);

        // Snapshot previous state for rollback on error
        const previousProducts = [...products];
        let newFullProducts: ProductWithCategories[];

        if (selectedCategory === "all") {
            newFullProducts = reorderedFiltered.map((prod, idx) => ({
                ...prod,
                order: idx,
            }));
        } else {
            // Find global indices where filtered category items exist in the main list
            const categoryIndices: number[] = [];
            products.forEach((p, idx) => {
                const belongs =
                    p.categoryIds?.includes(selectedCategory) ||
                    p.categories?.some((c: any) => c.id === selectedCategory);
                if (belongs) {
                    categoryIndices.push(idx);
                }
            });

            // Replace those slots in global array with the newly reordered filtered items
            newFullProducts = [...products];
            categoryIndices.forEach((globalIndex, i) => {
                newFullProducts[globalIndex] = reorderedFiltered[i];
            });

            // Re-assign sequential orders across the entire catalog
            newFullProducts = newFullProducts.map((prod, idx) => ({
                ...prod,
                order: idx,
            }));
        }

        setProducts(newFullProducts);

        // Find items whose order actually changed
        const changedItems: { id: string; order: number }[] = [];
        newFullProducts.forEach((prod, idx) => {
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

    const selectedCategoryObj = availableCategories.find((c) => c.id === selectedCategory);
    const selectedCategoryName = selectedCategoryObj
        ? getLocalizedField(selectedCategoryObj.name, lang) ||
          (lang === "fr" ? (selectedCategoryObj as any).nameFr : (selectedCategoryObj as any).nameEn) ||
          selectedCategoryObj.id
        : "";

    return (
        <div className="space-y-4">
            {/* Category Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg border border-border/60">
                <div className="flex items-center gap-2.5 flex-wrap">
                    <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span className="text-xs sm:text-sm font-medium text-foreground whitespace-nowrap">
                        {lang === "fr" ? "Filtrer par catégorie :" : "Filter by category:"}
                    </span>
                    <div className="w-64">
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="h-8 text-xs sm:text-sm bg-background">
                                <SelectValue placeholder={lang === "fr" ? "Toutes les catégories" : "All categories"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    {lang === "fr" ? "Toutes les catégories" : "All categories"} ({products.length})
                                </SelectItem>
                                {availableCategories.map((cat) => {
                                    const count = products.filter(
                                        (p) =>
                                            p.categoryIds?.includes(cat.id) ||
                                            p.categories?.some((c: any) => c.id === cat.id)
                                    ).length;
                                    const name =
                                        getLocalizedField(cat.name, lang) ||
                                        (lang === "fr" ? (cat as any).nameFr : (cat as any).nameEn) ||
                                        cat.id;
                                    return (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {name} ({count})
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedCategory !== "all" && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedCategory("all")}
                            className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                            {lang === "fr" ? "Effacer le filtre" : "Clear filter"}
                        </Button>
                    )}
                </div>

                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                    <span>
                        {selectedCategory !== "all"
                            ? lang === "fr"
                                ? `Réorganisation active pour « ${selectedCategoryName} » (${displayedProducts.length})`
                                : `Reordering active for "${selectedCategoryName}" (${displayedProducts.length})`
                            : lang === "fr"
                            ? "Glissez-déposez les poignées pour réorganiser le catalogue"
                            : "Drag & drop handles to reorder the catalog"}
                    </span>
                </div>
            </div>

            {/* Products Table with Drag and Drop */}
            <div className="bg-background border rounded-lg p-0 overflow-hidden shadow-xs">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                            <tr>
                                <th className="px-4 py-3 w-12 text-center" aria-label="Order Handle"></th>
                                <th className="px-6 py-3">{lang === "fr" ? "Nom" : "Name"}</th>
                                <th className="px-6 py-3">{lang === "fr" ? "Catégories" : "Categories"}</th>
                                <th className="px-6 py-3">{lang === "fr" ? "Statut" : "Status"}</th>
                                <th className="px-6 py-3">{lang === "fr" ? "Prix" : "Price"}</th>
                                <th className="px-6 py-3">{lang === "fr" ? "Stock" : "Stock"}</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <SortableContext
                            items={displayedProducts.map((p) => p.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <tbody>
                                {displayedProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                                            {selectedCategory !== "all"
                                                ? lang === "fr"
                                                    ? "Aucun produit dans cette catégorie."
                                                    : "No products in this category."
                                                : lang === "fr"
                                                ? "Aucun produit trouvé. Créez un nouveau produit."
                                                : "No products found. Generate demo data or create a new product."}
                                        </td>
                                    </tr>
                                ) : (
                                    displayedProducts.map((product) => (
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
        </div>
    );
}
