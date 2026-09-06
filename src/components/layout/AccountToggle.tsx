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

    if (status === "loading") {
        return (
            <Button size="icon" disabled className="rounded-full bg-primary text-primary-foreground opacity-50">
                <User className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">{dict.account || "Account"}</span>
            </Button>
        )
    }

    if (session) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button size="icon" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:opacity-90 transition-opacity">
                        <User className="h-[1.2rem] w-[1.2rem]" />
                        <span className="sr-only">{dict.account || "Account"}</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem 
                        asChild
                        className="cursor-pointer focus:bg-primary focus:text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                    >
                        <Link href={`/${lang}/admin/dashboard`} className="flex items-center w-full">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>{dict.header?.dashboard || "Dashboard"}</span>
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="cursor-pointer text-destructive focus:bg-destructive focus:text-white hover:bg-destructive hover:text-white group"
                    >
                        <LogOut className="mr-2 h-4 w-4 text-destructive group-hover:text-white group-focus:text-white" />
                        <span>Sign Out</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    return (
        <AuthSheet dict={dict.auth || {}}>
            <Button size="icon" className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 hover:opacity-90 transition-opacity">
                <User className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">{dict.account || "Account"}</span>
            </Button>
        </AuthSheet>
    )
}

