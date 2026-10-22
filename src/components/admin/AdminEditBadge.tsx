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

export function AdminEditBadge({
    href,
    label = "Edit",
    className,
    locale,
    title,
}: AdminEditBadgeProps) {
    const [mounted, setMounted] = React.useState(false);
    React.useEffect(() => {
        setMounted(true);
    }, []);

    let session = null;
    try {
        const res = useSession();
        session = res?.data;
    } catch {
        session = null;
    }
    const params = useParams();
    const effectiveLocale = locale || (params?.lang as string) || "en";

    const isAdmin = session?.user?.role === "admin";
    if (!mounted || !isAdmin || !href) {
        return null;
    }

    let targetHref = href;
    if (targetHref.startsWith("/") && !targetHref.startsWith(`/${effectiveLocale}/`)) {
        targetHref = `/${effectiveLocale}${targetHref}`;
    }

    const tooltipTitle = title || `${label}`;

    return (
        <Link
            href={targetHref}
            onClick={(e) => {
                e.stopPropagation();
            }}
            aria-label={tooltipTitle}
            className={cn(
                "absolute top-4 right-4 z-20",
                "group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5",
                "text-xs font-semibold tracking-wider uppercase leading-none",
                "backdrop-blur-md transition-all duration-300 ease-out cursor-pointer pointer-events-auto",
                "bg-zinc-950/80 text-white border border-primary/35 shadow-md",
                "hover:bg-primary hover:border-primary hover:text-white hover:shadow-[0_0_15px_var(--primary)] hover:scale-105 active:scale-95",
                className
            )}
        >
            <Pencil className="w-3.5 h-3.5 shrink-0 text-primary group-hover:text-white group-hover:!text-white transition-colors" size={14} />
            <span className="text-white group-hover:text-white font-semibold transition-colors">{label}</span>
        </Link>
    );
}
