"use client";

import React, { useState, useTransition, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
    Upload, 
    Trash2, 
    Loader2, 
    Save, 
    Image as ImageIcon,
    BookOpen,
    ExternalLink,
    ShoppingBag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StoreSettings } from "@/types/database";
import { catalogSettingsSchema, CatalogSettingsFormData } from "@/schemas/settings";
import { updateCatalogSettings } from "@/actions/settings";
import { uploadBrandAsset } from "@/lib/firebase-storage";
import { useBrand } from "@/components/providers/BrandProvider";
import { getLocaleDisplayName } from "@/lib/i18n";
import Link from "next/link";

interface CatalogSettingsFormProps {
    initialData: StoreSettings;
    lang: string;
    dict?: Record<string, string>;
}

export function CatalogSettingsForm({ initialData, lang, dict }: CatalogSettingsFormProps) {
    const router = useRouter();
    const { supportedLocales, defaultLocale, isMultiLocale } = useBrand();
    const [isPending, startTransition] = useTransition();

    const [isUploadingCatalogBanner, setIsUploadingCatalogBanner] = useState(false);
    const catalogBannerInputRef = useRef<HTMLInputElement>(null);

    const defaultCatalogTitle: Record<string, string> = {};
    const defaultCatalogDesc: Record<string, string> = {};

    supportedLocales.forEach((loc) => {
        defaultCatalogTitle[loc] = initialData.catalogTitle?.[loc] || (loc === "fr" ? "Boutique" : "Shop");
        defaultCatalogDesc[loc] = initialData.catalogDescription?.[loc] || initialData.catalogDescription?.en || "";
    });

    const form = useForm<CatalogSettingsFormData>({
        resolver: zodResolver(catalogSettingsSchema) as any,
        defaultValues: {
            catalogSlug: initialData.catalogSlug || "shop",
            catalogTitle: defaultCatalogTitle,
            catalogDescription: defaultCatalogDesc,
            catalogBannerUrl: initialData.catalogBannerUrl || "",
        },
    });

    const catalogBannerUrlValue = form.watch("catalogBannerUrl");
    const currentSlug = form.watch("catalogSlug") || "shop";

    const handleCatalogBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingCatalogBanner(true);
        try {
            const downloadUrl = await uploadBrandAsset(file, "hero");
            form.setValue("catalogBannerUrl", downloadUrl, { shouldValidate: true, shouldDirty: true });
            toast.success(lang === "fr" ? "Bannière du catalogue téléversée avec succès !" : "Catalog banner uploaded successfully!");
        } catch (error: any) {
            console.error(error);
            toast.error(error?.message || (lang === "fr" ? "Échec du téléversement de la bannière" : "Failed to upload catalog banner"));
        } finally {
            setIsUploadingCatalogBanner(false);
        }
    };

    const onSubmit = (values: CatalogSettingsFormData) => {
        startTransition(async () => {
            const res = await updateCatalogSettings(values);
            if (res.success) {
                toast.success(lang === "fr" ? "Paramètres du catalogue enregistrés avec succès !" : "Catalog settings updated successfully!");
                router.refresh();
            } else {
                toast.error(res.error || (lang === "fr" ? "Échec de l'enregistrement des paramètres" : "Failed to save catalog settings"));
            }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* 1. Display Titles & Descriptions Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <BookOpen className="h-5 w-5 text-primary" />
                            {lang === "fr" ? "Titres d'Affichage & Descriptions" : "Display Titles & Descriptions"}
                        </CardTitle>
                        <CardDescription>
                            {lang === "fr"
                                ? "Configurez les titres et descriptions multilingues utilisés dans la navigation, le pied de page et les métadonnées SEO."
                                : "Configure multilingual titles and descriptions used across navigation menus, footer links, and SEO metadata."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Multilingual Catalog Titles */}
                        <div className="space-y-3">
                            <FormLabel className="text-sm font-medium">
                                {lang === "fr" ? "Titre Public du Catalogue" : "Catalog Display Title"}
                            </FormLabel>
                            {isMultiLocale ? (
                                <Tabs defaultValue={defaultLocale} className="w-full">
                                    <TabsList className="mb-4">
                                        {supportedLocales.map((loc) => (
                                            <TabsTrigger key={loc} value={loc} className="uppercase text-xs">
                                                {getLocaleDisplayName(loc)} ({loc})
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                    {supportedLocales.map((loc) => (
                                        <TabsContent key={loc} value={loc} className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name={`catalogTitle.${loc}`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Title ({getLocaleDisplayName(loc)})</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder={loc === "fr" ? "e.g. Boutique ou Galerie" : "e.g. Shop or Gallery"} {...field} />
                                                        </FormControl>
                                                        <FormDescription>
                                                            {lang === "fr" 
                                                                ? `Utilisé dans la barre de navigation, le pied de page et l'en-tête pour ${getLocaleDisplayName(loc)}.`
                                                                : `Used in navigation bars, footers, and page headings for ${getLocaleDisplayName(loc)}.`}
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            ) : (
                                <FormField
                                    control={form.control}
                                    name={`catalogTitle.${defaultLocale}`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input placeholder="e.g. Shop or Gallery" {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Used in navigation bars, footers, and page headings.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        {/* Multilingual Catalog Description */}
                        <div className="space-y-3 pt-4 border-t">
                            <FormLabel className="text-sm font-medium">
                                {lang === "fr" ? "Description du Catalogue" : "Catalog Description"}
                            </FormLabel>
                            {isMultiLocale ? (
                                <Tabs defaultValue={defaultLocale} className="w-full">
                                    <TabsList className="mb-4">
                                        {supportedLocales.map((loc) => (
                                            <TabsTrigger key={loc} value={loc} className="uppercase text-xs">
                                                {getLocaleDisplayName(loc)} ({loc})
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                    {supportedLocales.map((loc) => (
                                        <TabsContent key={loc} value={loc} className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name={`catalogDescription.${loc}`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Description ({getLocaleDisplayName(loc)})</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                rows={3}
                                                                placeholder={loc === "fr" ? "e.g. Découvrez notre sélection exclusive d'œuvres contemporaines..." : "e.g. Discover our exclusive curated collection..."}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            {lang === "fr"
                                                                ? `Affiché sur la bannière de la page catalogue et utilisé pour le SEO en ${getLocaleDisplayName(loc)}.`
                                                                : `Displayed on the catalog banner and used for SEO metadata in ${getLocaleDisplayName(loc)}.`}
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </TabsContent>
                                    ))}
                                </Tabs>
                            ) : (
                                <FormField
                                    control={form.control}
                                    name={`catalogDescription.${defaultLocale}`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Textarea
                                                    rows={3}
                                                    placeholder="e.g. Discover our exclusive curated collection..."
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormDescription>
                                                Displayed on the catalog banner and used for SEO metadata.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* 2. Catalog Archive Banner Image Card */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between text-lg">
                            <span className="flex items-center gap-2">
                                <ImageIcon className="h-5 w-5 text-primary" />
                                {lang === "fr" ? "Bannière d'Archive du Catalogue" : "Catalog Archive Banner Image"}
                            </span>
                            {catalogBannerUrlValue && (
                                <Badge variant="outline" className="text-[10px]">Active</Badge>
                            )}
                        </CardTitle>
                        <CardDescription>
                            {lang === "fr"
                                ? "Image haute résolution affichée en haut de la page archive principale du catalogue lorsqu'aucune catégorie spécifique n'est sélectionnée."
                                : "High-resolution banner displayed on the main catalog archive page when no specific category is selected."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="border rounded-lg p-4 bg-background/50 flex flex-col items-center justify-center min-h-[180px] gap-3 relative overflow-hidden">
                            {catalogBannerUrlValue ? (
                                <div className="w-full flex flex-col items-center gap-3">
                                    <div className="relative w-full h-48 bg-background rounded-lg border overflow-hidden">
                                        <Image
                                            src={catalogBannerUrlValue}
                                            alt="Catalog Banner"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => catalogBannerInputRef.current?.click()}
                                            disabled={isUploadingCatalogBanner || isPending}
                                            className="cursor-pointer"
                                        >
                                            {isUploadingCatalogBanner ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                                            {lang === "fr" ? "Changer la bannière" : "Change Banner"}
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="text-destructive hover:bg-destructive/10 cursor-pointer"
                                            onClick={() => form.setValue("catalogBannerUrl", "", { shouldDirty: true })}
                                            disabled={isUploadingCatalogBanner || isPending}
                                        >
                                            <Trash2 className="h-3.5 w-3.5 mr-1" />
                                            {lang === "fr" ? "Supprimer" : "Remove"}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-center py-6">
                                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground">
                                        {lang === "fr" ? "Recommandé : 1920×800px paysage (JPEG, PNG, WebP)" : "Recommended: 1920×800px landscape image (JPEG, PNG, WebP)"}
                                    </p>
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => catalogBannerInputRef.current?.click()}
                                        disabled={isUploadingCatalogBanner || isPending}
                                        className="mt-1 cursor-pointer"
                                    >
                                        {isUploadingCatalogBanner ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                                        {lang === "fr" ? "Téléverser la Bannière" : "Upload Catalog Banner"}
                                    </Button>
                                </div>
                            )}
                            <input
                                type="file"
                                ref={catalogBannerInputRef}
                                onChange={handleCatalogBannerUpload}
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="catalogBannerUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <Input placeholder="Direct URL or uploaded path" {...field} value={field.value || ""} className="text-xs font-mono" />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        {lang === "fr"
                                            ? "Chemin d'accès ou URL publique de l'image de fond pour la page index du catalogue."
                                            : "Direct URL or local static asset path for the catalog index hero banner."}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* 3. Catalog Routing & URL Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <ShoppingBag className="h-5 w-5 text-primary" />
                                {lang === "fr" ? "Routage du Catalogue & URL" : "Catalog Routing & URL"}
                            </CardTitle>
                            <Button asChild variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground">
                                <Link href={`/${lang}/${currentSlug}`} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    {lang === "fr" ? "Voir le catalogue" : "View Catalog"}
                                </Link>
                            </Button>
                        </div>
                        <CardDescription>
                            {lang === "fr" 
                                ? "Définissez le segment d'URL public utilisé pour accéder à l'ensemble du catalogue de produits et des œuvres."
                                : "Define the public URL path segment used to access the product catalog and artworks archive."}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="catalogSlug"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel>{lang === "fr" ? "Slug URL du Catalogue" : "Catalog URL Slug"}</FormLabel>
                                        <Badge variant="secondary" className="font-mono text-xs">
                                            /{lang}/{field.value || "shop"}
                                        </Badge>
                                    </div>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g. artworks, shop, boutique, galerie"
                                            value={field.value}
                                            onChange={(e) => {
                                                const cleanSlug = e.target.value
                                                    .toLowerCase()
                                                    .replace(/\s+/g, "-")
                                                    .replace(/[^a-z0-9-]/g, "")
                                                    .replace(/-+/g, "-");
                                                field.onChange(cleanSlug);
                                            }}
                                            className="font-mono text-sm max-w-md"
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {lang === "fr"
                                            ? "Formaté automatiquement en minuscules avec des traits d'union (ex: artworks, boutique, shop, galerie)."
                                            : "Automatically formatted to lowercase with hyphens (e.g. artworks, shop, boutique, gallery)."}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Submit Action Bar */}
                <div className="flex items-center justify-end gap-4 pt-4 border-t sticky bottom-4 bg-background/95 backdrop-blur p-4 rounded-lg border shadow-sm">
                    <Button
                        type="submit"
                        disabled={isPending || isUploadingCatalogBanner}
                        className="px-6 cursor-pointer"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {lang === "fr" ? "Enregistrement..." : "Saving..."}
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {lang === "fr" ? "Enregistrer les modifications" : "Save Catalog Settings"}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
