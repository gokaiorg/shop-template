"use client";

import React, { useState, useTransition, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
    Upload, 
    Trash2, 
    Loader2, 
    Save, 
    Globe, 
    Image as ImageIcon,
    Sparkles,
    Palette,
    Coins,
    ShoppingBag,
    Plus,
    Share2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { storeSettingsSchema, StoreSettingsFormData } from "@/schemas/settings";
import { updateStoreSettings } from "@/actions/settings";
import { uploadBrandAsset } from "@/lib/firebase-storage";
import { useBrand } from "@/components/providers/BrandProvider";
import { getLocaleDisplayName } from "@/lib/i18n";

interface StoreSettingsFormProps {
    initialData: StoreSettings;
    lang: string;
    dict?: Record<string, string>;
}

export function StoreSettingsForm({ initialData, lang }: StoreSettingsFormProps) {
    const router = useRouter();
    const { supportedLocales, defaultLocale, isMultiLocale } = useBrand();
    const [isPending, startTransition] = useTransition();

    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
    const [isUploadingHero, setIsUploadingHero] = useState(false);
    const [isUploadingCatalogBanner, setIsUploadingCatalogBanner] = useState(false);

    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);
    const heroInputRef = useRef<HTMLInputElement>(null);
    const catalogBannerInputRef = useRef<HTMLInputElement>(null);

    const defaultHeroTitle: Record<string, string> = {};
    const defaultHeroDesc: Record<string, string> = {};
    const defaultCatalogTitle: Record<string, string> = {};
    const defaultFooterDesc: Record<string, string> = {};

    supportedLocales.forEach((loc) => {
        defaultHeroTitle[loc] = initialData.heroTitle?.[loc] || initialData.heroTitle?.en || "";
        defaultHeroDesc[loc] = initialData.heroDescription?.[loc] || initialData.heroDescription?.en || "";
        defaultCatalogTitle[loc] = initialData.catalogTitle?.[loc] || (loc === "fr" ? "Boutique" : "Shop");
        defaultFooterDesc[loc] = initialData.footerDescription?.[loc] || initialData.footerDescription?.en || "";
    });

    const form = useForm<StoreSettingsFormData>({
        resolver: zodResolver(storeSettingsSchema),
        defaultValues: {
            brandName: initialData.brandName || "",
            logoUrl: initialData.logoUrl || "",
            faviconUrl: initialData.faviconUrl || "",
            heroTitle: defaultHeroTitle,
            heroDescription: defaultHeroDesc,
            heroBackgroundImageUrl: initialData.heroBackgroundImageUrl || "",
            catalogTitle: defaultCatalogTitle,
            catalogSlug: initialData.catalogSlug || "shop",
            catalogBannerUrl: initialData.catalogBannerUrl || "",
            footerDescription: defaultFooterDesc,
            socialLinks: initialData.socialLinks || [],
            defaultTheme: initialData.defaultTheme || "system",
            defaultCurrency: initialData.defaultCurrency || "THB",
        },
    });

    const { fields: socialFields, append: appendSocial, remove: removeSocial } = useFieldArray({
        control: form.control,
        name: "socialLinks",
    });

    const logoUrlValue = form.watch("logoUrl");
    const faviconUrlValue = form.watch("faviconUrl");
    const heroBgUrlValue = form.watch("heroBackgroundImageUrl");
    const catalogBannerUrlValue = form.watch("catalogBannerUrl");

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingLogo(true);
        try {
            const downloadUrl = await uploadBrandAsset(file, "logo");
            form.setValue("logoUrl", downloadUrl, { shouldValidate: true, shouldDirty: true });
            toast.success("Logo uploaded successfully!");
        } catch (error: any) {
            console.error(error);
            toast.error(error?.message || "Failed to upload logo");
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingFavicon(true);
        try {
            const downloadUrl = await uploadBrandAsset(file, "favicon");
            form.setValue("faviconUrl", downloadUrl, { shouldValidate: true, shouldDirty: true });
            toast.success("Favicon uploaded successfully!");
        } catch (error: any) {
            console.error(error);
            toast.error(error?.message || "Failed to upload favicon");
        } finally {
            setIsUploadingFavicon(false);
        }
    };

    const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingHero(true);
        try {
            const downloadUrl = await uploadBrandAsset(file, "hero");
            form.setValue("heroBackgroundImageUrl", downloadUrl, { shouldValidate: true, shouldDirty: true });
            toast.success("Hero background image uploaded successfully!");
        } catch (error: any) {
            console.error(error);
            toast.error(error?.message || "Failed to upload hero image");
        } finally {
            setIsUploadingHero(false);
        }
    };

    const handleCatalogBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingCatalogBanner(true);
        try {
            const downloadUrl = await uploadBrandAsset(file, "hero");
            form.setValue("catalogBannerUrl", downloadUrl, { shouldValidate: true, shouldDirty: true });
            toast.success("Catalog banner uploaded successfully!");
        } catch (error: any) {
            console.error(error);
            toast.error(error?.message || "Failed to upload catalog banner");
        } finally {
            setIsUploadingCatalogBanner(false);
        }
    };

    const onSubmit = (values: StoreSettingsFormData) => {
        startTransition(async () => {
            const res = await updateStoreSettings(values);
            if (res.success) {
                toast.success("Store settings updated successfully!");
                router.refresh();
            } else {
                toast.error(res.error || "Failed to save store settings");
            }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Brand Identity Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Brand Identity
                        </CardTitle>
                        <CardDescription>
                            Configure your brand name, catalog archive routing & display titles, and brand media assets.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <FormField
                            control={form.control}
                            name="brandName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Brand Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Art Fate" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        The public brand name displayed in headers, footers, and metadata.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Catalog Routing & Display Title */}
                        <div className="rounded-lg border p-4 bg-muted/20 space-y-4">
                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                <ShoppingBag className="h-4 w-4 text-primary" />
                                Catalog Routing & Titles
                            </h4>

                            {/* Catalog Slug input */}
                            <FormField
                                control={form.control}
                                name="catalogSlug"
                                render={({ field }) => (
                                    <FormItem>
                                        <div className="flex items-center justify-between">
                                            <FormLabel>Catalog URL Slug</FormLabel>
                                            <Badge variant="secondary" className="font-mono text-xs">
                                                /{lang}/{field.value || 'shop'}
                                            </Badge>
                                        </div>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. shop, galerie, boutique, gallery"
                                                value={field.value}
                                                onChange={(e) => {
                                                    const cleanSlug = e.target.value
                                                        .toLowerCase()
                                                        .replace(/\s+/g, '-')
                                                        .replace(/[^a-z0-9-]/g, '')
                                                        .replace(/-+/g, '-');
                                                    field.onChange(cleanSlug);
                                                }}
                                                className="font-mono text-sm"
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            URL path segment where the catalog is accessed. Automatically formatted to lowercase with hyphens.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Multilingual Catalog Titles */}
                            <div className="space-y-2 pt-2">
                                <FormLabel className="text-sm font-medium">Catalog Display Title</FormLabel>
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
                                                                <Input placeholder={loc === 'fr' ? 'e.g. Boutique ou Galerie' : 'e.g. Shop or Gallery'} {...field} />
                                                            </FormControl>
                                                            <FormDescription>
                                                                Used in navigation bars, footers, and page headings for {getLocaleDisplayName(loc)}.
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

                            {/* Catalog Archive Banner Image */}
                            <div className="space-y-3 pt-3 border-t">
                                <FormLabel className="flex items-center justify-between">
                                    <span>Catalog Archive Banner Image</span>
                                    {catalogBannerUrlValue && (
                                        <Badge variant="outline" className="text-[10px]">Active</Badge>
                                    )}
                                </FormLabel>

                                <div className="border rounded-lg p-4 bg-background/50 flex flex-col items-center justify-center min-h-[160px] gap-3 relative overflow-hidden">
                                    {catalogBannerUrlValue ? (
                                        <div className="w-full flex flex-col items-center gap-3">
                                            <div className="relative w-full h-40 bg-background rounded-lg border overflow-hidden">
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
                                                    Change Banner
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
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-center py-4">
                                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                                            <p className="text-xs text-muted-foreground">High-resolution banner displayed on the main catalog archive page</p>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => catalogBannerInputRef.current?.click()}
                                                disabled={isUploadingCatalogBanner || isPending}
                                                className="mt-1 cursor-pointer"
                                            >
                                                {isUploadingCatalogBanner ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                                                Upload Catalog Banner
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
                                                Background cover image for the catalog index page when no specific category is selected.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        {/* Media Assets (Logo & Favicon) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t">
                            {/* Logo Asset Upload */}
                            <div className="space-y-3">
                                <FormLabel className="flex items-center justify-between">
                                    <span>Brand Logo</span>
                                    {logoUrlValue && (
                                        <Badge variant="outline" className="text-[10px]">Active</Badge>
                                    )}
                                </FormLabel>
                                
                                <div className="border rounded-lg p-4 bg-muted/20 flex flex-col items-center justify-center min-h-[160px] gap-3 relative">
                                    {logoUrlValue ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="relative h-16 w-32 bg-background/80 rounded border p-2 flex items-center justify-center">
                                                <Image
                                                    src={logoUrlValue}
                                                    alt="Brand Logo"
                                                    width={100}
                                                    height={50}
                                                    className="object-contain max-h-full max-w-full"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => logoInputRef.current?.click()}
                                                    disabled={isUploadingLogo || isPending}
                                                >
                                                    {isUploadingLogo ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                                                    Change Logo
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:bg-destructive/10"
                                                    onClick={() => form.setValue("logoUrl", "", { shouldDirty: true })}
                                                    disabled={isUploadingLogo || isPending}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-center">
                                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                            <p className="text-xs text-muted-foreground">PNG, SVG, or WebP recommended</p>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => logoInputRef.current?.click()}
                                                disabled={isUploadingLogo || isPending}
                                            >
                                                {isUploadingLogo ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                                                Upload Logo
                                            </Button>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={logoInputRef}
                                        onChange={handleLogoUpload}
                                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                        className="hidden"
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="logoUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input placeholder="Direct URL or uploaded path" {...field} className="text-xs font-mono" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Favicon Asset Upload */}
                            <div className="space-y-3">
                                <FormLabel className="flex items-center justify-between">
                                    <span>Favicon Icon</span>
                                    {faviconUrlValue && (
                                        <Badge variant="outline" className="text-[10px]">Active</Badge>
                                    )}
                                </FormLabel>

                                <div className="border rounded-lg p-4 bg-muted/20 flex flex-col items-center justify-center min-h-[160px] gap-3 relative">
                                    {faviconUrlValue ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="relative h-12 w-12 bg-background/80 rounded border p-1 flex items-center justify-center">
                                                <Image
                                                    src={faviconUrlValue}
                                                    alt="Favicon"
                                                    width={32}
                                                    height={32}
                                                    className="object-contain"
                                                />
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => faviconInputRef.current?.click()}
                                                    disabled={isUploadingFavicon || isPending}
                                                >
                                                    {isUploadingFavicon ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                                                    Change Favicon
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:bg-destructive/10"
                                                    onClick={() => form.setValue("faviconUrl", "", { shouldDirty: true })}
                                                    disabled={isUploadingFavicon || isPending}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2 text-center">
                                            <Globe className="h-8 w-8 text-muted-foreground" />
                                            <p className="text-xs text-muted-foreground">ICO, PNG, or SVG (32x32px)</p>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                onClick={() => faviconInputRef.current?.click()}
                                                disabled={isUploadingFavicon || isPending}
                                            >
                                                {isUploadingFavicon ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                                                Upload Favicon
                                            </Button>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        ref={faviconInputRef}
                                        onChange={handleFaviconUpload}
                                        accept="image/x-icon,image/png,image/svg+xml"
                                        className="hidden"
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="faviconUrl"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input placeholder="Direct URL or uploaded path" {...field} className="text-xs font-mono" />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Homepage Hero Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Globe className="h-5 w-5 text-primary" />
                            Homepage Hero Section
                        </CardTitle>
                        <CardDescription>
                            Customize the background image (with parallax effect), headline, and intro copy displayed on the storefront home page.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Hero Background Image Upload */}
                        <div className="space-y-3">
                            <FormLabel className="flex items-center justify-between">
                                <span>Hero Background Image (Parallax)</span>
                                {heroBgUrlValue && (
                                    <Badge variant="outline" className="text-[10px]">Active</Badge>
                                )}
                            </FormLabel>

                            <div className="border rounded-lg p-4 bg-muted/20 flex flex-col items-center justify-center min-h-[180px] gap-3 relative overflow-hidden">
                                {heroBgUrlValue ? (
                                    <div className="w-full flex flex-col items-center gap-3">
                                        <div className="relative w-full h-48 bg-background/80 rounded-lg border overflow-hidden">
                                            <Image
                                                src={heroBgUrlValue}
                                                alt="Hero Background"
                                                fill
                                                className="object-cover"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => heroInputRef.current?.click()}
                                                disabled={isUploadingHero || isPending}
                                            >
                                                {isUploadingHero ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                                                Change Image
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:bg-destructive/10"
                                                onClick={() => form.setValue("heroBackgroundImageUrl", "", { shouldDirty: true })}
                                                disabled={isUploadingHero || isPending}
                                            >
                                                <Trash2 className="h-3.5 w-3.5 mr-1" />
                                                Remove
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2 text-center py-6">
                                        <ImageIcon className="h-10 w-10 text-muted-foreground" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-medium">No background image selected</p>
                                            <p className="text-xs text-muted-foreground">High resolution landscape image (1920×1080px or higher, WebP/JPEG) recommended</p>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="sm"
                                            onClick={() => heroInputRef.current?.click()}
                                            disabled={isUploadingHero || isPending}
                                            className="mt-2"
                                        >
                                            {isUploadingHero ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Upload className="h-3.5 w-3.5 mr-1" />}
                                            Upload Hero Background
                                        </Button>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={heroInputRef}
                                    onChange={handleHeroUpload}
                                    accept="image/png,image/jpeg,image/webp"
                                    className="hidden"
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="heroBackgroundImageUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input placeholder="Direct URL or uploaded path" {...field} className="text-xs font-mono" />
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            The background image will automatically render with a native parallax scroll effect on the homepage.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Hero Text Content */}
                        <div className="border-t pt-4">
                            <h4 className="text-sm font-semibold mb-3">Hero Text Content</h4>
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
                                                name={`heroTitle.${loc}`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Hero Title ({getLocaleDisplayName(loc)})</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder={`Hero headline in ${getLocaleDisplayName(loc)}`} {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`heroDescription.${loc}`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Hero Subtitle / Description ({getLocaleDisplayName(loc)})</FormLabel>
                                                        <FormControl>
                                                            <Textarea rows={3} placeholder={`Hero description in ${getLocaleDisplayName(loc)}`} {...field} />
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
                                        name={`heroTitle.${defaultLocale}`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Hero Title</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Main storefront headline" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name={`heroDescription.${defaultLocale}`}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Hero Subtitle / Description</FormLabel>
                                                <FormControl>
                                                    <Textarea rows={3} placeholder="Subheadline introducing your store brand" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Localization Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Palette className="h-5 w-5 text-primary" />
                            Localization
                        </CardTitle>
                        <CardDescription>
                            Configure storefront visual theme enforcement and default transaction currency.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Default Theme */}
                        <FormField
                            control={form.control}
                            name="defaultTheme"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Palette className="h-4 w-4 text-muted-foreground" />
                                        Default Theme
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-full cursor-pointer">
                                                <SelectValue placeholder="Select a default theme" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="system">System Preference (Allows User Toggle)</SelectItem>
                                            <SelectItem value="light">Light Mode (Enforced Across Site)</SelectItem>
                                            <SelectItem value="dark">Dark Mode (Enforced Across Site)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription className="text-xs">
                                        {field.value === "system"
                                            ? "Visitors can freely switch between light and dark modes via header toggle."
                                            : `Site is locked to ${field.value} mode. The theme toggle is hidden.`}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Default Currency */}
                        <FormField
                            control={form.control}
                            name="defaultCurrency"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-2">
                                        <Coins className="h-4 w-4 text-muted-foreground" />
                                        Default Currency
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-full cursor-pointer">
                                                <SelectValue placeholder="Select store currency" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="THB">THB - Thai Baht (฿)</SelectItem>
                                            <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                                            <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                                            <SelectItem value="GBP">GBP - British Pound (£)</SelectItem>
                                            <SelectItem value="JPY">JPY - Japanese Yen (¥)</SelectItem>
                                            <SelectItem value="CAD">CAD - Canadian Dollar ($)</SelectItem>
                                            <SelectItem value="AUD">AUD - Australian Dollar ($)</SelectItem>
                                            <SelectItem value="CHF">CHF - Swiss Franc (CHF)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormDescription className="text-xs">
                                        Used for product price formatting and injected into Stripe payment sessions.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                {/* Footer & Socials Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Share2 className="h-5 w-5 text-primary" />
                            Footer & Socials
                        </CardTitle>
                        <CardDescription>
                            Configure the brand description and social media links displayed in the storefront footer.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Footer Description */}
                        <div className="space-y-2">
                            <FormLabel className="text-base font-semibold">Footer Brand Description</FormLabel>
                            <FormDescription>
                                Brief brand summary displayed in the first column of the footer under the brand name.
                            </FormDescription>
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
                                        <TabsContent key={loc} value={loc}>
                                            <FormField
                                                control={form.control}
                                                name={`footerDescription.${loc}`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Textarea
                                                                rows={3}
                                                                placeholder={`Brand description in ${getLocaleDisplayName(loc)}`}
                                                                {...field}
                                                            />
                                                        </FormControl>
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
                                    name={`footerDescription.${defaultLocale}`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Textarea rows={3} placeholder="Brand description for the footer" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        {/* Social Links */}
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-base font-semibold">Social Media Links</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Add profiles such as Instagram, X, Facebook, LinkedIn, TikTok, etc.
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => appendSocial({ platform: "", url: "" })}
                                    className="flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Link
                                </Button>
                            </div>

                            {socialFields.length === 0 ? (
                                <p className="text-sm text-muted-foreground italic py-2">
                                    No social links configured. Click &quot;Add Link&quot; to add one.
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {socialFields.map((fieldItem, index) => (
                                        <div key={fieldItem.id} className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1">
                                                <FormField
                                                    control={form.control}
                                                    name={`socialLinks.${index}.platform`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs">Platform</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="e.g. Instagram, X, TikTok" {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name={`socialLinks.${index}.url`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-xs">URL</FormLabel>
                                                            <FormControl>
                                                                <Input placeholder="https://..." {...field} />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeSocial(index)}
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10 mt-6 cursor-pointer"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Submit Action */}
                <div className="flex justify-end pt-4">
                    <Button type="submit" size="lg" disabled={isPending || isUploadingLogo || isUploadingFavicon || isUploadingHero || isUploadingCatalogBanner} className="px-8 gap-2">
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving Configuration...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Save Configuration
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
