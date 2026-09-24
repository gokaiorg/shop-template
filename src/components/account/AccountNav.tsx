"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, User, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBrand } from "@/components/providers/BrandProvider";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

interface AccountNavProps {
    lang: string;
    dict?: any;
    className?: string;
}

export function AccountNav({ lang, dict, className }: AccountNavProps) {
    const pathname = usePathname();
    const { isCartEnabled } = useBrand();
    const unreadCount = useUnreadMessages();

    const profileLabel = dict?.account?.profile || (lang === "fr" ? "Mes Informations" : "My Information");
    const ordersLabel = dict?.account?.orders || (lang === "fr" ? "Mes Commandes" : "My Orders");
    const messagesLabel = dict?.account?.messages || dict?.admin?.messages || "Messages";

    const profileHref = `/${lang}/account/profile`;
    const ordersHref = `/${lang}/account/orders`;
    const messagesHref = `/${lang}/account/messages`;

    const isProfileActive =
        pathname === `/${lang}/account` ||
        pathname === `/${lang}/account/` ||
        pathname.startsWith(`/${lang}/account/profile`);

    const isOrdersActive = pathname.startsWith(`/${lang}/account/orders`);
    const isMessagesActive = pathname.startsWith(`/${lang}/account/messages`);

    const navItems = [
        {
            label: profileLabel,
            href: profileHref,
            icon: User,
            active: isProfileActive,
            badge: null,
        },
        ...(isCartEnabled ? [{
            label: ordersLabel,
            href: ordersHref,
            icon: ShoppingBag,
            active: isOrdersActive,
            badge: null,
        }] : []),
        {
            label: messagesLabel,
            href: messagesHref,
            icon: Mail,
            active: isMessagesActive,
            badge: unreadCount > 0 ? (
                <span className="inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white ml-auto">
                    {unreadCount > 99 ? "99+" : unreadCount}
                </span>
            ) : null,
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
                                {item.badge}
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </nav>
    );
}
