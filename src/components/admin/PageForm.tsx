"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Trash2, Loader2 } from "lucide-react";
import { updatePage, deletePage } from "@/actions/admin";
import { pageSchema } from "@/schemas/admin";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
import { useBrand } from "@/components/providers/BrandProvider";

export function PageForm({ dict, lang, initialData }: { dict: any; lang: string; initialData: Page }) {
    const router = useRouter();
    const { isMultiLocale } = useBrand();
    const isI18nEnabled = isMultiLocale;
    const [isPending, startTransition] = useTransition();
    const [isDeleting, setIsDeleting] = useState(false);

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
            const payload = {
                ...values,
                title_fr: values.title_fr || values.title_en,
                meta_title_fr: values.meta_title_fr || values.meta_title_en,
                meta_description_fr: values.meta_description_fr || values.meta_description_en,
                content_fr: values.content_fr || values.content_en,
            };

            const res = await updatePage(initialData.id, payload);

            if (res.success) {
                toast.success(dict.forms.success);
                router.push(`/${lang}/admin/pages`);
            } else {
                toast.error(res.error || "Failed to save page");
            }
        });
    }

    async function handleDelete() {
        if (!initialData?.id) return;
        setIsDeleting(true);
        const toastId = toast.loading(dict?.forms?.deleting || "Deleting page...");
        try {
            const res = await deletePage(initialData.id);
            toast.dismiss(toastId);
            if (res.success) {
                toast.success(dict?.forms?.deleted || "Page deleted successfully");
                router.push(`/${lang}/admin/pages`);
            } else {
                toast.error(res.error || "Failed to delete page");
                setIsDeleting(false);
            }
        } catch (err) {
            toast.dismiss(toastId);
            console.error("DELETE_PAGE_ERROR", err);
            toast.error("Failed to delete page");
            setIsDeleting(false);
        }
    }

    const isLoading = isPending || isDeleting;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {isI18nEnabled ? (
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
                ) : (
                    <div className="space-y-4 border rounded-lg p-6 bg-card">
                        <h3 className="text-base font-semibold text-foreground border-b pb-3">Page Information (EN)</h3>
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
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <Button type="submit" disabled={isLoading} className="cursor-pointer">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isDeleting ? (dict?.forms?.deleting || "Deleting...") : dict.forms.submitting}
                            </>
                        ) : (
                            dict.forms.submit
                        )}
                    </Button>

                    {initialData?.id && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button type="button" variant="destructive" disabled={isLoading} className="cursor-pointer">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {dict?.forms?.delete || "Delete"}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{dict?.forms?.delete_confirm_title || "Are you absolutely sure?"}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {dict?.forms?.delete_confirm_desc || "This action cannot be undone. This will permanently delete this page."}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isDeleting}>
                                        {dict?.forms?.cancel || "Cancel"}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                                    >
                                        {isDeleting ? (dict?.forms?.deleting || "Deleting...") : (dict?.forms?.confirm_delete || "Delete Page")}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                </div>
            </form>
        </Form>
    );
}
