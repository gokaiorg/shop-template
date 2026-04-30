"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { updatePage } from "@/actions/admin";
import { pageSchema } from "@/schemas/admin";

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

import { Page } from "@/types/database";

export function PageForm({ dict, lang, initialData }: { dict: any; lang: string; initialData: Page }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();

    const form = useForm<z.infer<typeof pageSchema>>({
        resolver: zodResolver(pageSchema),
        defaultValues: {
            title_en: initialData.title_en || "",
            title_fr: initialData.title_fr || "",
            meta_title_en: initialData.meta_title_en || "",
            meta_title_fr: initialData.meta_title_fr || "",
            meta_description_en: initialData.meta_description_en || "",
            meta_description_fr: initialData.meta_description_fr || "",
            content_en: initialData.content_en || "",
            content_fr: initialData.content_fr || "",
        },
    });

    function onSubmit(values: z.infer<typeof pageSchema>) {
        startTransition(async () => {
            const res = await updatePage(initialData.id, values);

            if (res.success) {
                toast.success(dict.forms.success);
                router.push(`/${lang}/admin/pages`);
            } else {
                toast.error(res.error || "Failed to save page");
            }
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <Accordion type="single" defaultValue="en" collapsible className="w-full">
                    {/* English Fields */}
                    <AccordionItem value="en">
                        <AccordionTrigger className="text-lg font-semibold hover:no-underline">English</AccordionTrigger>
                        <AccordionContent className="space-y-4 pt-4 px-2">
                            <FormField
                                control={form.control}
                                name="title_en"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{dict.forms.titleEn}</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Title..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="meta_title_en"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{dict.forms.metaTitleEn}</FormLabel>
                                        <FormControl>
                                            <Input placeholder="SEO Title..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="meta_description_en"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{dict.forms.metaDescriptionEn}</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="SEO Description..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="content_en"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{dict.forms.contentEn}</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="HTML Content..." className="min-h-[400px] font-mono" {...field} />
                                        </FormControl>
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
                                name="title_fr"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{dict.forms.titleFr}</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Titre..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="meta_title_fr"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{dict.forms.metaTitleFr}</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Titre SEO..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="meta_description_fr"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{dict.forms.metaDescriptionFr}</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Description SEO..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="content_fr"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{dict.forms.contentFr}</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Contenu HTML..." className="min-h-[400px] font-mono" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </AccordionContent>
                    </AccordionItem>
                </Accordion>

                <Button type="submit" disabled={isPending}>
                    {isPending ? dict.forms.submitting : dict.forms.submit}
                </Button>
            </form>
        </Form>
    );
}
