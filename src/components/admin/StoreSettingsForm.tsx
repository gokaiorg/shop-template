"use client";

import React, { useState, useTransition } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
    Trash2, 
    Loader2, 
    Save, 
    Globe, 
    Sparkles,
    Palette,
    Coins,
    Plus,
    Share2,
    ExternalLink,
} from "lucide-react";
import { AdminImageDropzone } from "@/components/admin/AdminImageDropzone";

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
import { globalSettingsSchema, GlobalSettingsFormData } from "@/schemas/settings";
import { updateGlobalSettings } from "@/actions/settings";
import { uploadBrandAsset } from "@/lib/firebase-storage";
import { useBrand } from "@/components/providers/BrandProvider";
import { getLocaleDisplayName } from "@/lib/i18n";

interface StoreSettingsFormProps {
    initialData: StoreSettings;
    lang: string;
    dict?: Record<string, string>;
    children?: React.ReactNode;
}

export function StoreSettingsForm({ initialData, lang, dict, children }: StoreSettingsFormProps) {
    const router = useRouter();
    const { brandKey, supportedLocales, defaultLocale, isMultiLocale } = useBrand();
    const defaultBrandPrimary = brandKey === "art-fate" ? "#14B3F6" : "#0f172a";
    const [activeLang, setActiveLang] = useState<string>(defaultLocale || lang || "en");
    const [isPending, startTransition] = useTransition();

    const defaultHeroTitle: Record<string, string> = {};
    const defaultHeroDesc: Record<string, string> = {};
    const defaultFooterDesc: Record<string, string> = {};

    supportedLocales.forEach((loc) => {
        defaultHeroTitle[loc] = initialData.heroTitle?.[loc] || initialData.heroTitle?.en || "";
        defaultHeroDesc[loc] = initialData.heroDescription?.[loc] || initialData.heroDescription?.en || "";
        defaultFooterDesc[loc] = initialData.footerDescription?.[loc] || initialData.footerDescription?.en || "";
    });

    const form = useForm<GlobalSettingsFormData>({
        resolver: zodResolver(globalSettingsSchema) as any,
        defaultValues: {
            brandName: initialData.brandName || "",
            logoUrl: initialData.logoUrl || "",
            faviconUrl: initialData.faviconUrl || "",
            primaryColor: initialData.primaryColor || defaultBrandPrimary,
            heroTitle: defaultHeroTitle,
            heroDescription: defaultHeroDesc,
            heroBackgroundImageUrl: initialData.heroBackgroundImageUrl || "",
            footerDescription: defaultFooterDesc,
            footerRightMenuTitle: initialData.footerRightMenuTitle || "Legal",
            socialLinks: initialData.socialLinks || [],
            defaultTheme: initialData.defaultTheme || "system",
            defaultCurrency: initialData.defaultCurrency || "THB",
        },
    });

    const { fields: socialFields, append: appendSocial, remove: removeSocial } = useFieldArray({
        control: form.control,
        name: "socialLinks",
    });

    const onSubmit = (values: GlobalSettingsFormData) => {
        startTransition(async () => {
            const res = await updateGlobalSettings(values);
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 flex flex-col flex-1">
                {/* Brand Identity Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-5 h-5 text-muted-foreground" />
                            <h2 className="text-lg font-medium tracking-tight">
                                {lang === "fr" ? "Identité de marque" : "Brand Identity"}
                            </h2>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            {lang === "fr" 
                                ? "Nom de boutique, logos officiels et couleur du thème." 
                                : "Store name, brand logos, and primary theme color."}
                        </p>
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

                        {/* Dynamic Primary Theme Color */}
                        <FormField
                            control={form.control}
                            name="primaryColor"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center justify-between">
                                        <span>{lang === "fr" ? "Couleur Principale du Thème (Primary)" : "Primary Brand Color"}</span>
                                        {field.value && (
                                            <span className="text-xs font-mono text-muted-foreground uppercase">{field.value}</span>
                                        )}
                                    </FormLabel>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="relative flex items-center justify-center">
                                            <input
                                                type="color"
                                                value={field.value || defaultBrandPrimary}
                                                onChange={(e) => field.onChange(e.target.value)}
                                                className="h-10 w-14 cursor-pointer rounded-md border border-input bg-transparent p-1 shadow-xs"
                                                title={lang === "fr" ? "Choisir une couleur" : "Choose color"}
                                            />
                                        </div>
                                        <FormControl>
                                            <Input
                                                placeholder={defaultBrandPrimary}
                                                {...field}
                                                value={field.value || ""}
                                                onChange={(e) => field.onChange(e.target.value)}
                                                className="font-mono text-sm max-w-[180px]"
                                            />
                                        </FormControl>
                                        <div
                                            className="h-10 px-4 rounded-md flex items-center justify-center text-xs font-medium border shadow-xs transition-colors"
                                            style={{
                                                backgroundColor: field.value || defaultBrandPrimary,
                                                color: "#ffffff",
                                            }}
                                        >
                                            {lang === "fr" ? "Aperçu du bouton" : "Button Preview"}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => field.onChange(defaultBrandPrimary)}
                                            className="text-xs cursor-pointer"
                                        >
                                            {lang === "fr" ? "Réinitialiser" : "Reset"} ({defaultBrandPrimary})
                                        </Button>
                                    </div>
                                    <FormDescription>
                                        {lang === "fr"
                                            ? `Couleur utilisée pour les boutons, liens actifs, survols et badges de l'ensemble du site. Repli par défaut : ${defaultBrandPrimary}.`
                                            : `Color used across buttons, active navigation states, hover effects, and category pills. Default fallback: ${defaultBrandPrimary}.`}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Media Assets (Logo & Favicon) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t">
                            {/* Logo Asset Upload */}
                            <FormField
                                control={form.control}
                                name="logoUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center justify-between">
                                            <span>{lang === "fr" ? "Logo de la boutique" : "Brand Logo"}</span>
                                            {field.value && (
                                                <Badge variant="outline" className="text-[10px]">Active</Badge>
                                            )}
                                        </FormLabel>
                                        <FormControl>
                                            <AdminImageDropzone
                                                value={field.value}
                                                onChange={(url) => field.onChange(url)}
                                                maxFiles={1}
                                                aspectRatio="square"
                                                recommendedText={
                                                    lang === "fr"
                                                        ? "PNG, SVG ou WebP recommandé"
                                                        : "PNG, SVG, or WebP recommended"
                                                }
                                                onUpload={(file) => uploadBrandAsset(file, "logo")}
                                                lang={lang}
                                                disabled={isPending}
                                            />
                                        </FormControl>
                                        <div className="pt-2">
                                            <FormLabel className="text-xs text-muted-foreground">
                                                {lang === "fr" ? "Ou saisir une URL directe :" : "Or enter direct URL:"}
                                            </FormLabel>
                                            <Input
                                                placeholder="Direct URL or uploaded path"
                                                {...field}
                                                value={field.value || ""}
                                                className="mt-1 text-xs font-mono"
                                                disabled={isPending}
                                            />
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Favicon Asset Upload */}
                            <FormField
                                control={form.control}
                                name="faviconUrl"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center justify-between">
                                            <span>{lang === "fr" ? "Icône Favicon" : "Favicon Icon"}</span>
                                            {field.value && (
                                                <Badge variant="outline" className="text-[10px]">Active</Badge>
                                            )}
                                        </FormLabel>
                                        <FormControl>
                                            <AdminImageDropzone
                                                value={field.value}
                                                onChange={(url) => field.onChange(url)}
                                                maxFiles={1}
                                                aspectRatio="square"
                                                recommendedText={
                                                    lang === "fr"
                                                        ? "ICO, PNG ou SVG (32×32px)"
                                                        : "ICO, PNG, or SVG (32×32px)"
                                                }
                                                onUpload={(file) => uploadBrandAsset(file, "favicon")}
                                                lang={lang}
                                                disabled={isPending}
                                            />
                                        </FormControl>
                                        <div className="pt-2">
                                            <FormLabel className="text-xs text-muted-foreground">
                                                {lang === "fr" ? "Ou saisir une URL directe :" : "Or enter direct URL:"}
                                            </FormLabel>
                                            <Input
                                                placeholder="Direct URL or uploaded path"
                                                {...field}
                                                value={field.value || ""}
                                                className="mt-1 text-xs font-mono"
                                                disabled={isPending}
                                            />
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Homepage Hero Section */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-1">
                            <Globe className="w-5 h-5 text-muted-foreground" />
                            <h2 className="text-lg font-medium tracking-tight">
                                {lang === "fr" ? "Bannière d'accueil" : "Homepage Hero"}
                            </h2>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            {lang === "fr"
                                ? "Image d'arrière-plan, titre d'accroche et sous-titre."
                                : "Hero background image, headline title, and subtitle."}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Hero Background Image Upload */}
                        <FormField
                            control={form.control}
                            name="heroBackgroundImageUrl"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center justify-between">
                                        <span>{lang === "fr" ? "Image d'arrière-plan Hero (Parallaxe)" : "Hero Background Image (Parallax)"}</span>
                                        {field.value && (
                                            <Badge variant="outline" className="text-[10px]">Active</Badge>
                                        )}
                                    </FormLabel>
                                    <FormControl>
                                        <AdminImageDropzone
                                            value={field.value}
                                            onChange={(url) => field.onChange(url)}
                                            maxFiles={1}
                                            aspectRatio="banner"
                                            recommendedText={
                                                lang === "fr"
                                                    ? "Paysage haute résolution (1920×1080px+, WebP/JPEG)"
                                                    : "High resolution landscape (1920×1080px+, WebP/JPEG)"
                                            }
                                            onUpload={(file) => uploadBrandAsset(file, "hero")}
                                            lang={lang}
                                            disabled={isPending}
                                        />
                                    </FormControl>
                                    <div className="pt-2">
                                        <FormLabel className="text-xs text-muted-foreground">
                                            {lang === "fr" ? "Ou saisir une URL directe :" : "Or enter direct URL:"}
                                        </FormLabel>
                                        <Input
                                            placeholder="Direct URL or uploaded path"
                                            {...field}
                                            value={field.value || ""}
                                            className="mt-1 text-xs font-mono"
                                            disabled={isPending}
                                        />
                                    </div>
                                    <FormDescription className="text-xs">
                                        {lang === "fr"
                                            ? "L'image d'arrière-plan s'affichera automatiquement avec un effet de parallaxe natif sur la page d'accueil."
                                            : "The background image will automatically render with a native parallax scroll effect on the homepage."}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Hero Text Content */}
                        <div className="border-t pt-4">
                            <h4 className="text-sm font-semibold mb-3">Hero Text Content</h4>
                            {isMultiLocale ? (
                                <Tabs value={activeLang} onValueChange={setActiveLang} className="w-full">
                                    <TabsList className="mb-4">
                                        {supportedLocales.map((loc) => (
                                            <TabsTrigger key={loc} value={loc} className="uppercase text-xs">
                                                {loc.toUpperCase()}
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
                                                        <FormLabel>Hero Title</FormLabel>
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
                                                        <FormLabel>Hero Subtitle / Description</FormLabel>
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
                        <div className="flex items-center gap-2 mb-1">
                            <Palette className="w-5 h-5 text-muted-foreground" />
                            <h2 className="text-lg font-medium tracking-tight">
                                {lang === "fr" ? "Thème & Devise" : "Theme & Currency"}
                            </h2>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            {lang === "fr"
                                ? "Thème visuel par défaut et devise de transaction."
                                : "Default visual theme and store transaction currency."}
                        </p>
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
                        <div className="flex items-center gap-2 mb-1">
                            <Share2 className="w-5 h-5 text-muted-foreground" />
                            <h2 className="text-lg font-medium tracking-tight">
                                {lang === "fr" ? "Pied de page & Réseaux" : "Footer & Social Links"}
                            </h2>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            {lang === "fr"
                                ? "Description de bas de page et liens vers vos réseaux sociaux."
                                : "Footer brand description and social media profile links."}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Footer Description */}
                        <div className="space-y-2">
                            <FormLabel className="text-base font-semibold">Footer Brand Description</FormLabel>
                            <FormDescription>
                                Brief brand summary displayed in the first column of the footer under the brand name.
                            </FormDescription>
                            {isMultiLocale ? (
                                <Tabs value={activeLang} onValueChange={setActiveLang} className="w-full">
                                    <TabsList className="mb-4">
                                        {supportedLocales.map((loc) => (
                                            <TabsTrigger key={loc} value={loc} className="uppercase text-xs">
                                                {loc.toUpperCase()}
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

                        {/* Footer Right Menu Title */}
                        <div className="space-y-2 pt-4 border-t">
                            <FormField
                                control={form.control}
                                name="footerRightMenuTitle"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-base font-semibold">
                                            {lang === "fr" ? "Titre de la colonne de droite du pied de page" : "Footer Right Menu Title"}
                                        </FormLabel>
                                        <FormDescription>
                                            {lang === "fr"
                                                ? "Titre affiché au-dessus des liens de pages dans la colonne de droite du footer (ex: Legal, Pages, Informations)."
                                                : "Title displayed above the custom page links in the right column of the footer (e.g. Legal, Pages, Information)."}
                                        </FormDescription>
                                        <FormControl>
                                            <Input placeholder="Legal" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {children}

                {/* Submit Action Bar */}
                <div className="sticky bottom-0 z-40 flex items-center justify-end gap-4 border-t border-border bg-background p-4 sm:px-6 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] mt-auto -mx-4 sm:-mx-8">
                    <Button
                        variant="outline"
                        asChild
                        type="button"
                        className="border border-primary text-primary bg-transparent hover:bg-primary hover:text-white transition-colors cursor-pointer"
                    >
                        <Link
                            href={`/${lang}`}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            {lang === "fr" ? "Voir le site" : "View website"}
                        </Link>
                    </Button>
                    <Button
                        type="submit"
                        disabled={isPending}
                        className="bg-primary text-primary-foreground hover:opacity-90 text-white px-6 cursor-pointer"
                    >
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {lang === "fr" ? "Enregistrement..." : "Saving Configuration..."}
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                {lang === "fr" ? "Enregistrer la configuration" : "Save Configuration"}
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}
