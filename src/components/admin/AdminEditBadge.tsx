"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminEditBadgeProps {
    href: string;
    label?: string;
    className?: string;
    locale?: string;
    title?: string;
}

/**
 * AdminEditBadge: Spatial UI Glassmorphism 2.0 Quick Edit Badge
 * Standardized across all editable components (Solutions cards, About block, FAQ block, Contact block, banners, etc.)
 * High-contrast frosted glass with purple accent and glow, ensuring optimal visibility on dark banners and cards.
 * Strictly visible to authenticated administrators only.
 */
export function AdminEditBadge({
    href,
    label = "Edit",
    className,
    locale,
    title,
}: AdminEditBadgeProps) {
    const { data: session } = useSession();
    const params = useParams();
    const effectiveLocale = locale || (params?.lang as string) || "en";

    // Strictly verify if logged-in user has admin role
    const isAdmin = session?.user?.role === "admin";
    if (!isAdmin || !href) {
        return null;
    }

    // Format link with active locale prefix if not already present
    let targetHref = href;
    if (targetHref.startsWith("/") && !targetHref.startsWith(`/${effectiveLocale}/`)) {
        targetHref = `/${effectiveLocale}${targetHref}`;
    }

    const tooltipTitle = title || `${label}`;

    return (
        <Link
            href={targetHref}
            onClick={(e) => {
                // Prevent navigation / click bubbling on parent containers or cards
                e.stopPropagation();
            }}
            aria-label={tooltipTitle}
            className={cn(
                // Structure & Positioning
                "absolute top-4 right-4 z-20",
                "group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
                "text-xs font-semibold tracking-wider uppercase leading-none",
                // Spatial UI Glassmorphism Base - High-contrast frosted dark glass with brand accent outline
                "backdrop-blur-md transition-all duration-300 ease-out cursor-pointer pointer-events-auto",
                "bg-zinc-950/80 text-white border border-primary/35 shadow-md",
                // Micro-interactions (Hover State) - Main brand color
                "hover:bg-primary hover:border-primary hover:text-white hover:shadow-[0_0_15px_var(--primary)] hover:scale-105 active:scale-95",
                className
            )}
        >
            <Pencil className="w-3.5 h-3.5 shrink-0 text-primary group-hover:text-white group-hover:!text-white transition-colors" size={14} />
            <span className="text-white group-hover:text-white font-semibold transition-colors">{label}</span>
        </Link>
    );
}
