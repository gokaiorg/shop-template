import React from "react";
import { LucideIcon } from "lucide-react";

export interface AdminPageHeaderProps {
    title: string;
    description?: string;
    icon?: LucideIcon | React.ComponentType<{ className?: string }>;
    children?: React.ReactNode;
    className?: string;
}

export function AdminPageHeader({
    title,
    description,
    icon: Icon,
    children,
    className = "",
}: AdminPageHeaderProps) {
    return (
        <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${className}`}>
            <div>
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-6 h-6 shrink-0" />}
                    <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                </div>
                {description && (
                    <p className="text-sm text-muted-foreground mt-1">
                        {description}
                    </p>
                )}
            </div>
            {children && (
                <div className="flex items-center gap-2 flex-wrap">
                    {children}
                </div>
            )}
        </div>
    );
}
