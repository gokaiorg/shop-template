import React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminPageLayoutProps {
    title: string;
    description?: string;
    icon?: LucideIcon | React.ComponentType<{ className?: string }>;
    actions?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    hasStickyFooter?: boolean;
}

export function AdminPageLayout({
    title,
    description,
    icon: Icon,
    actions,
    children,
    className = "",
    hasStickyFooter = false,
}: AdminPageLayoutProps) {
    return (
        <main
            className={cn(
                "flex flex-col flex-1 min-h-screen bg-muted/20 dark:bg-zinc-950/50",
                hasStickyFooter ? "pb-0" : "pb-12 sm:pb-16",
                className
            )}
        >
            {/* En-tête de page */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-4 sm:px-8 pt-8 pb-4 shrink-0">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                        {Icon && <Icon className="w-7 h-7 text-muted-foreground shrink-0" />}
                        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                    </div>
                    {description && (
                        <p className="text-sm text-muted-foreground">{description}</p>
                    )}
                </div>
                {actions && (
                    <div className="flex items-center gap-2 flex-wrap">
                        {actions}
                    </div>
                )}
            </header>

            {/* Conteneur principal */}
            <div className="flex-1 px-4 sm:px-8 flex flex-col">
                <div className="flex flex-col max-w-5xl w-full gap-6 mx-auto flex-1">
                    {children}
                </div>
            </div>
        </main>
    );
}
