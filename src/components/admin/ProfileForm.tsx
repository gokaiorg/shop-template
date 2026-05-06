"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateProfile } from "@/actions/auth";

interface ProfileFormProps {
    user: {
        id: string;
        name?: string | null;
        email?: string | null;
    };
    dict: any;
}

export function ProfileForm({ user, dict }: ProfileFormProps) {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState(user.name || "");
    const [email, setEmail] = useState(user.email || "");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await updateProfile(user.id, {
                name,
                email,
                password: password || undefined,
            });

            if (result.success) {
                toast.success(dict.forms?.success || "Profile updated successfully");
                setPassword("");
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("An error occurred while updating profile");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{dict.profile?.title || "Personal Information"}</CardTitle>
                <CardDescription>
                    {dict.profile?.description || "Update your account details and password."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">{dict.name || "Username"}</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="John Doe"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">{dict.email || "Email"}</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="m@example.com"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">{dict.password || "New Password"}</Label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                        <p className="text-xs text-muted-foreground">
                            Leave blank to keep your current password.
                        </p>
                    </div>
                    <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {dict.forms?.submit || "Save Changes"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
