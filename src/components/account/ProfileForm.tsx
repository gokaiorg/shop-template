"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { User, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProfileFormProps {
    initialName: string;
    initialEmail: string;
    lang: string;
    dict?: any;
}

export function ProfileForm({ initialName, initialEmail, lang, dict }: ProfileFormProps) {
    const router = useRouter();
    const [name, setName] = React.useState(initialName);
    const [email, setEmail] = React.useState(initialEmail);
    const [password, setPassword] = React.useState("");
    const [isPending, setIsPending] = React.useState(false);
    const [feedback, setFeedback] = React.useState<{ type: "success" | "error"; text: string } | null>(null);

    const accountDict = dict?.account || {};

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFeedback(null);

        if (!name.trim()) {
            setFeedback({
                type: "error",
                text: lang === "fr" ? "Le nom ne peut pas être vide." : "Name cannot be empty.",
            });
            return;
        }

        if (!email.trim() || !email.includes("@")) {
            setFeedback({
                type: "error",
                text: lang === "fr" ? "Adresse email invalide." : "Invalid email address.",
            });
            return;
        }

        if (password && password.length < 6) {
            setFeedback({
                type: "error",
                text: lang === "fr" ? "Le mot de passe doit contenir au moins 6 caractères." : "Password must be at least 6 characters.",
            });
            return;
        }

        setIsPending(true);

        try {
            const payload: { name?: string; email?: string; password?: string } = {
                name: name.trim(),
                email: email.trim(),
            };

            if (password.trim()) {
                payload.password = password;
            }

            const res = await updateProfile(payload);

            if (res.error) {
                const errorMsg = typeof res.error === "string" ? res.error : accountDict.update_error || "Erreur de mise à jour.";
                setFeedback({ type: "error", text: errorMsg });
                toast.error(errorMsg);
            } else {
                const successMsg = accountDict.profile_updated || (lang === "fr" ? "Profil mis à jour avec succès !" : "Profile updated successfully!");
                setFeedback({ type: "success", text: successMsg });
                toast.success(successMsg);
                setPassword("");
                router.refresh();
            }
        } catch (err: any) {
            const genericError = err?.message || (lang === "fr" ? "Une erreur inattendue est survenue." : "An unexpected error occurred.");
            setFeedback({ type: "error", text: genericError });
            toast.error(genericError);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <Card className="rounded-xl border border-border shadow-xs overflow-hidden">
            <CardHeader className="border-b border-border bg-card px-6 py-5">
                <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    <CardTitle className="text-xl font-bold tracking-tight">
                        {accountDict.profile_title || (lang === "fr" ? "Informations Personnelles" : "Personal Information")}
                    </CardTitle>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                    {accountDict.profile_subtitle || (lang === "fr" ? "Consultez et mettez à jour vos coordonnées." : "View and update your personal details.")}
                </p>
            </CardHeader>

            <form onSubmit={handleSubmit}>
                <CardContent className="p-6 space-y-5">
                    {feedback && (
                        <div
                            className={`p-3.5 rounded-lg flex items-center gap-3 text-sm border ${
                                feedback.type === "success"
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                    : "bg-destructive/10 border-destructive/20 text-destructive"
                            }`}
                        >
                            {feedback.type === "success" ? (
                                <CheckCircle2 className="w-4 h-4 shrink-0" />
                            ) : (
                                <AlertCircle className="w-4 h-4 shrink-0" />
                            )}
                            <span>{feedback.text}</span>
                        </div>
                    )}

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="account-name" className="text-sm font-medium">
                            {accountDict.name || (lang === "fr" ? "Nom" : "Name")}
                        </Label>
                        <Input
                            id="account-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            disabled={isPending}
                            className="max-w-md"
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="account-email" className="text-sm font-medium">
                            {accountDict.email || (lang === "fr" ? "Adresse Email" : "Email Address")}
                        </Label>
                        <Input
                            id="account-email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isPending}
                            className="max-w-md"
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-2 pt-2 border-t border-border">
                        <Label htmlFor="account-password" className="text-sm font-medium">
                            {accountDict.password || (lang === "fr" ? "Nouveau mot de passe (facultatif)" : "New Password (optional)")}
                        </Label>
                        <Input
                            id="account-password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={isPending}
                            className="max-w-md"
                            autoComplete="new-password"
                        />
                        <p className="text-xs text-muted-foreground">
                            {accountDict.password_help || (lang === "fr" ? "Laissez ce champ vide pour conserver votre mot de passe actuel." : "Leave blank to keep your current password.")}
                        </p>
                    </div>
                </CardContent>

                <CardFooter className="border-t border-border bg-muted/20 px-6 py-4 flex justify-end">
                    <Button type="submit" disabled={isPending} className="min-w-[140px]">
                        {isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                {accountDict.saving || (lang === "fr" ? "Enregistrement..." : "Saving...")}
                            </>
                        ) : (
                            accountDict.save || (lang === "fr" ? "Enregistrer les modifications" : "Save Changes")
                        )}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    );
}
