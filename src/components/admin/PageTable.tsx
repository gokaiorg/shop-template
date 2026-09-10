"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Page } from "@/types/database";
import { Pencil, GripVertical, ExternalLink, Globe, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getLocalizedField } from "@/lib/i18n";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { doc, writeBatch } from "firebase/firestore";
import { reorderPages } from "@/actions/admin";

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

interface SortablePageRowProps {
    page: Page;
    lang: string;
}

function SortablePageRow({ page, lang }: SortablePageRowProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: page.id });

    const style: React.CSSProperties = {
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        position: isDragging ? "relative" : undefined,
        opacity: isDragging ? 0.5 : 1,
    };

    const displaySlug = getLocalizedField(page.slug, lang) || (typeof page.slug === 'string' ? page.slug : page.id);
    const title = getLocalizedField(page.title, lang) || (lang === 'fr' ? page.title_fr : page.title_en) || displaySlug;
    const status = page.status || "draft";
    const isPublished = (status as string) === "published" || (status as string) === "publié";

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
                {title}
            </td>
            <td className="px-6 py-4 font-mono text-xs text-muted-foreground whitespace-nowrap">
                /{displaySlug}
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
                <div className="flex gap-1.5 whitespace-nowrap">
                    {page.showInHeader && (
                        <Badge variant="outline" className="text-[10px]">
                            Header
                        </Badge>
                    )}
                    {page.showInFooter && (
                        <Badge variant="outline" className="text-[10px]">
                            Footer
                        </Badge>
                    )}
                    {!page.showInHeader && !page.showInFooter && (
                        <span className="text-xs text-muted-foreground">-</span>
                    )}
                </div>
            </td>
            <td className="px-6 py-4 text-xs text-muted-foreground whitespace-nowrap">
                {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString(lang) : 'N/A'}
            </td>
            <td className="px-6 py-4 text-right whitespace-nowrap">
                <div className="flex items-center justify-end gap-1 whitespace-nowrap">
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="text-muted-foreground hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-colors"
                        title={lang === 'fr' ? 'Voir sur le site' : 'View public page'}
                    >
                        <Link href={`/${lang}/${displaySlug}`} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                        </Link>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        className="text-muted-foreground hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-colors"
                        title={lang === 'fr' ? 'Modifier la page' : 'Edit page'}
                    >
                        <Link href={`/${lang}/admin/pages/${page.id}/edit`}>
                            <Pencil className="w-4 h-4" />
                        </Link>
                    </Button>
                </div>
            </td>
        </tr>
    );
}

interface PageTableProps {
    pages: Page[];
    lang: string;
}

export function PageTable({ pages: initialPages, lang }: PageTableProps) {
    const router = useRouter();
    const [pages, setPages] = useState<Page[]>(initialPages);
    const [searchQuery, setSearchQuery] = useState<string>("");

    useEffect(() => {
        setPages(initialPages);
    }, [initialPages]);

    const displayedPages = useMemo(() => {
        if (!searchQuery.trim()) return pages;
        const query = searchQuery.toLowerCase().trim();
        return pages.filter((p) => {
            const title = (getLocalizedField(p.title, lang) || (lang === 'fr' ? (p as any).title_fr : (p as any).title_en) || '').toLowerCase();
            const slug = (getLocalizedField(p.slug, lang) || (typeof p.slug === 'string' ? p.slug : p.id) || '').toLowerCase();
            return title.includes(query) || slug.includes(query);
        });
    }, [pages, searchQuery, lang]);

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

        const oldIndex = displayedPages.findIndex((p) => p.id === active.id);
        const newIndex = displayedPages.findIndex((p) => p.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const previousPages = [...pages];
        const reorderedFiltered = arrayMove(displayedPages, oldIndex, newIndex);

        let reordered: Page[];
        if (!searchQuery.trim()) {
            reordered = reorderedFiltered.map((p, idx) => ({
                ...p,
                order: idx,
            }));
        } else {
            const displayedIds = new Set(displayedPages.map((p) => p.id));
            const subsetIndices: number[] = [];
            pages.forEach((p, idx) => {
                if (displayedIds.has(p.id)) {
                    subsetIndices.push(idx);
                }
            });
            reordered = [...pages];
            subsetIndices.forEach((globalIndex, i) => {
                reordered[globalIndex] = reorderedFiltered[i];
            });
            reordered = reordered.map((p, idx) => ({
                ...p,
                order: idx,
            }));
        }
        setPages(reordered);

        const changedItems: { id: string; order: number }[] = [];
        reordered.forEach((p, idx) => {
            const prev = previousPages.find((prevP) => prevP.id === p.id);
            if (!prev || prev.order !== idx) {
                changedItems.push({ id: p.id, order: idx });
            }
        });

        if (changedItems.length === 0) return;

        try {
            const batch = writeBatch(db);
            changedItems.forEach(({ id, order }) => {
                const pageRef = doc(db, "pages", id);
                batch.update(pageRef, { order });
            });

            await batch.commit();
            toast.success(
                lang === "fr"
                    ? "Ordre des pages mis à jour avec succès !"
                    : "Page order updated successfully!"
            );
            router.refresh();
        } catch (clientError: any) {
            console.warn("Client batch write failed, attempting server action fallback:", clientError);
            try {
                const res = await reorderPages(changedItems);
                if (res.success) {
                    toast.success(
                        lang === "fr"
                            ? "Ordre des pages mis à jour avec succès !"
                            : "Page order updated successfully!"
                    );
                    router.refresh();
                } else {
                    throw new Error(res.error || "Failed to update order");
                }
            } catch (serverError: any) {
                console.error("Reorder pages error:", serverError);
                toast.error(
                    lang === "fr"
                        ? "Échec de la réorganisation des pages."
                        : "Failed to update page order."
                );
                setPages(previousPages);
            }
        }
    };

    if (pages.length === 0) {
        return (
            <div className="bg-background border rounded-lg p-12 text-center text-muted-foreground shadow-sm">
                <Globe className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                <p className="font-medium">{lang === 'fr' ? 'Aucune page personnalisée.' : 'No pages created yet.'}</p>
                <p className="text-xs text-muted-foreground mt-1">
                    {lang === 'fr' ? 'Cliquez sur "Créer une page" pour ajouter une page.' : 'Click "Create Page" to create your first content page.'}
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Pages Table Toolbar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-muted/30 rounded-lg border border-border/60">
                <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Search Input */}
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

            {/* Pages Table with Drag and Drop */}
            <div className="bg-background border rounded-lg p-0 overflow-x-auto shadow-sm">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <table className="w-full text-sm text-left min-w-[750px]">
                        <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                            <tr>
                                <th className="px-4 py-3 w-12 text-center whitespace-nowrap">
                                    <span className="sr-only">{lang === 'fr' ? 'Ordre' : 'Order'}</span>
                                </th>
                                <th className="px-6 py-3 whitespace-nowrap">{lang === 'fr' ? 'Nom' : 'Name'}</th>
                                <th className="px-6 py-3 whitespace-nowrap">Slug (URL)</th>
                                <th className="px-6 py-3 whitespace-nowrap">{lang === 'fr' ? 'Statut' : 'Status'}</th>
                                <th className="px-6 py-3 whitespace-nowrap">Navigation</th>
                                <th className="px-6 py-3 whitespace-nowrap">{lang === 'fr' ? 'Dernière mise à jour' : 'Last Updated'}</th>
                                <th className="px-6 py-3 text-right whitespace-nowrap">Actions</th>
                            </tr>
                        </thead>
                        <SortableContext
                            items={displayedPages.map((p) => p.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <tbody>
                                {displayedPages.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-muted-foreground">
                                            {searchQuery
                                                ? lang === "fr"
                                                    ? "Aucune page ne correspond à votre recherche."
                                                    : "No pages match your search."
                                                : lang === "fr"
                                                    ? "Aucune page personnalisée."
                                                    : "No pages created yet."}
                                        </td>
                                    </tr>
                                ) : (
                                    displayedPages.map((page) => (
                                        <SortablePageRow key={page.id} page={page} lang={lang} />
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
