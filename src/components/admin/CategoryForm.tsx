"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Trash2, Loader2, ImageIcon, Upload } from "lucide-react";
import { createCategory, updateCategory, deleteCategory } from "@/actions/admin";
import { categorySchema } from "@/schemas/admin";
import { uploadProductImage } from "@/lib/firebase-storage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLocaleDisplayName } from "@/lib/i18n";
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

import { Category } from "@/types/database";
import { useBrand } from "@/components/providers/BrandProvider";

export function CategoryForm({ dict, lang, initialData }: { dict: Record<string, string>; lang: string; initialData?: Category }) {
    const router = useRouter();
    const { supportedLocales: locales, defaultLocale, isMultiLocale: isMulti } = useBrand();
    const [isPending, startTransition] = useTransition();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const imageInputRef = useRef<HTMLInputElement>(null);

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
        resolver: zodResolver(categorySchema) as any,
        defaultValues: {
            name: defaultName,
            slug: defaultSlug,
            intro: defaultIntro,
            description: defaultDesc,
            imageUrl: initialData?.imageUrl || "",
            order: initialData?.order !== undefined ? initialData.order : Date.now(),
        },
    });

    const imageUrlValue = form.watch("imageUrl");

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingImage(true);
        try {
            const downloadUrl = await uploadProductImage(file, `categories/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`);
            form.setValue("imageUrl", downloadUrl, { shouldValidate: true, shouldDirty: true });
            toast.success("Category image uploaded successfully!");
        } catch (error: any) {
            console.error(error);
            toast.error(error?.message || "Failed to upload image");
        } finally {
            setIsUploadingImage(false);
        }
    };

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

        const effectiveOrder = values.order !== undefined
            ? Math.round(Number(values.order))
            : (initialData?.order !== undefined ? initialData.order : Date.now());

        const payload = {
            ...values,
            order: effectiveOrder,
            imageUrl: values.imageUrl || null,
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

    async function handleDelete() {
        if (!initialData?.id) return;
        setIsDeleting(true);
        const toastId = toast.loading(dict.deleting || "Deleting category...");
        try {
            const res = await deleteCategory(initialData.id);
            toast.dismiss(toastId);
            if (res.success) {
                toast.success(dict.deleted || "Category deleted successfully");
                router.push(`/${lang}/admin/categories`);
            } else {
                toast.error(res.error || "Failed to delete category");
                setIsDeleting(false);
            }
        } catch (err) {
            toast.dismiss(toastId);
            console.error("DELETE_CATEGORY_ERROR", err);
            toast.error("Failed to delete category");
            setIsDeleting(false);
        }
    }

    const isLoading = isPending || isDeleting;

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

                {/* Hidden Position / Order Field - Managed via Drag & Drop in categories table */}
                <input type="hidden" {...form.register("order", { valueAsNumber: true })} />

                {/* Category Banner Image */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <ImageIcon className="h-5 w-5 text-primary" />
                            Category Banner Image
                        </CardTitle>
                        <CardDescription>
                            High-resolution image displayed as the banner on this category&apos;s page and as the card preview in the catalog index.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="border rounded-lg p-4 bg-muted/20 flex flex-col items-center justify-center min-h-[160px] gap-3 relative overflow-hidden">
                            {imageUrlValue ? (
                                <div className="w-full flex flex-col items-center gap-3">
                                    <div className="relative w-full h-48 bg-background/80 rounded-lg border overflow-hidden">
                                        <Image
                                            src={imageUrlValue}
                                            alt="Category Banner"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => imageInputRef.current?.click()}
                                            disabled={isUploadingImage || isLoading}
                                            className="cursor-pointer"
                                        >
                                            {isUploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                                            Change Image
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:bg-destructive/10 cursor-pointer"
                                            onClick={() => form.setValue("imageUrl", "", { shouldDirty: true })}
                                            disabled={isUploadingImage || isLoading}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-center py-4">
                                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">Recommended: 1200×600px landscape image (JPEG, PNG, WebP)</p>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => imageInputRef.current?.click()}
                                        disabled={isUploadingImage || isLoading}
                                        className="cursor-pointer mt-1"
                                    >
                                        {isUploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                                        Upload Category Image
                                    </Button>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={imageInputRef}
                                onChange={handleImageUpload}
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="imageUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input placeholder="Direct image URL or uploaded file path" {...field} value={field.value || ""} className="text-xs font-mono" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                <div className="flex items-center gap-4">
                    <Button type="submit" disabled={isLoading || isUploadingImage} className="cursor-pointer">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isDeleting ? (dict.deleting || "Deleting...") : (dict.submitting || "Saving...")}
                            </>
                        ) : (
                            dict.submit || "Save"
                        )}
                    </Button>

                    {initialData?.id && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button type="button" variant="destructive" disabled={isLoading} className="cursor-pointer">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    {dict.delete || "Delete"}
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>{dict.delete_confirm_title || "Are you absolutely sure?"}</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        {dict.delete_confirm_desc || "This action cannot be undone. This will permanently delete this category."}
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={isDeleting}>
                                        {dict.cancel || "Cancel"}
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDelete}
                                        disabled={isDeleting}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90 cursor-pointer"
                                    >
                                        {isDeleting ? (dict.deleting || "Deleting...") : (dict.confirm_delete || "Delete Category")}
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
