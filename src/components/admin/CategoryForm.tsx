"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Trash2, Loader2, ImageIcon, Upload, Save, ExternalLink, RotateCcw, FileText, LayoutTemplate } from "lucide-react";
import Link from "next/link";
import { createCategory, updateCategory, deleteCategory } from "@/actions/admin";
import { categorySchema } from "@/schemas/admin";
import { uploadProductImage } from "@/lib/firebase-storage";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Category } from "@/types/database";
import { useBrand } from "@/components/providers/BrandProvider";

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

export function CategoryForm({ dict, lang, initialData }: { dict: Record<string, string>; lang: string; initialData?: Category }) {
    const router = useRouter();
    const { supportedLocales: locales, defaultLocale, isMultiLocale: isMulti, catalogSlug } = useBrand();
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
            status: (initialData?.status as "draft" | "published") || "published",
            imageUrl: initialData?.imageUrl || "",
            order: initialData?.order !== undefined ? initialData.order : Date.now(),
        },
    });

    const isNew = !initialData?.id;
    const slugTouchedRef = useRef<Record<string, boolean>>({});

    // Live auto-slug generation on name typing (both in creation and edit)
    useEffect(() => {
        // 1. In creation mode, generate initial slug if name has value
        if (isNew) {
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
        }

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

    const onInvalid = (errors: any) => {
        console.warn("Category form validation errors:", errors);
        toast.error(
            lang?.startsWith("fr")
                ? "Veuillez compléter les champs obligatoires."
                : "Please complete the required fields."
        );
    };

    function onSubmit(values: z.infer<typeof categorySchema>) {
        let hasError = false;

        if (!values.name?.[defaultLocale]?.trim()) {
            form.setError(`name.${defaultLocale}` as any, {
                type: "manual",
                message: lang?.startsWith("fr") ? "Le nom de la catégorie est obligatoire." : "Category name is required.",
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

        if (hasError) {
            toast.error(
                lang?.startsWith("fr")
                    ? "Veuillez compléter les champs obligatoires."
                    : "Please complete the required fields."
            );
            return;
        }

        const completeName: Record<string, string> = { ...values.name };
        const completeSlug: Record<string, string> = { ...values.slug };
        const completeIntro: Record<string, string> = { ...(values.intro || {}) };
        const completeDesc: Record<string, string> = { ...values.description };

        locales.forEach((loc) => {
            if (!completeName[loc]) completeName[loc] = completeName[defaultLocale] || "";
            if (!completeSlug[loc]) completeSlug[loc] = completeSlug[defaultLocale] || "";
            if (completeSlug[loc]) completeSlug[loc] = slugify(completeSlug[loc]);
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
            <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8 flex flex-col flex-1">
                {/* Hidden Position / Order Field - Managed via Drag & Drop in categories table */}
                <input type="hidden" {...form.register("order", { valueAsNumber: true })} />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Colonne principale (Gauche) */}
                    <div className="col-span-1 lg:col-span-2 min-w-0 space-y-8">
                        {/* Bloc 1 : Informations Générales */}
                        <Card className="min-w-0 overflow-hidden">
                            <CardHeader>
                                <div className="flex items-center gap-2 mb-1">
                                    <FileText className="w-5 h-5 text-muted-foreground" />
                                    <h2 className="text-lg font-medium tracking-tight">
                                        {lang?.startsWith("fr") ? "Informations Générales" : "General Information"}
                                    </h2>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {lang?.startsWith("fr")
                                        ? "Nom, accroche et descriptions de la catégorie."
                                        : "Category name, intro, and descriptions."}
                                </p>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {isMulti ? (
                                    <Tabs defaultValue={defaultLocale} className="w-full">
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

                        {/* Category Banner Image */}
                        <Card className="min-w-0 overflow-hidden">
                            <CardHeader>
                                <div className="flex items-center gap-2 mb-1">
                                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                    <h2 className="text-lg font-medium tracking-tight">
                                        {lang?.startsWith("fr") ? "Bannière de catégorie" : "Category Banner"}
                                    </h2>
                                </div>
                                <p className="text-sm text-muted-foreground mb-4">
                                    {lang?.startsWith("fr") 
                                        ? "Image d'en-tête et visuel d'aperçu dans le catalogue."
                                        : "Header banner and preview card visual in the catalog."}
                                </p>
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
                    </div>

                    {/* Colonne secondaire (Droite) */}
                    <div className="col-span-1 min-w-0 space-y-8">
                        {/* URL & Publication Card */}
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
                                    <Tabs defaultValue={defaultLocale} className="w-full">
                                        <TabsList className="mb-4">
                                            {locales.map((loc) => (
                                                <TabsTrigger key={loc} value={loc} className="uppercase text-xs">
                                                    {loc.toUpperCase()}
                                                </TabsTrigger>
                                            ))}
                                        </TabsList>
                                        {locales.map((loc) => {
                                            const currentSlugVal = form.watch(`slug.${loc}`) || "";
                                            return (
                                                <TabsContent key={loc} value={loc} className="space-y-4">
                                                    <FormField
                                                        control={form.control}
                                                        name={`slug.${loc}`}
                                                        render={({ field }) => (
                                                            <FormItem className="min-w-0 space-y-2">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <FormLabel>{dict.slug || "Slug"} <span className="text-destructive ml-1">*</span></FormLabel>
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
                                                                        title={`/${lang}/${catalogSlug || "shop"}?category=${currentSlugVal || "slug"}`}
                                                                    >
                                                                        /{lang}/{catalogSlug || "shop"}?category={currentSlugVal || "slug"}
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
                                                </TabsContent>
                                            );
                                        })}
                                    </Tabs>
                                ) : (
                                    <FormField
                                        control={form.control}
                                        name={`slug.${locales[0]}`}
                                        render={({ field }) => (
                                            <FormItem className="min-w-0 space-y-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <FormLabel>{dict.slug || "Slug"} <span className="text-destructive ml-1">*</span></FormLabel>
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
                                                        title={`/${lang}/${catalogSlug || "shop"}?category=${field.value || "slug"}`}
                                                    >
                                                        /{lang}/{catalogSlug || "shop"}?category={field.value || "slug"}
                                                    </Badge>
                                                </div>

                                                <FormControl>
                                                    <Input
                                                        placeholder={`slug-${locales[0]}...`}
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
                                        )}
                                    />
                                )}

                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                {lang?.startsWith("fr") ? "Statut de publication" : "Publication Status"}
                                            </FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || "published"}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="published">
                                                        {lang?.startsWith("fr") ? "Publié (Visible)" : "Published (Visible)"}
                                                    </SelectItem>
                                                    <SelectItem value="draft">
                                                        {lang?.startsWith("fr") ? "Brouillon (Masqué)" : "Draft (Hidden)"}
                                                    </SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
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

                    {initialData?.id && (
                        <Button
                            variant="outline"
                            asChild
                            type="button"
                            className="border border-primary text-primary bg-transparent hover:bg-primary hover:text-white transition-colors cursor-pointer"
                        >
                            <Link
                                href={`/${lang}/${catalogSlug || 'shop'}?category=${getLocalizedField(initialData.slug, lang) || (lang === 'fr' ? (initialData as any).slugFr : (initialData as any).slugEn) || (typeof initialData.slug === 'string' ? initialData.slug : initialData.id)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                <ExternalLink className="mr-2 h-4 w-4" />
                                {lang === 'fr' ? 'Voir sur le site' : 'View on website'}
                            </Link>
                        </Button>
                    )}

                    <Button
                        type="submit"
                        disabled={isLoading || isUploadingImage}
                        className="bg-primary text-primary-foreground hover:opacity-90 text-white px-6 cursor-pointer"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {isDeleting ? (dict.deleting || "Deleting...") : (dict.submitting || "Saving...")}
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
