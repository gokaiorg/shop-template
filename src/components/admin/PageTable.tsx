"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Page } from "@/types/database";
import { Pencil, GripVertical, ExternalLink, Globe } from "lucide-react";
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
                /pages/{displaySlug}
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
                        <Link href={`/${lang}/pages/${displaySlug}`} target="_blank" rel="noopener noreferrer">
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

    useEffect(() => {
        setPages(initialPages);
    }, [initialPages]);

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

        const oldIndex = pages.findIndex((p) => p.id === active.id);
        const newIndex = pages.findIndex((p) => p.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return;

        const previousPages = [...pages];

        const reordered = arrayMove(pages, oldIndex, newIndex).map((p, idx) => ({
            ...p,
            order: idx,
        }));
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
                            <th className="px-6 py-3 whitespace-nowrap">{lang === 'fr' ? 'Titre' : 'Title'}</th>
                            <th className="px-6 py-3 whitespace-nowrap">Slug (URL)</th>
                            <th className="px-6 py-3 whitespace-nowrap">{lang === 'fr' ? 'Statut' : 'Status'}</th>
                            <th className="px-6 py-3 whitespace-nowrap">Navigation</th>
                            <th className="px-6 py-3 whitespace-nowrap">{lang === 'fr' ? 'Dernière mise à jour' : 'Last Updated'}</th>
                            <th className="px-6 py-3 text-right whitespace-nowrap">Actions</th>
                        </tr>
                    </thead>
                    <SortableContext
                        items={pages.map((p) => p.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <tbody>
                            {pages.map((page) => (
                                <SortablePageRow key={page.id} page={page} lang={lang} />
                            ))}
                        </tbody>
                    </SortableContext>
                </table>
            </DndContext>
        </div>
    );
}
