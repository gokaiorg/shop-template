"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Category } from "@/types/database";
import { Pencil, GripVertical, ExternalLink, Search } from "lucide-react";
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
    catalogSlug?: string;
}

function SortableCategoryRow({ category, lang, catalogSlug = 'shop' }: SortableCategoryRowProps) {
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

    const status = category.status || "published";
    const isPublished = status === "published" || status === "publié";
    const rawCategorySlug = getLocalizedField(category.slug, lang) || (lang === 'fr' ? category.slugFr : category.slugEn) || "unknown";
    const displaySlug = rawCategorySlug.startsWith('/') ? rawCategorySlug : `/${rawCategorySlug}`;
    const cleanSlug = rawCategorySlug.replace(/^\/+/, '') || category.id;

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={`border-b last:border-0 transition-colors ${
                isDragging ? "bg-muted/40 shadow-sm" : "hover:bg-muted/20"
            }`}
        >
            <td className="px-4 py-4 w-12 text-center whitespace-nowrap">
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
            <td className="px-6 py-4 text-muted-foreground font-mono text-xs whitespace-nowrap">
                {displaySlug}
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                    isPublished
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>
                    {status}
                </span>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                {category._count?.products ?? 0}
            </td>
            <td className="px-6 py-4 text-muted-foreground text-xs whitespace-nowrap">
                {category.createdAt ? new Date(category.createdAt).toLocaleDateString(lang) : 'N/A'}
            </td>
            <td className="px-6 py-4 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="text-muted-foreground hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-colors"
                        title={lang === 'fr' ? 'Voir sur le site' : 'View on website'}
                    >
                        <Link href={`/${lang}/${catalogSlug}/${cleanSlug}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="text-muted-foreground hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-colors"
                        title={lang === 'fr' ? 'Modifier la catégorie' : 'Edit category'}
                    >
                        <Link href={`/${lang}/admin/categories/${category.id}/edit`}>
                            <Pencil className="w-4 h-4" />
                        </Link>
                    </Button>
                </div>
            </td>
        </tr>
    );
}

interface CategoryTableProps {
    categories: CategoryWithCount[];
    lang: string;
    catalogSlug?: string;
}

export function CategoryTable({ categories: initialCategories, lang, catalogSlug = 'shop' }: CategoryTableProps) {
    const router = useRouter();
    const [categories, setCategories] = useState<CategoryWithCount[]>(initialCategories);
    const [searchQuery, setSearchQuery] = useState<string>("");

    useEffect(() => {
        setCategories(initialCategories);
    }, [initialCategories]);

    const displayedCategories = useMemo(() => {
        if (!searchQuery.trim()) return categories;
        const query = searchQuery.toLowerCase().trim();
        return categories.filter((c) => {
            const name = (getLocalizedField(c.name, lang) || (lang === 'fr' ? (c as any).nameFr : (c as any).nameEn) || '').toLowerCase();
            const slug = (getLocalizedField(c.slug, lang) || (lang === 'fr' ? (c as any).slugFr : (c as any).slugEn) || (typeof c.slug === 'string' ? c.slug : '')).toLowerCase();
            return name.includes(query) || slug.includes(query);
        });
    }, [categories, searchQuery, lang]);

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

        const oldIndex = displayedCategories.findIndex((c) => c.id === active.id);
        const newIndex = displayedCategories.findIndex((c) => c.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        // Snapshot previous state for rollback on error
        const previousCategories = [...categories];
        const reorderedFiltered = arrayMove(displayedCategories, oldIndex, newIndex);

        let reordered: CategoryWithCount[];
        if (!searchQuery.trim()) {
            reordered = reorderedFiltered.map((cat, idx) => ({
                ...cat,
                order: idx,
            }));
        } else {
            const displayedIds = new Set(displayedCategories.map((c) => c.id));
            const categoryIndices: number[] = [];
            categories.forEach((c, idx) => {
                if (displayedIds.has(c.id)) {
                    categoryIndices.push(idx);
                }
            });

            reordered = [...categories];
            categoryIndices.forEach((globalIndex, i) => {
                reordered[globalIndex] = reorderedFiltered[i];
            });

            reordered = reordered.map((cat, idx) => ({
                ...cat,
                order: idx,
            }));
        }
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
        <div className="space-y-4">
            {/* Category Table Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg border border-border/60">
                <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder={lang === "fr" ? "Rechercher par nom..." : "Search by name..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 h-8 text-xs sm:text-sm bg-background"
                        />
                    </div>
                    {searchQuery && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSearchQuery("")}
                            className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                            {lang === "fr" ? "Effacer" : "Clear"}
                        </Button>
                    )}
                </div>

                <div className="text-xs text-muted-foreground flex items-center gap-1.5 shrink-0">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 animate-pulse" />
                    <span>
                        {lang === "fr"
                            ? "Glissez-déposez les poignées pour réorganiser"
                            : "Drag & drop handles to reorder"}
                    </span>
                </div>
            </div>

            {/* Table Container */}
            <div className="bg-background border rounded-lg p-0 overflow-x-auto shadow-xs">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <table className="w-full text-sm text-left min-w-[700px]">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                            <tr>
                                <th className="px-4 py-3 w-12 text-center whitespace-nowrap" aria-label="Order Handle"></th>
                                <th className="px-6 py-3 whitespace-nowrap">{lang === "fr" ? "Nom" : "Name"}</th>
                                <th className="px-6 py-3 whitespace-nowrap">Slug (URL)</th>
                                <th className="px-6 py-3 whitespace-nowrap">{lang === "fr" ? "Statut" : "Status"}</th>
                                <th className="px-6 py-3 whitespace-nowrap">{lang === "fr" ? "Nombre de produits" : "Products Count"}</th>
                                <th className="px-6 py-3 whitespace-nowrap">{lang === "fr" ? "Date de création" : "Created At"}</th>
                                <th className="px-6 py-3 text-right whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <SortableContext
                            items={displayedCategories.map((c) => c.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <tbody>
                                {displayedCategories.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                                            {searchQuery
                                                ? lang === "fr"
                                                    ? "Aucune catégorie ne correspond à votre recherche."
                                                    : "No categories match your search."
                                                : lang === "fr"
                                                    ? "Aucune catégorie trouvée. Créez une nouvelle catégorie."
                                                    : "No categories found. Create a new category."}
                                        </td>
                                    </tr>
                                ) : (
                                    displayedCategories.map((category) => (
                                        <SortableCategoryRow
                                            key={category.id}
                                            category={category}
                                            lang={lang}
                                            catalogSlug={catalogSlug}
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
