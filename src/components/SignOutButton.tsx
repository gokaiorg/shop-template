"use client";

import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
    const pathname = usePathname();
    const lang = pathname.split('/')[1] || 'en';

    return (
        <Button variant="outline" className="w-full" onClick={() => signOut({ callbackUrl: `/${lang}` })}>
            Sign Out
        </Button>
    );
}
