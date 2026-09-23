"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Save, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminBottomBarProps {
    // Primary Save Action
    isPending?: boolean;
    saveLabel?: string;
    savingLabel?: string;
    onSave?: () => void;

    // Secondary Action (View on website / Cancel)
    viewUrl?: string;
    viewLabel?: string;
    cancelUrl?: string;
    cancelLabel?: string;
    onCancel?: () => void;

    // Destructive Delete Action
    onDelete?: () => void | Promise<void>;
    isDeleting?: boolean;
    deleteLabel?: string;
    deleteConfirmTitle?: string;
    deleteConfirmDescription?: string;

    // Form Validation Issues / Errors
    errorsCount?: number;

    // Configuration & Style
    lang?: string;
    className?: string;
    children?: React.ReactNode;
}

/**
 * AdminBottomBar: Standardized fixed bottom action bar for admin edit views.
 * Cloned and unified from /admin/pages/[slug]/edit.
 * - Zone Gauche: Notification badge d'erreurs (ex: '5 issues') et bouton rouge destructif Delete.
 * - Zone Droite: Boutons secondaires (View on website / Cancel) et bouton d'action principal violet Save.
 */
export function AdminBottomBar({
    isPending = false,
    saveLabel = "Save",
    savingLabel,
    onSave,
    viewUrl,
    viewLabel,
    cancelUrl,
    cancelLabel,
    onCancel,
    onDelete,
    isDeleting = false,
    deleteLabel,
    deleteConfirmTitle,
    deleteConfirmDescription,
    errorsCount = 0,
    lang = "en",
    className,
    children,
}: AdminBottomBarProps) {
    const isFr = lang === "fr";

    return (
        <div
            className={cn(
                "sticky bottom-0 z-40 flex items-center justify-end gap-4 border-t border-border bg-background p-4 sm:px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] mt-auto -mx-4 sm:-mx-8",
                className
            )}
        >
            {/* Zone Gauche: Notifications d'erreurs & Action destructrice */}
            {(errorsCount > 0 || onDelete) && (
                <div className="flex items-center gap-3 mr-auto">
                    {/* Form errors / issues badge */}
                    {errorsCount > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900/60 shadow-xs animate-in fade-in duration-200">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>
                                {errorsCount} {errorsCount === 1 ? (isFr ? "erreur" : "issue") : (isFr ? "erreurs" : "issues")}
                            </span>
                        </div>
                    )}

                    {/* Destructive Delete Button */}
                    {onDelete && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    type="button"
                                    variant="destructive"
                                    disabled={isPending || isDeleting}
                                    className="cursor-pointer"
                                >
                                    <Trash2 className="mr-2 h-4 w-4 shrink-0" />
                                    <span>{deleteLabel || (isFr ? "Supprimer" : "Delete")}</span>
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>
                                        {deleteConfirmTitle ||
                                            (isFr ? "Êtes-vous absolument sûr ?" : "Are you absolutely sure?")}
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {deleteConfirmDescription ||
                                            (isFr
                                                ? "Cette action est irréversible. Cela supprimera ou réinitialisera ce bloc."
                                                : "This action cannot be undone. This will permanently delete or reset this block.")}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isDeleting}>
                                        {isFr ? "Annuler" : "Cancel"}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={onDelete}
                                        disabled={isDeleting}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                                    >
                                        {isDeleting
                                            ? (isFr ? "Suppression..." : "Deleting...")
                                            : (deleteLabel || (isFr ? "Supprimer" : "Delete"))}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            )}

            {/* Optional central custom content */}
            {children}

            {/* Zone Droite: Actions de validation et secondaires */}
            <div className="flex items-center gap-3">
                {/* Cancel secondary action */}
                {cancelUrl ? (
                    <Button
                        variant="outline"
                        asChild
                        type="button"
                        className="cursor-pointer"
                    >
                        <Link href={cancelUrl}>
                            {cancelLabel || (isFr ? "Annuler" : "Cancel")}
                        </Link>
                    </Button>
                ) : onCancel ? (
                    <Button
                        variant="outline"
                        type="button"
                        onClick={onCancel}
                        disabled={isPending || isDeleting}
                        className="cursor-pointer"
                    >
                        {cancelLabel || (isFr ? "Annuler" : "Cancel")}
                    </Button>
                ) : null}

                {/* View on website secondary action */}
                {viewUrl && (
                    <Button
                        variant="outline"
                        asChild
                        type="button"
                        className="border border-primary text-primary bg-transparent hover:bg-primary hover:text-white transition-colors cursor-pointer"
                    >
                        <Link href={viewUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4 shrink-0" />
                            <span>{viewLabel || (isFr ? "Voir sur le site" : "View on website")}</span>
                        </Link>
                    </Button>
                )}

                {/* Primary Action Button (Violet / Primary) */}
                <Button
                    type={onSave ? "button" : "submit"}
                    onClick={onSave}
                    disabled={isPending || isDeleting}
                    className="bg-primary text-primary-foreground hover:opacity-90 text-white px-6 cursor-pointer"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin shrink-0" />
                            <span>{savingLabel || (isFr ? "Enregistrement..." : "Saving...")}</span>
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4 shrink-0" />
                            <span>{saveLabel}</span>
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
