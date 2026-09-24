"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { LoginForm } from "@/components/LoginForm";

interface AuthSheetProps {
    children: React.ReactNode;
    dict: Record<string, string>;
    lang?: string;
}

export function AuthSheet({ children, dict, lang }: AuthSheetProps) {
    const [open, setOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setOpen(false);
    }, [pathname]);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {children}
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md p-6">
                <SheetHeader className="mb-6">
                    <SheetTitle>{dict.login_title || "Welcome back"}</SheetTitle>
                    <SheetDescription>
                        {dict.login_desc || "Sign in to your account to continue."}
                    </SheetDescription>
                </SheetHeader>
                <LoginForm dict={dict} lang={lang} onSuccess={() => setOpen(false)} />
            </SheetContent>
        </Sheet>
    );
}
