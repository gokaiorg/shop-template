"use client"

import * as React from "react"
import { LogIn, User } from "lucide-react"
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
        return <div className="h-8 w-16 animate-pulse rounded-md bg-muted"></div>
    }

    if (session) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <User className="h-[1.2rem] w-[1.2rem]" />
                        <span className="sr-only">Account</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                        <Link href={`/${lang}/admin/dashboard`}>
                            {dict.header?.dashboard || "Dashboard"}
                        </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/' })}>
                        Sign Out
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        )
    }

    return (
        <AuthSheet dict={dict.auth || {}}>
            <Button variant="ghost" size="icon">
                <User className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">Account</span>
            </Button>
        </AuthSheet>
    )
}
