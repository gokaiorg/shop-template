"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { createCategory, updateCategory } from "@/actions/admin";
import { categorySchema } from "@/schemas/admin";
import { getSupportedLocales, getDefaultLocale, isMultiLocale } from "@/app/i18n-config";
import { getLocaleDisplayName } from "@/lib/i18n";

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
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";

import { Category } from "@/types/database";

export function CategoryForm({ dict, lang, initialData }: { dict: Record<string, string>; lang: string; initialData?: Category }) {
    const router = useRouter();
    const locales = getSupportedLocales();
    const defaultLocale = getDefaultLocale();
    const isMulti = isMultiLocale();
    const [isPending, startTransition] = useTransition();

    const defaultName: Record<string, string> = {};
    const defaultSlug: Record<string, string> = {};
    const defaultIntro: Record<string, string> = {};
    const defaultDesc: Record<string, string> = {};

    locales.forEach((loc) => {
        defaultName[loc] = initialData?.name?.[loc] || (loc === 'en' ? initialData?.nameEn : loc === 'fr' ? initialData?.nameFr : '') || '';
        defaultSlug[loc] = initialData?.slug?.[loc] || (loc === 'en' ? initialData?.slugEn : loc === 'fr' ? initialData?.slugFr : '') || '';
        defaultIntro[loc] = initialData?.intro?.[loc] || (loc === 'en' ? initialData?.introEn : loc === 'fr' ? initialData?.introFr : '') || '';
        defaultDesc[loc] = initialData?.description?.[loc] || (loc === 'en' ? initialData?.descriptionEn : loc === 'fr' ? initialData?.descriptionFr : '') || '';
    });

    const form = useForm<z.infer<typeof categorySchema>>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: defaultName,
            slug: defaultSlug,
            intro: defaultIntro,
            description: defaultDesc,
        },
    });

    function onSubmit(values: z.infer<typeof categorySchema>) {
        if (!values.name?.[defaultLocale] || !values.slug?.[defaultLocale] || !values.description?.[defaultLocale]) {
            toast.error(`Please complete the required fields for ${getLocaleDisplayName(defaultLocale)}.`);
            return;
        }

        const completeName: Record<string, string> = { ...values.name };
        const completeSlug: Record<string, string> = { ...values.slug };
        const completeIntro: Record<string, string> = { ...(values.intro || {}) };
        const completeDesc: Record<string, string> = { ...values.description };

        locales.forEach((loc) => {
            if (!completeName[loc]) completeName[loc] = completeName[defaultLocale] || "";
            if (!completeSlug[loc]) completeSlug[loc] = completeSlug[defaultLocale] || "";
            if (!completeIntro[loc]) completeIntro[loc] = completeIntro[defaultLocale] || "";
            if (!completeDesc[loc]) completeDesc[loc] = completeDesc[defaultLocale] || "";
        });

        const payload = {
            ...values,
            name: completeName,
            slug: completeSlug,
            intro: completeIntro,
            description: completeDesc,
        };

        startTransition(async () => {
            const res = initialData
                ? await updateCategory(initialData.id, payload)
                : await createCategory(payload);

            if (res.success) {
                toast.success(dict.success || "Category saved successfully!");
                router.push(`/${lang}/admin/categories`);
            } else {
                toast.error(res.error || "Failed to save category");
            }
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {isMulti ? (
                    <Accordion type="single" defaultValue={defaultLocale} collapsible className="w-full">
                        {locales.map((loc) => (
                            <AccordionItem key={loc} value={loc}>
                                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                                    {getLocaleDisplayName(loc)}
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-4 px-2">
                                    <FormField
                                        control={form.control}
                                        name={`name.${loc}`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{dict.name || "Name"} ({loc.toUpperCase()})</FormLabel>
                                                <FormControl>
                                                    <Input placeholder={`Name (${loc.toUpperCase()})...`} {...field} value={field.value || ""} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`slug.${loc}`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{dict.slug || "Slug"} ({loc.toUpperCase()})</FormLabel>
                                                <FormControl>
                                                    <Input placeholder={`slug-${loc}...`} {...field} value={field.value || ""} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`intro.${loc}`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{dict.intro || "Intro"} ({loc.toUpperCase()})</FormLabel>
                                                <FormControl>
                                                    <Input placeholder={`Short introduction (${loc.toUpperCase()})...`} {...field} value={field.value || ""} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`description.${loc}`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{dict.description || "Description"} ({loc.toUpperCase()})</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder={`Detailed description (${loc.toUpperCase()})...`} className="min-h-32" {...field} value={field.value || ""} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                ) : (
                    <div className="space-y-4 border rounded-lg p-6 bg-card">
                        <h3 className="text-base font-semibold text-foreground border-b pb-3">
                            Category Information ({getLocaleDisplayName(locales[0])})
                        </h3>
                        <FormField
                            control={form.control}
                            name={`name.${locales[0]}`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{dict.name || "Name"} ({locales[0].toUpperCase()})</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Name..." {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`slug.${locales[0]}`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{dict.slug || "Slug"} ({locales[0].toUpperCase()})</FormLabel>
                                    <FormControl>
                                        <Input placeholder="name-slug..." {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`intro.${locales[0]}`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{dict.intro || "Intro"} ({locales[0].toUpperCase()})</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Short introduction..." {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`description.${locales[0]}`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{dict.description || "Description"} ({locales[0].toUpperCase()})</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Detailed description..." className="min-h-32" {...field} value={field.value || ""} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                )}

                <Button type="submit" disabled={isPending}>
                    {isPending ? (dict.submitting || "Saving...") : (dict.submit || "Save")}
                </Button>
            </form>
        </Form>
    );
}
