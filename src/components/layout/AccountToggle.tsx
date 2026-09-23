"use client";

import * as React from "react"
import { 
    User, 
    LayoutDashboard, 
    BookOpen,
    Folders,
    Package,
    FileText,
    Blocks,
    ShoppingCart,
    Mail, 
    Settings,
    LogOut 
} from "lucide-react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { useUnreadMessages } from "@/hooks/useUnreadMessages"
import { useBrand } from "@/components/providers/BrandProvider"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AuthSheet } from "@/components/auth/AuthSheet"

export function AccountToggle({ lang, dict }: { lang: string, dict: any }) {
    const { data: session, status } = useSession()
    const { isCartEnabled } = useBrand()
    const unreadCount = useUnreadMessages(session)
    
    const accountLabel =
        typeof dict?.header?.account === "string"
            ? dict.header.account
            : typeof dict?.account?.title === "string"
            ? dict.account.title
            : typeof dict?.account === "string"
            ? dict.account
            : lang === "fr"
            ? "Mon Compte"
            : "Account";

    const myAccountLabel =
        typeof dict?.header?.account === "string"
            ? dict.header.account
            : typeof dict?.account?.title === "string"
            ? dict.account.title
            : typeof dict?.account?.profile === "string"
            ? dict.account.profile
            : lang === "fr"
            ? "Mon Compte"
            : "My Account";

    const signOutLabel =
        typeof dict?.header?.sign_out === "string"
            ? dict.header.sign_out
            : lang === "fr"
            ? "Déconnexion"
            : "Sign Out";

    const adminDict = dict?.admin || {};
    const ordersTitle = adminDict.orders?.title || adminDict.orders || (lang === "fr" ? "Commandes" : "Orders");

    const adminNavItems = [
        {
            href: `/${lang}/admin/dashboard`,
            label: adminDict.dashboard || (lang === "fr" ? "Tableau de bord" : "Dashboard"),
            icon: LayoutDashboard,
        },
        {
            href: `/${lang}/admin/catalog`,
            label: adminDict.catalog || (lang === "fr" ? "Catalogue" : "Catalog"),
            icon: BookOpen,
        },
        {
            href: `/${lang}/admin/categories`,
            label: adminDict.categories || (lang === "fr" ? "Catégories" : "Categories"),
            icon: Folders,
        },
        {
            href: `/${lang}/admin/products`,
            label: adminDict.products || (lang === "fr" ? "Produits" : "Products"),
            icon: Package,
        },
        {
            href: `/${lang}/admin/pages`,
            label: adminDict.pages || "Pages",
            icon: FileText,
        },
        {
            href: `/${lang}/admin/blocks`,
            label: adminDict.blocks || (lang === "fr" ? "Blocs" : "Blocks"),
            icon: Blocks,
        },
        ...(isCartEnabled ? [{
            href: `/${lang}/admin/orders`,
            label: ordersTitle,
            icon: ShoppingCart,
        }] : []),
        {
            href: `/${lang}/admin/messages`,
            label: adminDict.messages || "Messages",
            icon: Mail,
            badge: unreadCount > 0 ? (
                <span className="inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                </span>
            ) : null,
        },
        {
            href: `/${lang}/admin/settings`,
            label: adminDict.settings || (lang === "fr" ? "Paramètres" : "Settings"),
            icon: Settings,
        },
    ];

    if (status === "loading") {
        return (
            <Button size="icon" disabled aria-label={accountLabel} className="rounded-full bg-primary text-primary-foreground opacity-50">
                <User className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">{accountLabel}</span>
            </Button>
        )
    }

    if (session) {
        const isAdmin = session.user?.role === "admin";

        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="icon" aria-label={accountLabel} className="relative rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:opacity-90 transition-opacity">
                        <User className="h-[1.2rem] w-[1.2rem]" />
                        <span className="sr-only">{accountLabel}</span>
                        {isAdmin && unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white pointer-events-none">
                                {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    {isAdmin ? (
                        adminNavItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <DropdownMenuItem 
                                    key={item.href}
                                    asChild
                                    className="cursor-pointer"
                                >
                                    <Link href={item.href} className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2">
                                            <Icon className="h-4 w-4" />
                                            <span>{item.label}</span>
                                        </div>
                                        {item.badge}
                                    </Link>
                                </DropdownMenuItem>
                            );
                        })
                    ) : (
                        <DropdownMenuItem 
                            asChild
                            className="cursor-pointer"
                        >
                            <Link href={`/${lang}/account`} className="flex items-center justify-between w-full">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    <span>{myAccountLabel}</span>
                                </div>
                            </Link>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                        onClick={() => signOut({ callbackUrl: `/${lang}` })}
                        className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive hover:bg-destructive/10 hover:text-destructive group"
                    >
                        <div className="flex items-center gap-2">
                            <LogOut className="h-4 w-4 text-destructive" />
                            <span>{signOutLabel}</span>
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    return (
        <AuthSheet dict={dict.auth || {}}>
            <Button size="icon" aria-label={accountLabel} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:opacity-90 transition-opacity">
                <User className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">{accountLabel}</span>
            </Button>
        </AuthSheet>
    )
}
