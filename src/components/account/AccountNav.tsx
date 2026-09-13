"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccountNavProps {
    lang: string;
    dict?: any;
    className?: string;
}

export function AccountNav({ lang, dict, className }: AccountNavProps) {
    const pathname = usePathname();

    const ordersLabel = dict?.account?.orders || (lang === "fr" ? "Mes Commandes" : "My Orders");
    const profileLabel = dict?.account?.profile || (lang === "fr" ? "Mes Informations" : "My Information");

    const ordersHref = `/${lang}/account/orders`;
    const profileHref = `/${lang}/account/profile`;

    const isOrdersActive =
        pathname === `/${lang}/account` ||
        pathname === `/${lang}/account/` ||
        pathname.startsWith(`/${lang}/account/orders`);

    const isProfileActive = pathname.startsWith(`/${lang}/account/profile`);

    const navItems = [
        {
            label: ordersLabel,
            href: ordersHref,
            icon: ShoppingBag,
            active: isOrdersActive,
        },
        {
            label: profileLabel,
            href: profileHref,
            icon: User,
            active: isProfileActive,
        },
    ];

    return (
        <nav
            aria-label="Account Navigation"
            className={cn("w-full bg-card rounded-xl border border-border p-2 shadow-xs", className)}
        >
            <ul className="flex flex-row md:flex-col gap-1.5 w-full">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <li key={item.href} className="flex-1 md:flex-none">
                            <Link
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors justify-center md:justify-start",
                                    item.active
                                        ? "bg-primary text-primary-foreground shadow-xs"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                                aria-current={item.active ? "page" : undefined}
                            >
                                <Icon className="w-4 h-4 shrink-0" />
                                <span>{item.label}</span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
