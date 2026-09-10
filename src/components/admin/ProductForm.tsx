"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { toast } from "sonner";
import { Upload, Image as ImageIcon, Loader2, Trash2, Save, ExternalLink, FileText, DollarSign, FolderTree, LayoutTemplate, RotateCcw, ArrowLeft } from "lucide-react";
import Link from "next/link";

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
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { Category, Product } from "@/types/database";
import { useBrand } from "@/components/providers/BrandProvider";
import { CreatableVendorCombobox } from "@/components/admin/CreatableVendorCombobox";

function generateSlug(text: string): string {
    return text
        .toString()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");
}

const slugify = generateSlug;

function getCategorySlugForLocale(cat: Category | undefined, loc: string): string {
    if (!cat) return "category";
    if (typeof cat.slug === 'object' && cat.slug?.[loc]) return cat.slug[loc];
    if (loc === 'fr' && (cat.slugFr || (cat as any).slug_fr)) return (cat.slugFr || (cat as any).slug_fr);
    if (loc === 'en' && (cat.slugEn || (cat as any).slug_en)) return (cat.slugEn || (cat as any).slug_en);
    if (typeof cat.slug === 'string' && cat.slug) return cat.slug;
    return getLocalizedField(cat.slug, loc) || cat.id || "category";
}

interface ProductFormProps {
    categories: Category[];
    dict: Record<string, string>;
    lang: string;
    initialData?: Product;
    vendors?: string[];
    catalogSlugs?: Record<string, string>;
}

export function ProductForm({
    categories,
    dict,
    lang,
    initialData,
    vendors = [],
    catalogSlugs: propCatalogSlugs,
}: ProductFormProps) {
    const router = useRouter();
    const { supportedLocales: locales, defaultLocale, isMultiLocale: isMulti, catalogSlugs: brandCatalogSlugs } = useBrand();
    const catalogSlugs = propCatalogSlugs || brandCatalogSlugs || { en: 'shop', fr: 'boutique' };
    const [activeLang, setActiveLang] = useState<string>(defaultLocale || lang || "en");

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
        resolver: zodResolver(productSchema) as any,
        defaultValues: {
            name: defaultName,
            slug: defaultSlug,
            intro: defaultIntro,
            description: defaultDesc,
            status: defaultStatus,
            price: initialData?.price || 0,
            stock: initialData?.stock || 0,
            artist: initialData?.artist || initialData?.vendor || "",
            vendor: initialData?.vendor || initialData?.artist || "",
            categoryIds: initialCategoryIds,
            categoryId: initialCategoryIds[0] || "",
            imageUrl: initialImages[0] || null,
            images: initialImages,
            order: initialData?.order !== undefined ? initialData.order : Date.now(),
        },
    });

    const isNew = !initialData?.id;
    const slugTouchedRef = useRef<Record<string, boolean>>(
        initialData?.id
            ? locales.reduce((acc, loc) => ({ ...acc, [loc]: true }), {})
            : {}
    );

    // Auto-generate slug from name specifically on creation (or if slug was cleared)
    useEffect(() => {
        if (!isNew) return;

        // 1. Check on initial render/mount
        locales.forEach((loc) => {
            const currentSlug = form.getValues(`slug.${loc}`);
            if (!slugTouchedRef.current[loc] || !currentSlug) {
                const currentName = form.getValues(`name.${loc}`) || "";
                if (currentName.trim()) {
                    const generated = generateSlug(currentName);
                    form.setValue(`slug.${loc}`, generated, { shouldValidate: true });
                }
            }
        });

        // 2. React Hook Form subscription: live keystroke listener on name per locale
        const subscription = form.watch((value, { name }) => {
            if (!name || !name.startsWith("name")) return;

            const targetLoc = name.split(".")[1];
            if (targetLoc && locales.includes(targetLoc)) {
                const currentSlug = form.getValues(`slug.${targetLoc}`);
                if (!slugTouchedRef.current[targetLoc] || !currentSlug) {
                    const currentName = form.getValues(`name.${targetLoc}`) || "";
                    if (currentName.trim()) {
                        const generated = generateSlug(currentName);
                        form.setValue(`slug.${targetLoc}`, generated, { shouldValidate: true, shouldDirty: true });
                    }
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [isNew, locales, form]);

    const handleSlugChange = (loc: string, rawValue: string, onChange: (val: string) => void) => {
        if (!rawValue.trim()) {
            slugTouchedRef.current[loc] = false;
        } else {
            slugTouchedRef.current[loc] = true;
        }
        const cleanSlug = rawValue
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");
        onChange(cleanSlug);
    };

    const handleSlugBlur = (loc: string, onBlur: () => void) => {
        onBlur();
        const currentVal = form.getValues(`slug.${loc}`) || "";
        if (!currentVal.trim()) {
            slugTouchedRef.current[loc] = false;
            const currentName = form.getValues(`name.${loc}`) || "";
            if (currentName.trim()) {
                form.setValue(`slug.${loc}`, slugify(currentName), { shouldDirty: true, shouldValidate: true });
            }
        } else {
            const trimmed = currentVal.replace(/^-+|-+$/g, "");
            if (trimmed !== currentVal) {
                form.setValue(`slug.${loc}`, trimmed, { shouldDirty: true, shouldValidate: true });
            }
        }
    };

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

    const onInvalid = (errors: any) => {
        console.warn("Product form validation errors:", errors);
        toast.error(
            lang?.startsWith("fr")
                ? "Veuillez compléter les champs obligatoires."
                : "Please complete the required fields."
        );
    };

    async function onSubmit(values: z.infer<typeof productSchema>) {
        try {
            // Check default locale required fields and set inline errors
            let hasError = false;

            if (!values.name?.[defaultLocale]?.trim()) {
                form.setError(`name.${defaultLocale}` as any, {
                    type: "manual",
                    message: lang?.startsWith("fr") ? "Le nom du produit est obligatoire." : "Product name is required.",
                });
                hasError = true;
            }

            if (!values.slug?.[defaultLocale]?.trim()) {
                form.setError(`slug.${defaultLocale}` as any, {
                    type: "manual",
                    message: lang?.startsWith("fr") ? "Le slug est obligatoire." : "Slug is required.",
                });
                hasError = true;
            }

            if (!values.description?.[defaultLocale]?.trim()) {
                form.setError(`description.${defaultLocale}` as any, {
                    type: "manual",
                    message: lang?.startsWith("fr") ? "La description est obligatoire." : "Description is required.",
                });
                hasError = true;
            }

            if (!values.categoryIds || values.categoryIds.length === 0) {
                form.setError("categoryIds" as any, {
                    type: "manual",
                    message: lang?.startsWith("fr") ? "Veuillez sélectionner au moins une catégorie." : "At least one category is required.",
                });
                hasError = true;
            }

            if (values.price === undefined || values.price === null || isNaN(values.price) || values.price < 0) {
                form.setError("price", {
                    type: "manual",
                    message: lang?.startsWith("fr") ? "Le prix doit être un nombre positif ou nul." : "Price must be >= 0.",
                });
                hasError = true;
            }

            if (values.stock === undefined || values.stock === null || isNaN(values.stock) || values.stock < 0) {
                form.setError("stock", {
                    type: "manual",
                    message: lang?.startsWith("fr") ? "Le stock doit être un entier positif ou nul." : "Stock must be >= 0.",
                });
                hasError = true;
            }

            if (hasError) {
                toast.error(
                    lang?.startsWith("fr")
                        ? "Veuillez compléter les champs obligatoires."
                        : `Please complete the required fields for ${getLocaleDisplayName(defaultLocale)}.`
                );
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
                if (completeSlug[loc]) completeSlug[loc] = slugify(completeSlug[loc]);
                if (!completeIntro[loc]) completeIntro[loc] = completeIntro[defaultLocale] || "";
                if (!completeDesc[loc]) completeDesc[loc] = completeDesc[defaultLocale] || "";
                if (!completeStatus[loc]) completeStatus[loc] = completeStatus[defaultLocale] || "draft";
            });

            const trimmedArtist = values.artist?.trim() || values.vendor?.trim() || null;
            const effectiveOrder = values.order !== undefined
                ? Math.round(Number(values.order))
                : (initialData?.order !== undefined ? initialData.order : Date.now());

            const payload = {
                ...values,
                order: effectiveOrder,
                artist: trimmedArtist,
                vendor: trimmedArtist,
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
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8 flex flex-col flex-1">
                {/* Hidden Order Field - Managed via Drag & Drop in products table */}
                <input type="hidden" {...form.register("order", { valueAsNumber: true })} />

                <div className="flex items-center justify-between">
                    <Button asChild variant="ghost" size="sm">
                        <Link href={`/${lang}/admin/products`} className="flex items-center gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            {dict?.back_to_products || (lang?.startsWith('fr') ? 'Retour aux produits' : 'Back to products')}
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Colonne principale (Gauche) */}
                    <div className="col-span-1 lg:col-span-2 min-w-0 space-y-8">
                        {/* Bloc 1 : Informations Principales */}
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText className="w-5 h-5 text-muted-foreground" />
                                    <h2 className="text-lg font-medium tracking-tight">
                                        {lang?.startsWith("fr") ? "Informations Générales" : "General Information"}
                                    </h2>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {lang?.startsWith("fr") ? "Nom, accroche et descriptions." : "Product name, intro, and descriptions."}
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {isMulti ? (
                                    <Tabs value={activeLang} onValueChange={setActiveLang} className="w-full">
                                        <TabsList className="mb-4">
                                            {locales.map((loc) => (
                                                <TabsTrigger key={loc} value={loc} className="uppercase text-xs">
                                                    {loc.toUpperCase()}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                        {locales.map((loc) => (
                                            <TabsContent key={loc} value={loc} className="space-y-4">
                                                <FormField
                                                    control={form.control}
                                                    name={`name.${loc}`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>{dict.name || "Name"} <span className="text-destructive ml-1">*</span></FormLabel>
                                                            <FormControl>
                                                                <Input placeholder={`Name (${loc.toUpperCase()})...`} {...field} value={field.value || ""} />
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
                                                            <FormLabel>{dict.intro || "Intro"}</FormLabel>
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
                                                            <FormLabel>{dict.description || "Description"} <span className="text-destructive ml-1">*</span></FormLabel>
                                                            <FormControl>
                                                                <Textarea placeholder={`Detailed description (${loc.toUpperCase()})...`} className="min-h-32" {...field} value={field.value || ""} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </TabsContent>
                                        ))}
                                    </Tabs>
                                ) : (
                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name={`name.${locales[0]}`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{dict.name || "Name"} <span className="text-destructive ml-1">*</span></FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Name..." {...field} value={field.value || ""} />
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
                                                    <FormLabel>{dict.intro || "Intro"}</FormLabel>
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
                                                    <FormLabel>{dict.description || "Description"} <span className="text-destructive ml-1">*</span></FormLabel>
                                                    <FormControl>
                                                        <Textarea placeholder="Detailed description..." className="min-h-32" {...field} value={field.value || ""} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Bloc 2 : Médias */}
                        <Card className="min-w-0">
                            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                        <h2 className="text-lg font-medium tracking-tight">
                                            {dict.imageUrl || (lang?.startsWith("fr") ? "Médias du produit" : "Product Images")}
                                        </h2>
                                        <Badge variant="secondary" className="text-xs ml-1">
                                            {images.length} {images.length === 1 ? "image" : "images"}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        {lang?.startsWith("fr") ? "Photos du produit. La première sert de couverture." : "Product photos. First image serves as cover."}
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
                                            <span>{lang?.startsWith("fr") ? "Envoi en cours..." : "Uploading..."}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4 mr-1.5" />
                                            <span>{images.length > 0 ? (lang?.startsWith("fr") ? "Ajouter des images" : "Add Images") : (lang?.startsWith("fr") ? "Téléverser des images" : "Upload Images")}</span>
                                        </>
                                    )}
                                </Button>
                            </CardHeader>
                            <CardContent className="space-y-4">
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
                                                                {lang?.startsWith("fr") ? "Couverture" : "Cover"}
                                                            </Badge>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSetPrimary(idx)}
                                                                className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded-md bg-background/80 hover:bg-background text-foreground backdrop-blur-xs border shadow-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                                                                title={lang?.startsWith("fr") ? "Définir comme couverture" : "Set as cover image"}
                                                            >
                                                                {lang?.startsWith("fr") ? "Couverture" : "Set cover"}
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
                                                        <span className="absolute bottom-6 right-1.5 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white font-mono pointer-events-none z-10">
                                                            #{idx + 1}
                                                        </span>

                                                        {/* Affichage de l'URL source */}
                                                        <div
                                                            className="absolute bottom-0 left-0 w-full bg-black/70 text-white text-[9px] font-mono p-1 truncate text-center backdrop-blur-sm z-10"
                                                            title={imgUrl}
                                                        >
                                                            {imgUrl}
                                                        </div>
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
                                                <span>{lang?.startsWith("fr") ? "Déposez d'autres images ici ou cliquez pour parcourir" : "Drop additional images here or click to browse"}</span>
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
                                            {dict.uploadImage || (lang?.startsWith("fr") ? "Cliquez ou glissez-déposez des images ici" : "Click or drag images here")}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            PNG, JPG, WEBP • Multiple files allowed
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
                            </CardContent>
                        </Card>

                    {/* Bloc 3 : Prix et Inventaire */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="w-5 h-5 text-muted-foreground" />
                                <h2 className="text-lg font-medium tracking-tight">
                                    {lang?.startsWith("fr") ? "Prix & Inventaire" : "Pricing & Inventory"}
                                </h2>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                {lang?.startsWith("fr") ? "Tarif unitaire et quantité disponible en stock." : "Unit pricing and available inventory stock."}
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{dict.price || "Price"} <span className="text-destructive ml-1">*</span></FormLabel>
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
                                            <FormLabel>{dict.stock || "Stock"} <span className="text-destructive ml-1">*</span></FormLabel>
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
                        </CardContent>
                    </Card>

                    {/* Bloc 4 : Organisation */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2 mb-1">
                                <FolderTree className="w-5 h-5 text-muted-foreground" />
                                <h2 className="text-lg font-medium tracking-tight">
                                    {lang?.startsWith("fr") ? "Organisation" : "Organization"}
                                </h2>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                                {lang?.startsWith("fr") ? "Catégories associées et artiste ou vendeur." : "Associated categories and artist or vendor."}
                            </p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <FormField
                                control={form.control}
                                name="categoryIds"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between mb-2">
                                            <FormLabel className="text-sm font-medium">
                                                {dict.categories || dict.categoryId || "Categories"} <span className="text-destructive ml-1">*</span>
                                            </FormLabel>
                                            <span className="text-xs text-muted-foreground">
                                                {field.value?.length || 0} {lang?.startsWith("fr") ? "sélectionnée(s)" : "selected"}
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
                                name="artist"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{dict.artist || "Artist / Vendor"}</FormLabel>
                                        <FormControl>
                                            <CreatableVendorCombobox
                                                options={vendors}
                                                value={field.value || ""}
                                                onChange={(val) => {
                                                    field.onChange(val);
                                                    form.setValue("vendor", val);
                                                }}
                                                placeholder={dict.artistPlaceholder || "e.g. Amann Inkspiration"}
                                                lang={lang}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                    </div>

                    {/* Colonne secondaire (Droite) */}
                    <div className="col-span-1 min-w-0 space-y-8">
                        {/* Bloc : URL & Publication */}
                        <Card className="min-w-0 overflow-hidden">
                            <CardHeader>
                                <div className="flex items-center gap-2 mb-1">
                                    <LayoutTemplate className="w-5 h-5 text-muted-foreground" />
                                    <h2 className="text-lg font-medium tracking-tight">
                                        {lang?.startsWith("fr") ? "Paramètres URL & Statut" : "URL & Publication"}
                                    </h2>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {lang?.startsWith("fr")
                                        ? "Identifiant slug et visibilité du statut."
                                        : "Slug handle and publication status."}
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-4 min-w-0">
                                {isMulti ? (
                                    <Tabs value={activeLang} className="w-full">
                                        {locales.map((loc) => {
                                            const currentSlugVal = form.watch(`slug.${loc}`) || "";
                                            const currentCatalogSlug = catalogSlugs?.[loc] || (loc === 'fr' ? 'boutique' : 'shop');
                                            const selectedCatIds = form.watch("categoryIds") || (form.watch("categoryId") ? [form.watch("categoryId")] : []);
                                            const parentCat = categories.find((c) => selectedCatIds.includes(c.id));
                                            const parentCatSlug = getCategorySlugForLocale(parentCat, loc);
                                            const previewUrl = `/${loc}/${currentCatalogSlug}/${parentCatSlug}/${currentSlugVal || "slug"}`;

                                            return (
                                                <TabsContent key={loc} value={loc} className="space-y-4">
                                                    <FormField
                                                        control={form.control}
                                                        name={`slug.${loc}`}
                                                        render={({ field }) => (
                                                            <FormItem className="min-w-0 space-y-2">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <FormLabel>{dict.slug || (lang?.startsWith("fr") ? "Slug (URL)" : "Slug (URL)")} <span className="text-destructive ml-1">*</span></FormLabel>
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-6 px-1.5 text-xs text-muted-foreground hover:text-primary cursor-pointer gap-1 shrink-0"
                                                                        title={lang?.startsWith("fr") ? "Regénérer depuis le nom" : "Regenerate from name"}
                                                                        onClick={() => {
                                                                            const currentName = form.getValues(`name.${loc}`) || "";
                                                                            if (currentName.trim()) {
                                                                                const regenerated = slugify(currentName);
                                                                                slugTouchedRef.current[loc] = false;
                                                                                form.setValue(`slug.${loc}`, regenerated, { shouldDirty: true, shouldValidate: true });
                                                                                toast.success(lang?.startsWith("fr") ? "Slug regénéré !" : "Slug regenerated!");
                                                                            }
                                                                        }}
                                                                    >
                                                                        <RotateCcw className="h-3 w-3" />
                                                                        <span className="text-[11px]">{lang?.startsWith("fr") ? "Regénérer" : "Regenerate"}</span>
                                                                    </Button>
                                                                </div>

                                                                <div className="min-w-0 overflow-hidden">
                                                                    <Badge
                                                                        variant="secondary"
                                                                        className="font-mono text-[11px] px-2 py-0.5 max-w-full truncate block"
                                                                        title={previewUrl}
                                                                    >
                                                                        {previewUrl}
                                                                    </Badge>
                                                                </div>

                                                                <FormControl>
                                                                    <Input
                                                                        placeholder={`slug-${loc}...`}
                                                                        className="font-mono text-sm w-full"
                                                                        {...field}
                                                                        value={field.value || ""}
                                                                        onChange={(e) => handleSlugChange(loc, e.target.value, field.onChange)}
                                                                        onBlur={() => handleSlugBlur(loc, field.onBlur)}
                                                                    />
                                                                </FormControl>
                                                                <FormDescription>
                                                                    {lang?.startsWith("fr")
                                                                        ? "Segment d'URL public. Formaté automatiquement en minuscules avec des traits d'union."
                                                                        : "Public URL path segment. Automatically formatted to lowercase with hyphens."}
                                                                </FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name={`status.${loc}`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>{lang?.startsWith("fr") ? "Statut de publication" : "Publication Status"}</FormLabel>
                                                                <Select onValueChange={field.onChange} value={field.value || "draft"}>
                                                                    <FormControl>
                                                                        <SelectTrigger>
                                                                            <SelectValue />
                                                                        </SelectTrigger>
                                                                    </FormControl>
                                                                    <SelectContent>
                                                                        <SelectItem value="published">{lang?.startsWith("fr") ? "Publié (Visible)" : "Published (Visible)"}</SelectItem>
                                                                        <SelectItem value="draft">{lang?.startsWith("fr") ? "Brouillon (Masqué)" : "Draft (Hidden)"}</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                </TabsContent>
                                            );
                                        })}
                                    </Tabs>
                                ) : (
                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name={`slug.${locales[0]}`}
                                            render={({ field }) => {
                                                const singleLoc = locales[0] || defaultLocale;
                                                const currentCatalogSlug = catalogSlugs?.[singleLoc] || (singleLoc === 'fr' ? 'boutique' : 'shop');
                                                const selectedCatIds = form.watch("categoryIds") || (form.watch("categoryId") ? [form.watch("categoryId")] : []);
                                                const parentCat = categories.find((c) => selectedCatIds.includes(c.id));
                                                const parentCatSlug = getCategorySlugForLocale(parentCat, singleLoc);
                                                const previewUrl = `/${singleLoc}/${currentCatalogSlug}/${parentCatSlug}/${field.value || "slug"}`;

                                                return (
                                                    <FormItem className="min-w-0 space-y-2">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <FormLabel>{dict.slug || (lang?.startsWith("fr") ? "Slug (URL)" : "Slug (URL)")} <span className="text-destructive ml-1">*</span></FormLabel>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 px-1.5 text-xs text-muted-foreground hover:text-primary cursor-pointer gap-1 shrink-0"
                                                                title={lang?.startsWith("fr") ? "Regénérer depuis le nom" : "Regenerate from name"}
                                                                onClick={() => {
                                                                    const currentName = form.getValues(`name.${locales[0]}`) || "";
                                                                    if (currentName.trim()) {
                                                                        const regenerated = slugify(currentName);
                                                                        slugTouchedRef.current[locales[0]] = false;
                                                                        form.setValue(`slug.${locales[0]}`, regenerated, { shouldDirty: true, shouldValidate: true });
                                                                        toast.success(lang?.startsWith("fr") ? "Slug regénéré !" : "Slug regenerated!");
                                                                    }
                                                                }}
                                                            >
                                                                <RotateCcw className="h-3 w-3" />
                                                                <span className="text-[11px]">{lang?.startsWith("fr") ? "Regénérer" : "Regenerate"}</span>
                                                            </Button>
                                                        </div>

                                                        <div className="min-w-0 overflow-hidden">
                                                            <Badge
                                                                variant="secondary"
                                                                className="font-mono text-[11px] px-2 py-0.5 max-w-full truncate block"
                                                                title={previewUrl}
                                                            >
                                                                {previewUrl}
                                                            </Badge>
                                                        </div>

                                                        <FormControl>
                                                            <Input
                                                                placeholder="product-slug..."
                                                                className="font-mono text-sm w-full"
                                                                {...field}
                                                                value={field.value || ""}
                                                                onChange={(e) => handleSlugChange(locales[0], e.target.value, field.onChange)}
                                                                onBlur={() => handleSlugBlur(locales[0], field.onBlur)}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            {lang?.startsWith("fr")
                                                                ? "Segment d'URL public. Formaté automatiquement en minuscules avec des traits d'union."
                                                                : "Public URL path segment. Automatically formatted to lowercase with hyphens."}
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                );
                                            }}
                                        />

                                        <FormField
                                            control={form.control}
                                            name={`status.${locales[0]}`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{lang?.startsWith("fr") ? "Statut de publication" : "Publication Status"}</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value || "draft"}>
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="published">{lang?.startsWith("fr") ? "Publié (Visible)" : "Published (Visible)"}</SelectItem>
                                                            <SelectItem value="draft">{lang?.startsWith("fr") ? "Brouillon (Masqué)" : "Draft (Hidden)"}</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Submit Action Bar */}
                <div className="sticky bottom-0 z-40 flex items-center justify-end gap-4 border-t border-border bg-background p-4 sm:px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] mt-auto -mx-4 sm:-mx-8">
                    {initialData?.id && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button type="button" variant="destructive" disabled={isLoading} className="cursor-pointer mr-auto">
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

                    {initialData?.id && (() => {
                        const activeCatalog = catalogSlugs?.[activeLang] || (activeLang === 'fr' ? 'boutique' : 'shop');
                        const selectedCatIds = form.watch("categoryIds") || (initialData.categoryIds || (initialData.categoryId ? [initialData.categoryId] : []));
                        const parentCat = categories.find((c) => selectedCatIds.includes(c.id)) || categories[0];
                        const parentCatSlug = getCategorySlugForLocale(parentCat, activeLang);
                        const activeProdSlug = form.watch(`slug.${activeLang}`) || (initialData?.slug as any)?.[activeLang] || (activeLang === 'fr' ? (initialData as any).slugFr : (initialData as any).slugEn) || (typeof initialData.slug === 'string' ? initialData.slug : initialData.id);
                        return (
                            <Button
                                variant="outline"
                                asChild
                                type="button"
                                className="border border-primary text-primary bg-transparent hover:bg-primary hover:text-white transition-colors cursor-pointer"
                            >
                                <Link
                                    href={`/${activeLang}/${activeCatalog}/${parentCatSlug}/${activeProdSlug}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <ExternalLink className="mr-2 h-4 w-4" />
                                    {lang === 'fr' ? 'Voir sur le site' : 'View on website'}
                                </Link>
                            </Button>
                        );
                    })()}

                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="bg-primary text-primary-foreground hover:opacity-90 text-white px-6 cursor-pointer"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isUploading ? (dict.imageUploading || "Uploading image...") : isDeleting ? (dict.deleting || "Deleting...") : (dict.submitting || "Saving...")}
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {dict.submit || "Save"}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

export const AdminProductForm = ProductForm;
