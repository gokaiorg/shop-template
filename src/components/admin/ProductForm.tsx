"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { toast } from "sonner";
import { Upload, Image as ImageIcon, Loader2, Trash2 } from "lucide-react";

import { createProduct, updateProduct, deleteProduct } from "@/actions/admin";
import { productSchema } from "@/schemas/admin";
import { uploadProductImage, deleteProductImage } from "@/lib/firebase-storage";
import { getLocaleDisplayName, getLocalizedField } from "@/lib/i18n";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
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
import { useBrand } from "@/components/providers/BrandProvider";

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
    const { supportedLocales: locales, defaultLocale, isMultiLocale: isMulti } = useBrand();

    const [isPending, startTransition] = useTransition();
    const [isUploading, setIsUploading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const initialImages = (initialData?.images && Array.isArray(initialData.images) && initialData.images.length > 0)
        ? initialData.images
        : (initialData?.imageUrl ? [initialData.imageUrl] : []);
    const [images, setImages] = useState<string[]>(initialImages);

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

    const initialCategoryIds: string[] = initialData?.categoryIds && initialData.categoryIds.length > 0
        ? initialData.categoryIds
        : (initialData?.categoryId ? [initialData.categoryId] : []);

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
            categoryIds: initialCategoryIds,
            categoryId: initialCategoryIds[0] || "",
            imageUrl: initialImages[0] || null,
            images: initialImages,
        },
    });

    const handleFilesSelect = async (files: FileList | File[]) => {
        const validFiles = Array.from(files).filter(f => f.type.startsWith("image/"));
        if (validFiles.length === 0) {
            toast.error("Please select valid image files (PNG, JPG, WebP).");
            return;
        }

        setIsUploading(true);
        const toastId = toast.loading(
            validFiles.length === 1 
                ? (dict.imageUploading || "Uploading image...") 
                : `Uploading ${validFiles.length} images...`
        );

        try {
            const uploadedUrls: string[] = [];
            for (const file of validFiles) {
                const url = await uploadProductImage(file);
                uploadedUrls.push(url);
            }

            setImages(prev => {
                const updated = [...prev, ...uploadedUrls];
                form.setValue("images", updated);
                form.setValue("imageUrl", updated[0] || null);
                return updated;
            });

            toast.dismiss(toastId);
            toast.success(
                validFiles.length === 1 
                    ? "Image uploaded successfully!" 
                    : `${uploadedUrls.length} images uploaded successfully!`
            );
        } catch (uploadError) {
            toast.dismiss(toastId);
            console.error("Image upload failed:", uploadError);
            toast.error(dict.imageUploadError || "Failed to upload image.");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFilesSelect(e.target.files);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFilesSelect(e.dataTransfer.files);
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

    const handleRemoveImage = (indexToRemove: number) => {
        setImages(prev => {
            const updated = prev.filter((_, idx) => idx !== indexToRemove);
            form.setValue("images", updated);
            form.setValue("imageUrl", updated[0] || null);
            return updated;
        });
    };

    const handleSetPrimary = (indexToPrimary: number) => {
        if (indexToPrimary === 0) return;
        setImages(prev => {
            const target = prev[indexToPrimary];
            const remaining = prev.filter((_, idx) => idx !== indexToPrimary);
            const updated = [target, ...remaining];
            form.setValue("images", updated);
            form.setValue("imageUrl", updated[0] || null);
            return updated;
        });
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

            const payload = {
                ...values,
                name: completeName,
                slug: completeSlug,
                intro: completeIntro,
                description: completeDesc,
                status: completeStatus,
                imageUrl: images[0] || null,
                images: images,
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

    async function handleDelete() {
        if (!initialData?.id) return;
        setIsDeleting(true);
        const toastId = toast.loading(dict.deleting || "Deleting product...");
        try {
            for (const imgUrl of images) {
                await deleteProductImage(imgUrl);
            }
            const res = await deleteProduct(initialData.id);
            toast.dismiss(toastId);
            if (res.success) {
                toast.success(dict.deleted || "Product deleted successfully");
                router.push(`/${lang}/admin/products`);
            } else {
                toast.error(res.error || "Failed to delete product");
                setIsDeleting(false);
            }
        } catch (err) {
            toast.dismiss(toastId);
            console.error("DELETE_PRODUCT_ERROR", err);
            toast.error("Failed to delete product");
            setIsDeleting(false);
        }
    }

    const isLoading = isPending || isUploading || isDeleting;

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                    {/* General info & Categories */}
                    <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-md bg-muted/20">
                        <FormField
                            control={form.control}
                            name="categoryIds"
                            render={({ field }) => (
                                <FormItem className="col-span-1 md:col-span-2">
                                    <div className="flex items-center justify-between mb-2">
                                        <FormLabel className="text-sm font-medium">
                                            {dict.categories || dict.categoryId || "Categories"}
                                        </FormLabel>
                                        <span className="text-xs text-muted-foreground">
                                            {field.value?.length || 0} selected
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-3 border rounded-lg bg-background">
                                        {categories.map((c) => {
                                            const isChecked = (field.value || []).includes(c.id);
                                            return (
                                                <label
                                                    key={c.id}
                                                    className={`flex items-center gap-3 p-2.5 rounded-md border cursor-pointer transition-colors ${
                                                        isChecked 
                                                            ? "bg-primary/10 border-primary shadow-xs" 
                                                            : "bg-card hover:bg-muted/50 border-input"
                                                    }`}
                                                >
                                                    <Checkbox
                                                        checked={isChecked}
                                                        onCheckedChange={(checked) => {
                                                            const current = field.value || [];
                                                            if (checked) {
                                                                field.onChange([...current, c.id]);
                                                            } else {
                                                                field.onChange(current.filter((id: string) => id !== c.id));
                                                            }
                                                        }}
                                                    />
                                                    <span className="text-sm font-medium leading-none select-none">
                                                        {getLocalizedField(c.name, lang, defaultLocale)}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
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

                    {/* Product Image Upload & Gallery Section */}
                    <div className="col-span-1 md:col-span-2 p-6 border rounded-xl bg-card space-y-4 shadow-xs">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-base font-semibold text-foreground">
                                        {dict.imageUrl || "Product Images"}
                                    </h3>
                                    <Badge variant="secondary" className="text-xs">
                                        {images.length} {images.length === 1 ? "image" : "images"}
                                    </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                    {dict.dragDropImage || "Upload product photos (PNG, JPG, WebP). The first image is the cover."}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isUploading}
                                onClick={() => fileInputRef.current?.click()}
                                className="cursor-pointer shrink-0"
                            >
                                {isUploading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                        <span>Uploading...</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4 mr-1.5" />
                                        <span>{images.length > 0 ? "Add Images" : "Upload Images"}</span>
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Grille des images existantes */}
                        {images.length > 0 ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {images.map((imgUrl, idx) => {
                                        const isCover = idx === 0;
                                        return (
                                            <div
                                                key={`${imgUrl}-${idx}`}
                                                className={`relative group aspect-square rounded-xl overflow-hidden border-2 bg-muted/30 transition-all ${
                                                    isCover ? "border-primary shadow-xs ring-2 ring-primary/20" : "border-border/80 hover:border-border"
                                                }`}
                                            >
                                                <Image
                                                    src={imgUrl}
                                                    alt={`Product image ${idx + 1}`}
                                                    fill
                                                    sizes="(max-width: 768px) 50vw, 25vw"
                                                    className="object-cover"
                                                />

                                                {/* Badge Couverture sur la 1ère image */}
                                                {isCover ? (
                                                    <Badge className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 bg-primary text-primary-foreground font-semibold shadow-xs z-10">
                                                        Cover
                                                    </Badge>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSetPrimary(idx)}
                                                        className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded-md bg-background/80 hover:bg-background text-foreground backdrop-blur-xs border shadow-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                                                        title="Set as cover image"
                                                    >
                                                        Set cover
                                                    </button>
                                                )}

                                                {/* Bouton de suppression corbeille */}
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    onClick={() => handleRemoveImage(idx)}
                                                    className="absolute top-2 right-2 h-7 w-7 rounded-lg opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer z-10"
                                                    aria-label="Remove image"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>

                                                {/* Numéro d'ordre */}
                                                <span className="absolute bottom-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white font-mono pointer-events-none z-10">
                                                    #{idx + 1}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Zone de drop secondaire compacte */}
                                <div
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onClick={() => fileInputRef.current?.click()}
                                    className={`flex items-center justify-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                                        isDragOver
                                            ? "border-primary bg-primary/5"
                                            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/20"
                                    }`}
                                >
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Upload className="h-4 w-4 text-primary" />
                                        <span>Drop additional images here or click to browse</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Zone de drop principale (vide) */
                            <div
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() => fileInputRef.current?.click()}
                                className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                                    isDragOver
                                        ? "border-primary bg-primary/5"
                                        : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
                                }`}
                            >
                                <div className="p-3 bg-muted rounded-full mb-3 text-muted-foreground">
                                    <ImageIcon className="h-6 w-6" />
                                </div>
                                <p className="text-sm font-medium text-foreground text-center">
                                    {dict.uploadImage || "Click or drag images here"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    PNG, JPG, WEBP up to 5MB each • Multiple files allowed
                                </p>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            multiple
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

                <div className="flex items-center gap-4">
                    <Button type="submit" disabled={isLoading} className="cursor-pointer">
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isUploading ? (dict.imageUploading || "Uploading image...") : isDeleting ? (dict.deleting || "Deleting...") : (dict.submitting || "Saving...")}
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
                                        {dict.delete_confirm_desc || "This action cannot be undone. This will permanently delete this product and its associated images."}
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
                                        {isDeleting ? (dict.deleting || "Deleting...") : (dict.confirm_delete || "Delete Product")}
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
