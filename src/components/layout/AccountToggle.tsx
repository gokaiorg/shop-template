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

export function AccountToggle({ lang, dict }: { lang: string, dict: Record<string, string> }) {
    const { data: session, status } = useSession()

    if (status === "loading") {
        return <div className="h-8 w-16 animate-pulse rounded-md bg-muted"></div>
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                    <User className="h-[1.2rem] w-[1.2rem]" />
                    <span className="sr-only">Account</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {session ? (
                    <>
                        <DropdownMenuItem asChild>
                            <Link href={`/${lang}/admin/dashboard`}>
                                {dict.dashboard || "Dashboard"}
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => signOut()}>
                            Sign Out
                        </DropdownMenuItem>
                    </>
                ) : (
                    <>
                        <DropdownMenuItem asChild>
                            <Link href={`/${lang}/login`}>
                                {dict.login || "Login"}
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {/* Google OAuth will go here - standard redirect to our Auth.js provider */}
                        <form action={`/api/auth/signin/google`} method="POST">
                            <input type="hidden" name="callbackUrl" value={`/${lang}`} />
                            <button type="submit" className="w-full text-left relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-hidden transition-colors hover:bg-accent hover:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50">
                                Continue with Google
                            </button>
                        </form>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
