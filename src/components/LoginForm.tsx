"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function LoginForm({ dict }: { dict: Record<string, string> }) {
    const router = useRouter();
    const params = useParams<{ lang: string }>();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (res?.error) {
                setError(dict.invalid_creds);
            } else {
                const currentLang = params.lang || "en";
                router.push(`/${currentLang}/admin/dashboard`);
                router.refresh();
            }
        } catch (err) {
            setError(dict.unexpected_err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle className="text-xl">{dict.login_title}</CardTitle>
                <CardDescription>
                    {dict.login_desc}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email">{dict.email}</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder={dict.email_placeholder}
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">{dict.password}</Label>
                            </div>
                            <Input
                                id="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        {error && <p className="text-sm text-destructive">{error}</p>}
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? dict.login_btn_loading : dict.login_btn}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
