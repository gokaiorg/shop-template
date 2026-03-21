"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { createProduct } from "@/actions/admin";
import { productSchema } from "@/schemas/admin";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

import { Category } from "@/types/database";

export function ProductForm({ categories, dict, lang }: { categories: Category[]; dict: Record<string, string>; lang: string }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof productSchema>>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            nameFr: "",
            nameEn: "",
            slugFr: "",
            slugEn: "",
            introFr: "",
            introEn: "",
            descriptionFr: "",
            descriptionEn: "",
            statusFr: "brouillon",
            statusEn: "draft",
            price: 0,
            stock: 0,
            categoryId: "",
        },
    });

    function onSubmit(values: z.infer<typeof productSchema>) {
        startTransition(async () => {
            const res = await createProduct(values);
            if (res.success) {
                toast.success(dict.success);
                router.push(`/${lang}/admin/products`);
            } else {
                toast.error(res.error || "Failed to create product");
            }
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* General info */}
                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border rounded-md bg-muted/20">
                        <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{dict.categoryId}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {lang === "fr" ? c.nameFr : c.nameEn}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{dict.price}</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="stock"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{dict.stock}</FormLabel>
                                    <FormControl>
                                        <Input type="number" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Language specific fields inside Accordion */}
                    <div className="col-span-1 md:col-span-2">
                        <Accordion type="single" defaultValue="en" collapsible className="w-full">
                            {/* English Fields */}
                            <AccordionItem value="en">
                                <AccordionTrigger className="text-lg font-semibold hover:no-underline">English</AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-4 px-2">
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
                                    <FormField
                                        control={form.control}
                                        name="statusEn"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{dict.statusEn}</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="draft">Draft</SelectItem>
                                                        <SelectItem value="published">Published</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </AccordionContent>
                            </AccordionItem>

                            {/* French Fields */}
                            <AccordionItem value="fr">
                                <AccordionTrigger className="text-lg font-semibold hover:no-underline">Français</AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-4 px-2">
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
                                    <FormField
                                        control={form.control}
                                        name="statusFr"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{dict.statusFr}</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="brouillon">Brouillon</SelectItem>
                                                        <SelectItem value="publié">Publié</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </AccordionContent>
                            </AccordionItem>
                        </Accordion>
                    </div>
                </div>

                <Button type="submit" disabled={isPending}>
                    {isPending ? dict.submitting : dict.submit}
                </Button>
            </form>
        </Form>
    );
}
