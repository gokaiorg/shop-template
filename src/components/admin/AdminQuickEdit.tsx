"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminQuickEditProps {
    entityType: "product" | "category" | "page" | "catalog" | "hero";
    id?: string | number;
    href?: string;
    locale?: string;
    className?: string;
    variant?: "floating" | "inline" | "badge";
    showLabel?: boolean;
}

export function AdminQuickEdit({
    entityType,
    id,
    href,
    locale,
    className,
    variant = "floating",
    showLabel = true,
}: AdminQuickEditProps) {
    const { data: session } = useSession();
    const params = useParams();
    const effectiveLocale = locale || (params?.lang as string) || "en";

    // Strictly enforce admin role
    const isAdmin = session?.user?.role === "admin";
    if (!isAdmin || (!id && !href && entityType !== "catalog" && entityType !== "hero")) {
        return null;
    }

    const getEditHref = () => {
        if (href) return href;
        switch (entityType) {
            case "product":
                return `/${effectiveLocale}/admin/products/${id}/edit`;
            case "category":
                return `/${effectiveLocale}/admin/categories/${id}/edit`;
            case "page":
                return `/${effectiveLocale}/admin/pages/${id}/edit`;
            case "catalog":
                return `/${effectiveLocale}/admin/catalog`;
            case "hero":
                return `/${effectiveLocale}/admin/settings#homepage-hero`;
            default:
                return `/${effectiveLocale}/admin`;
        }
    };

    const isFr = effectiveLocale === "fr";
    const label = isFr ? "Modifier" : "Edit";
    const editHref = getEditHref();

    const getEntityLabel = () => {
        switch (entityType) {
            case "product":
                return isFr ? "produit" : "product";
            case "category":
                return isFr ? "catégorie" : "category";
            case "page":
                return "page";
            case "catalog":
                return isFr ? "catalogue" : "catalog";
            case "hero":
                return isFr ? "bannière hero" : "hero banner";
            default:
                return entityType;
        }
    };
    const entityLabel = getEntityLabel();

    return (
        <Link
            href={editHref}
            onClick={(e) => {
                // Prevent navigation of parent clickable containers/cards
                e.stopPropagation();
            }}
            title={isFr ? `Modifier (${entityLabel})` : `Edit (${entityLabel})`}
            aria-label={isFr ? `Modifier ce contenu (${entityLabel})` : `Edit this content (${entityLabel})`}
            className={cn(
                "inline-flex items-center justify-center gap-1.5 text-xs font-medium rounded-full transition-all duration-200 ease-out cursor-pointer pointer-events-auto",
                "bg-background/90 text-foreground backdrop-blur-md border border-border/80 shadow-sm",
                "hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-md hover:scale-105 active:scale-95",
                variant === "floating" && "px-3 py-1.5 shadow-md",
                variant === "badge" && "px-2.5 py-1 text-[11px]",
                variant === "inline" && "px-2.5 py-1",
                className
            )}
        >
            <Pencil className="w-3.5 h-3.5 shrink-0" />
            {showLabel && <span className="leading-none">{label}</span>}
        </Link>
    );
}
