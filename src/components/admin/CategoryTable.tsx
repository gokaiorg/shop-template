"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Category } from "@/types/database";
import { Pencil, GripVertical } from "lucide-react";
import { getLocalizedField } from "@/lib/i18n";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, writeBatch } from "firebase/firestore";
import { reorderCategories } from "@/actions/admin";

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

export interface CategoryWithCount extends Category {
    _count?: { products: number };
}

interface SortableCategoryRowProps {
    category: CategoryWithCount;
    lang: string;
}

function SortableCategoryRow({ category, lang }: SortableCategoryRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: category.id });

    const style: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        position: isDragging ? "relative" : undefined,
        opacity: isDragging ? 0.5 : 1,
    };

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
                {getLocalizedField(category.name, lang) || (lang === 'fr' ? category.nameFr : category.nameEn) || "Unnamed"}
            </td>
            <td className="px-6 py-4 text-muted-foreground font-mono text-xs">
                {getLocalizedField(category.slug, lang) || (lang === 'fr' ? category.slugFr : category.slugEn) || "unknown"}
            </td>
            <td className="px-6 py-4">
                {category._count?.products ?? 0}
            </td>
            <td className="px-6 py-4 text-muted-foreground text-xs">
                {category.createdAt ? new Date(category.createdAt).toLocaleDateString(lang) : 'N/A'}
            </td>
            <td className="px-6 py-4 text-right">
                <Button variant="ghost" size="icon" asChild>
                    <Link href={`/${lang}/admin/categories/${category.id}/edit`}>
                        <Pencil className="w-4 h-4" />
                    </Link>
                </Button>
            </td>
        </tr>
    );
}

interface CategoryTableProps {
    categories: CategoryWithCount[];
    lang: string;
}

export function CategoryTable({ categories: initialCategories, lang }: CategoryTableProps) {
    const router = useRouter();
    const [categories, setCategories] = useState<CategoryWithCount[]>(initialCategories);

    useEffect(() => {
        setCategories(initialCategories);
    }, [initialCategories]);

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

        const oldIndex = categories.findIndex((c) => c.id === active.id);
        const newIndex = categories.findIndex((c) => c.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        // Snapshot previous state for rollback on error
        const previousCategories = [...categories];

        // Optimistic UI state update
        const reordered = arrayMove(categories, oldIndex, newIndex).map((cat, idx) => ({
            ...cat,
            order: idx,
        }));
        setCategories(reordered);

        // Find items whose order actually changed
        const changedItems: { id: string; order: number }[] = [];
        reordered.forEach((cat, idx) => {
            const prev = previousCategories.find((c) => c.id === cat.id);
            if (!prev || prev.order !== idx) {
                changedItems.push({ id: cat.id, order: idx });
            }
        });

        if (changedItems.length === 0) return;

        try {
            // Firestore Batch Write
            const batch = writeBatch(db);
            changedItems.forEach(({ id, order }) => {
                const categoryRef = doc(db, "categories", id);
                batch.update(categoryRef, { order });
            });

            await batch.commit();
            toast.success(
                lang === "fr"
                    ? "Ordre des catégories mis à jour avec succès !"
                    : "Category order updated successfully!"
            );
            router.refresh();
        } catch (clientError: any) {
            console.warn("Client batch write failed, attempting server action fallback:", clientError);
            try {
                const res = await reorderCategories(changedItems);
                if (res.success) {
                    toast.success(
                        lang === "fr"
                            ? "Ordre des catégories mis à jour avec succès !"
                            : "Category order updated successfully!"
                    );
                    router.refresh();
                } else {
                    setCategories(previousCategories);
                    toast.error(
                        res.error ||
                        (lang === "fr"
                            ? "Échec de l'enregistrement de l'ordre des catégories"
                            : "Failed to update category order")
                    );
                }
            } catch (serverError: any) {
                console.error("Server action fallback failed:", serverError);
                setCategories(previousCategories);
                toast.error(
                    lang === "fr"
                        ? "Erreur lors de l'enregistrement de l'ordre"
                        : "Failed to update category order"
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
                            <th className="px-6 py-3">Slug</th>
                            <th className="px-6 py-3">Products Count</th>
                            <th className="px-6 py-3">Created At</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <SortableContext
                        items={categories.map((c) => c.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <tbody>
                            {categories.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">
                                        {lang === "fr"
                                            ? "Aucune catégorie trouvée. Créez une nouvelle catégorie."
                                            : "No categories found. Create a new category."}
                                    </td>
                                </tr>
                            ) : (
                                categories.map((category) => (
                                    <SortableCategoryRow
                                        key={category.id}
                                        category={category}
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
