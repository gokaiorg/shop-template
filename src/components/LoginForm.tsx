"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { registerUser } from "@/actions/auth";

export function LoginForm({ dict }: { dict: Record<string, string> }) {
    const router = useRouter();
    const params = useParams<{ lang: string }>();
    const [isSignUp, setIsSignUp] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (isSignUp) {
                const formData = new FormData();
                formData.append("name", name);
                formData.append("email", email);
                formData.append("password", password);

                const result = await registerUser(formData);
                if (result.error) {
                    if (typeof result.error === "string") {
                        setError(result.error);
                    } else {
                        setError("Invalid input. Please check the form.");
                    }
                    setLoading(false);
                    return;
                }
                
                // After successful signup, log the user in
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
            } else {
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
            }
        } catch (err) {
            setError(dict.unexpected_err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid gap-6">
            <form onSubmit={handleSubmit}>
                <div className="grid gap-4">
                    {isSignUp && (
                        <div className="grid gap-2">
                            <Label htmlFor="name">{dict.name || "Name"}</Label>
                            <Input
                                id="name"
                                name="name"
                                type="text"
                                placeholder="John Doe"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    )}
                    <div className="grid gap-2">
                        <Label htmlFor="email">{dict.email}</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
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
                        <div className="relative">
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete={isSignUp ? "new-password" : "current-password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pr-12"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-muted-foreground hover:text-foreground cursor-pointer"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                            </Button>
                        </div>
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {loading 
                            ? (dict.login_btn_loading || "Loading...") 
                            : (isSignUp ? (dict.signup_btn || "Create Account") : (dict.login_btn || "Sign in"))}
                    </Button>
                </div>
            </form>

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                    </span>
                </div>
            </div>

            <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => signIn("google", { callbackUrl: `/${params.lang || 'en'}/admin/dashboard` })}
            >
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                </svg>
                Google
            </Button>

            <div className="text-center text-sm">
                {isSignUp ? (
                    <>
                        Already have an account?{" "}
                        <button
                            type="button"
                            className="underline underline-offset-4 hover:text-primary"
                            onClick={() => setIsSignUp(false)}
                        >
                            Sign in
                        </button>
                    </>
                ) : (
                    <>
                        Don&apos;t have an account?{" "}
                        <button
                            type="button"
                            className="underline underline-offset-4 hover:text-primary"
                            onClick={() => setIsSignUp(true)}
                        >
                            Sign up
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
