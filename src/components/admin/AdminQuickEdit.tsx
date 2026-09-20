"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminQuickEditProps {
    entityType: "product" | "category" | "page";
    id: string | number;
    locale?: string;
    className?: string;
    variant?: "floating" | "inline" | "badge";
    showLabel?: boolean;
}

export function AdminQuickEdit({
    entityType,
    id,
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
    if (!isAdmin || !id) {
        return null;
    }

    const getEditHref = () => {
        switch (entityType) {
            case "product":
                return `/${effectiveLocale}/admin/products/${id}/edit`;
            case "category":
                return `/${effectiveLocale}/admin/categories/${id}/edit`;
            case "page":
                return `/${effectiveLocale}/admin/pages/${id}/edit`;
            default:
                return `/${effectiveLocale}/admin`;
        }
    };

    const isFr = effectiveLocale === "fr";
    const label = isFr ? "Modifier" : "Edit";
    const editHref = getEditHref();

    return (
        <Link
            href={editHref}
            onClick={(e) => {
                // Prevent navigation of parent clickable containers/cards
                e.stopPropagation();
            }}
            title={isFr ? `Modifier (${entityType})` : `Edit (${entityType})`}
            aria-label={isFr ? `Modifier ce contenu (${entityType})` : `Edit this content (${entityType})`}
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
