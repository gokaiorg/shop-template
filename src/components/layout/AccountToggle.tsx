"use client"

import * as React from "react"
import { LogIn, User, LayoutDashboard, LogOut } from "lucide-react"
import Link from "next/link"
import { useSession, signOut } from "next-auth/react"

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

    const adminPanelLabel =
        typeof dict?.header?.admin_panel === "string"
            ? dict.header.admin_panel
            : lang === "fr"
            ? "Panneau Admin"
            : "Admin Panel";

    const myAccountLabel =
        typeof dict?.header?.account === "string"
            ? dict.header.account
            : typeof dict?.account?.title === "string"
            ? dict.account.title
            : lang === "fr"
            ? "Mon Compte"
            : "My Account";

    const signOutLabel =
        typeof dict?.header?.sign_out === "string"
            ? dict.header.sign_out
            : lang === "fr"
            ? "Déconnexion"
            : "Sign Out";

    if (status === "loading") {
        return (
            <Button size="icon" disabled aria-label={accountLabel} className="rounded-full bg-primary text-primary-foreground opacity-50">
                <User className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">{accountLabel}</span>
            </Button>
        )
    }

    if (session) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="icon" aria-label={accountLabel} className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:opacity-90 transition-opacity">
                        <User className="h-[1.2rem] w-[1.2rem]" />
                        <span className="sr-only">{accountLabel}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    {session.user?.role === "admin" && (
                        <DropdownMenuItem 
                            asChild
                            className="cursor-pointer focus:bg-primary focus:text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                        >
                            <Link href={`/${lang}/admin`} className="flex items-center w-full">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                <span>{adminPanelLabel}</span>
                            </Link>
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                        asChild
                        className="cursor-pointer focus:bg-primary focus:text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    >
                        <Link href={`/${lang}/account`} className="flex items-center w-full">
                            <User className="mr-2 h-4 w-4" />
                            <span>{myAccountLabel}</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                        onClick={() => signOut({ callbackUrl: `/${lang}` })}
                        className="cursor-pointer text-destructive focus:bg-destructive focus:text-white hover:bg-destructive hover:text-white group"
                    >
                        <LogOut className="mr-2 h-4 w-4 text-destructive group-hover:text-white group-focus:text-white" />
                        <span>{signOutLabel}</span>
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

