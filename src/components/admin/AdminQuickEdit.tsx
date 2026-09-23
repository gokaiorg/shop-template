"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminQuickEditProps {
    entityType?: "product" | "category" | "page" | "catalog" | "hero" | "settings";
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
    if (!isAdmin || (!id && !href && entityType !== "catalog" && entityType !== "hero" && entityType !== "settings")) {
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
            case "settings":
                return `/${effectiveLocale}/admin/settings`;
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
            case "settings":
                return isFr ? "paramètres" : "settings";
            default:
                return entityType || "element";
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
                "group inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold tracking-wider uppercase leading-none",
                "backdrop-blur-md transition-all duration-300 ease-out cursor-pointer pointer-events-auto",
                "bg-zinc-950/80 text-white border border-purple-500/35 shadow-md",
                "hover:bg-purple-600 hover:border-purple-400 hover:text-white hover:shadow-[0_0_15px_rgba(147,51,234,0.5)] hover:scale-105 active:scale-95",
                className
            )}
        >
            <Pencil className="w-3.5 h-3.5 shrink-0 text-purple-400 group-hover:text-white transition-colors" size={14} />
            {showLabel && <span className="text-white group-hover:text-white font-semibold transition-colors">{label}</span>}
        </Link>
    );
}

export { AdminEditBadge } from "@/components/admin/AdminEditBadge";

