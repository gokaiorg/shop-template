"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { createCategory } from "@/actions/admin";
import { categorySchema } from "@/schemas/admin";

import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CategoryForm({ dict, lang }: { dict: Record<string, string>; lang: string }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof categorySchema>>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            nameFr: "",
            nameEn: "",
            slugFr: "",
            slugEn: "",
            introFr: "",
            introEn: "",
            descriptionFr: "",
            descriptionEn: "",
        },
    });

    function onSubmit(values: z.infer<typeof categorySchema>) {
        startTransition(async () => {
            const res = await createCategory(values);
            if (res.success) {
                toast.success(dict.success);
                router.push(`/${lang}/admin/categories`);
            } else {
                toast.error(res.error || "Failed to create category");
            }
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* French Fields */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">Français</h3>
                        <FormField
                            control={form.control}
                            name="nameFr"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{dict.nameFr}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nom..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="slugFr"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{dict.slugFr}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="nom-slug..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="introFr"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{dict.introFr}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Introduction courte..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="descriptionFr"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{dict.descriptionFr}</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Description détaillée..." className="min-h-32" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* English Fields */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-lg border-b pb-2">English</h3>
                        <FormField
                            control={form.control}
                            name="nameEn"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{dict.nameEn}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Name..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="slugEn"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{dict.slugEn}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="name-slug..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="introEn"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{dict.introEn}</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Short introduction..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="descriptionEn"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{dict.descriptionEn}</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Detailed description..." className="min-h-32" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <Button type="submit" disabled={isPending}>
                    {isPending ? dict.submitting : dict.submit}
                </Button>
            </form>
        </Form>
    );
}
