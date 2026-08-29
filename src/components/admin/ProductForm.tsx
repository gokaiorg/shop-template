"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";

import { createProduct, updateProduct } from "@/actions/admin";
import { productSchema } from "@/schemas/admin";
import { uploadProductImage } from "@/lib/firebase-storage";
import { getSupportedLocales, getDefaultLocale, isMultiLocale } from "@/app/i18n-config";
import { getLocaleDisplayName, getLocalizedField } from "@/lib/i18n";

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

import { Category, Product } from "@/types/database";

export function ProductForm({
    categories,
    dict,
    lang,
    initialData
}: {
    categories: Category[];
    dict: Record<string, string>;
    lang: string;
    initialData?: Product;
}) {
    const router = useRouter();
    const locales = getSupportedLocales();
    const defaultLocale = getDefaultLocale();
    const isMulti = isMultiLocale();

    const [isPending, startTransition] = useTransition();
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const initialImage = initialData?.imageUrl || (initialData?.images && initialData.images.length > 0 ? initialData.images[0] : null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialImage);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    // Prepare default values dynamically for every supported locale
    const defaultName: Record<string, string> = {};
    const defaultSlug: Record<string, string> = {};
    const defaultIntro: Record<string, string> = {};
    const defaultDesc: Record<string, string> = {};
    const defaultStatus: Record<string, string> = {};

    locales.forEach((loc) => {
        defaultName[loc] = initialData?.name?.[loc] || (loc === 'en' ? initialData?.nameEn : loc === 'fr' ? initialData?.nameFr : '') || '';
        defaultSlug[loc] = initialData?.slug?.[loc] || (loc === 'en' ? initialData?.slugEn : loc === 'fr' ? initialData?.slugFr : '') || '';
        defaultIntro[loc] = initialData?.intro?.[loc] || (loc === 'en' ? initialData?.introEn : loc === 'fr' ? initialData?.introFr : '') || '';
        defaultDesc[loc] = initialData?.description?.[loc] || (loc === 'en' ? initialData?.descriptionEn : loc === 'fr' ? initialData?.descriptionFr : '') || '';
        defaultStatus[loc] = initialData?.status?.[loc] || (loc === 'en' ? initialData?.statusEn : loc === 'fr' ? initialData?.statusFr : 'draft') || 'draft';
    });

    const form = useForm<z.infer<typeof productSchema>>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            name: defaultName,
            slug: defaultSlug,
            intro: defaultIntro,
            description: defaultDesc,
            status: defaultStatus,
            price: initialData?.price || 0,
            stock: initialData?.stock || 0,
            categoryId: initialData?.categoryId || "",
            imageUrl: initialImage || null,
        },
    });

    const handleFileSelect = (file: File) => {
        if (!file.type.startsWith("image/")) {
            toast.error("Please select a valid image file.");
            return;
        }
        setSelectedFile(file);
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        form.setValue("imageUrl", objectUrl);
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleRemoveImage = () => {
        setSelectedFile(null);
        setPreviewUrl(null);
        form.setValue("imageUrl", null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    async function onSubmit(values: z.infer<typeof productSchema>) {
        try {
            // Check default locale fields
            if (!values.name?.[defaultLocale] || !values.slug?.[defaultLocale] || !values.description?.[defaultLocale]) {
                toast.error(`Please complete the required fields for ${getLocaleDisplayName(defaultLocale)}.`);
                return;
            }

            // Fill missing localized fields with default locale fallback
            const completeName: Record<string, string> = { ...values.name };
            const completeSlug: Record<string, string> = { ...values.slug };
            const completeIntro: Record<string, string> = { ...(values.intro || {}) };
            const completeDesc: Record<string, string> = { ...values.description };
            const completeStatus: Record<string, string> = { ...(values.status || {}) };

            locales.forEach((loc) => {
                if (!completeName[loc]) completeName[loc] = completeName[defaultLocale] || "";
                if (!completeSlug[loc]) completeSlug[loc] = completeSlug[defaultLocale] || "";
                if (!completeIntro[loc]) completeIntro[loc] = completeIntro[defaultLocale] || "";
                if (!completeDesc[loc]) completeDesc[loc] = completeDesc[defaultLocale] || "";
                if (!completeStatus[loc]) completeStatus[loc] = completeStatus[defaultLocale] || "draft";
            });

            let finalImageUrl = previewUrl;

            // If a new local file was selected, upload it to Firebase Storage first
            if (selectedFile) {
                setIsUploading(true);
                const toastId = toast.loading(dict.imageUploading || "Uploading image...");
                try {
                    finalImageUrl = await uploadProductImage(selectedFile);
                    toast.dismiss(toastId);
                } catch (uploadError) {
                    toast.dismiss(toastId);
                    console.error("Image upload failed:", uploadError);
                    toast.error(dict.imageUploadError || "Failed to upload image.");
                    setIsUploading(false);
                    return;
                }
                setIsUploading(false);
            }

            const payload = {
                ...values,
                name: completeName,
                slug: completeSlug,
                intro: completeIntro,
                description: completeDesc,
                status: completeStatus,
                imageUrl: finalImageUrl,
                images: finalImageUrl ? [finalImageUrl] : [],
            };

            startTransition(async () => {
                const res = initialData
                    ? await updateProduct(initialData.id, payload)
                    : await createProduct(payload);

                if (res.success) {
                    toast.success(dict.success || "Saved successfully!");
                    router.push(`/${lang}/admin/products`);
                } else {
                    toast.error(res.error || "Failed to save product.");
                }
            });
        } catch (err) {
            console.error("SUBMIT_PRODUCT_ERROR:", err);
            toast.error("An unexpected error occurred.");
            setIsUploading(false);
        }
    }

    const isLoading = isPending || isUploading;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* General info & Category */}
                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border rounded-md bg-muted/20">
                        <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{dict.categoryId || "Category"}</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {getLocalizedField(c.name, lang, defaultLocale)}
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
                                    <FormLabel>{dict.price || "Price"}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
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
                                    <FormLabel>{dict.stock || "Stock"}</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            {...field}
                                            onChange={(e) => field.onChange(Number(e.target.value))}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Product Image Upload Section */}
                    <div className="col-span-1 md:col-span-2 p-6 border rounded-lg bg-card space-y-4 shadow-xs">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-base font-semibold text-foreground">
                                    {dict.imageUrl || "Product Image"}
                                </h3>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {dict.dragDropImage || "Upload a high-quality product photo (PNG, JPG, WebP)"}
                                </p>
                            </div>
                            {previewUrl && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRemoveImage}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                                >
                                    <X className="h-4 w-4 mr-1" />
                                    {dict.removeImage || "Remove"}
                                </Button>
                            )}
                        </div>

                        {previewUrl ? (
                            <div className="relative group rounded-lg overflow-hidden border border-border bg-muted/40 aspect-video max-h-72 w-full flex items-center justify-center">
                                <Image
                                    src={previewUrl}
                                    alt="Product Preview"
                                    fill
                                    className="object-contain"
                                    unoptimized={previewUrl.startsWith("blob:")}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="h-4 w-4 mr-1.5" />
                                        {dict.uploadImage || "Change Image"}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() => fileInputRef.current?.click()}
                                className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 ${
                                    isDragOver
                                        ? "border-primary bg-primary/5"
                                        : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
                                }`}
                            >
                                <div className="p-3 bg-muted rounded-full mb-3 text-muted-foreground">
                                    <ImageIcon className="h-6 w-6" />
                                </div>
                                <p className="text-sm font-medium text-foreground text-center">
                                    {dict.uploadImage || "Click or drag an image here"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    PNG, JPG, WEBP up to 5MB
                                </p>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileInputChange}
                            className="hidden"
                        />
                    </div>

                    {/* Language specific fields */}
                    <div className="col-span-1 md:col-span-2">
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
                                            <FormField
                                                control={form.control}
                                                name={`status.${loc}`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>{dict.status || "Status"} ({loc.toUpperCase()})</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value || "draft"}>
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
                                ))}
                            </Accordion>
                        ) : (
                            <div className="space-y-4 border rounded-lg p-6 bg-card">
                                <h3 className="text-base font-semibold text-foreground border-b pb-3">
                                    Product Information ({getLocaleDisplayName(locales[0])})
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
                                <FormField
                                    control={form.control}
                                    name={`status.${locales[0]}`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{dict.status || "Status"} ({locales[0].toUpperCase()})</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value || "draft"}>
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
                            </div>
                        )}
                    </div>
                </div>

                <Button type="submit" disabled={isLoading} className="cursor-pointer">
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {isUploading ? (dict.imageUploading || "Uploading image...") : (dict.submitting || "Saving...")}
                        </>
                    ) : (
                        dict.submit || "Save"
                    )}
                </Button>
            </form>
        </Form>
    );
}
