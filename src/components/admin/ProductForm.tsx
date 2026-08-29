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
    const [isPending, startTransition] = useTransition();
    const [isUploading, setIsUploading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const initialImage = initialData?.imageUrl || (initialData?.images && initialData.images.length > 0 ? initialData.images[0] : null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(initialImage);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const form = useForm<z.infer<typeof productSchema>>({
        resolver: zodResolver(productSchema),
        defaultValues: {
            nameFr: initialData?.nameFr || "",
            nameEn: initialData?.nameEn || "",
            slugFr: initialData?.slugFr || "",
            slugEn: initialData?.slugEn || "",
            introFr: initialData?.introFr || "",
            introEn: initialData?.introEn || "",
            descriptionFr: initialData?.descriptionFr || "",
            descriptionEn: initialData?.descriptionEn || "",
            statusFr: initialData?.statusFr || "brouillon",
            statusEn: initialData?.statusEn || "draft",
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

                    {/* Language specific fields inside Accordion */}
                    <div className="col-span-1 md:col-span-2">
                        <Accordion type="single" defaultValue="en" collapsible className="w-full">
                            {/* English Fields */}
                            <AccordionItem value="en">
                                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                                    English
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-4 px-2">
                                    <FormField
                                        control={form.control}
                                        name="nameEn"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{dict.nameEn || "Name (EN)"}</FormLabel>
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
                                                <FormLabel>{dict.slugEn || "Slug (EN)"}</FormLabel>
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
                                                <FormLabel>{dict.introEn || "Intro (EN)"}</FormLabel>
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
                                                <FormLabel>{dict.descriptionEn || "Description (EN)"}</FormLabel>
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
                                                <FormLabel>{dict.statusEn || "Status (EN)"}</FormLabel>
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
                                <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                                    Français
                                </AccordionTrigger>
                                <AccordionContent className="space-y-4 pt-4 px-2">
                                    <FormField
                                        control={form.control}
                                        name="nameFr"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{dict.nameFr || "Nom (FR)"}</FormLabel>
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
                                                <FormLabel>{dict.slugFr || "Slug (FR)"}</FormLabel>
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
                                                <FormLabel>{dict.introFr || "Intro (FR)"}</FormLabel>
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
                                                <FormLabel>{dict.descriptionFr || "Description (FR)"}</FormLabel>
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
                                                <FormLabel>{dict.statusFr || "Statut (FR)"}</FormLabel>
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
