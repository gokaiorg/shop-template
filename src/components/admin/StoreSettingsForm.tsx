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
    Globe, 
    Image as ImageIcon,
    Sparkles
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

    const logoInputRef = useRef<HTMLInputElement>(null);
    const faviconInputRef = useRef<HTMLInputElement>(null);

    const defaultHeroTitle: Record<string, string> = {};
    const defaultHeroDesc: Record<string, string> = {};

    supportedLocales.forEach((loc) => {
        defaultHeroTitle[loc] = initialData.heroTitle?.[loc] || initialData.heroTitle?.en || "";
        defaultHeroDesc[loc] = initialData.heroDescription?.[loc] || initialData.heroDescription?.en || "";
    });

    const form = useForm<StoreSettingsFormData>({
        resolver: zodResolver(storeSettingsSchema),
        defaultValues: {
            brandName: initialData.brandName || "",
            logoUrl: initialData.logoUrl || "",
            faviconUrl: initialData.faviconUrl || "",
            heroTitle: defaultHeroTitle,
            heroDescription: defaultHeroDesc,
        },
    });

    const logoUrlValue = form.watch("logoUrl");
    const faviconUrlValue = form.watch("faviconUrl");

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
                {/* Brand Identity & Assets Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Sparkles className="h-5 w-5 text-primary" />
                            Store Identity & Media Assets
                        </CardTitle>
                        <CardDescription>
                            Configure your brand name, store logo, and browser favicon.
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
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

                {/* Hero Headline & Description (Dynamic Multilingual) */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Globe className="h-5 w-5 text-primary" />
                            Homepage Hero Section
                        </CardTitle>
                        <CardDescription>
                            Customize the headline and intro copy displayed on the storefront home page.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                </Card>

                {/* Submit Action */}
                <div className="flex justify-end pt-4">
                    <Button type="submit" size="lg" disabled={isPending || isUploadingLogo || isUploadingFavicon} className="px-8 gap-2">
                        {isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Saving Settings...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Save Store Settings
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
