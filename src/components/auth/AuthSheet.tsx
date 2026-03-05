"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { LoginForm } from "@/components/LoginForm";

interface AuthSheetProps {
    children: React.ReactNode;
    dict: Record<string, string>;
}

export function AuthSheet({ children, dict }: AuthSheetProps) {
    return (
        <Sheet>
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
                <LoginForm dict={dict} />
            </SheetContent>
        </Sheet>
    );
}
