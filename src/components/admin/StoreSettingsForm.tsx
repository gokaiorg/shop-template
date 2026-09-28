"use client";

import React, { useState, useTransition, useEffect } from "react";
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
    Square,
    Type,
    ImageIcon,
    Plus,
    Share2,
    LayoutGrid,
    Package,
    ExternalLink,
    ArrowLeft,
    Mail,
    Phone,
    MapPin,
    Clock,
    Search,
    Building2,
} from "lucide-react";
import { FONT_OPTIONS_LIST } from "@/app/fonts";
import { AdminImageDropzone } from "@/components/admin/AdminImageDropzone";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
    const defaultCategoriesTitle: Record<string, string> = {};
    const defaultCategoriesSubtitle: Record<string, string> = {};
    const defaultProductsTitle: Record<string, string> = {};
    const defaultProductsSubtitle: Record<string, string> = {};
    const defaultFooterDesc: Record<string, string> = {};
    const defaultFooterRightMenuTitle: Record<string, string> = {};

    supportedLocales.forEach((loc) => {
        defaultHeroTitle[loc] = initialData.heroTitle?.[loc] || initialData.heroTitle?.en || "";
        defaultHeroDesc[loc] = initialData.heroDescription?.[loc] || initialData.heroDescription?.en || "";
        defaultCategoriesTitle[loc] = initialData.categoriesTitle?.[loc] || initialData.categoriesTitle?.en || "";
        defaultCategoriesSubtitle[loc] = initialData.categoriesSubtitle?.[loc] || initialData.categoriesSubtitle?.en || "";
        defaultProductsTitle[loc] = initialData.productsTitle?.[loc] || initialData.productsTitle?.en || "";
        defaultProductsSubtitle[loc] = initialData.productsSubtitle?.[loc] || initialData.productsSubtitle?.en || "";
        defaultFooterDesc[loc] = initialData.footerDescription?.[loc] || initialData.footerDescription?.en || "";
        defaultFooterRightMenuTitle[loc] = initialData.footerRightMenuTitle?.[loc] || initialData.footerRightMenuTitle?.en || (loc === "fr" ? "Légal" : "Legal");
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
            categoriesTitle: defaultCategoriesTitle,
            categoriesSubtitle: defaultCategoriesSubtitle,
            productsTitle: defaultProductsTitle,
            productsSubtitle: defaultProductsSubtitle,
            footerDescription: defaultFooterDesc,
            footerRightMenuTitle: defaultFooterRightMenuTitle,
            socialLinks: initialData.socialLinks || [],
            contactEmail: initialData.contactEmail || "",
            contactPhone: initialData.contactPhone || "",
            supportHoursEn: initialData.supportHoursEn || "",
            supportHoursFr: initialData.supportHoursFr || "",
            seoEntityType: initialData.seoEntityType || "Store",
            seoAddressStreet: initialData.seoAddressStreet || "",
            seoAddressLocality: initialData.seoAddressLocality || "",
            seoPostalCode: initialData.seoPostalCode || "",
            seoCountry: initialData.seoCountry || "",
            defaultTheme: initialData.defaultTheme || "system",
            borderStyle: initialData.borderStyle || "rounded",
            fontFamily: initialData.fontFamily || "Geist",
            defaultCurrency: initialData.defaultCurrency || "THB",
            productImageRatio: initialData.productImageRatio || "default",
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

    useEffect(() => {
        if (typeof window !== "undefined" && window.location.hash) {
            const rawHash = window.location.hash.replace("#", "");
            if (rawHash) {
                const target = document.getElementById(rawHash) || (rawHash === "hero" || rawHash === "homepage-hero" ? document.getElementById("homepage-hero") || document.getElementById("hero") : null);
                if (target) {
                    setTimeout(() => {
                        target.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 150);
                }
            }
        }
    }, []);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 flex flex-col flex-1">
                <div className="flex items-center justify-between">
                        <Link href={`/${lang}/admin/dashboard`} className="flex items-center gap-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors px-3 py-1.5 rounded-md w-fit">
                            <ArrowLeft className="h-4 w-4" />
                            {dict?.back_to_dashboard || (lang === "fr" ? "Retour au tableau de bord" : "Back to dashboard")}
                        </Link>
                </div>

                {/* Theme, Color & Currency Section (Above Brand Identity) */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-1">
                            <Palette className="w-5 h-5 text-muted-foreground" />
                            <h2 className="text-lg font-medium tracking-tight">
                                {lang === "fr" ? "Thème, Couleur & Devise" : "Theme, Color & Currency"}
                            </h2>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            {lang === "fr"
                                ? "Couleur principale du thème, affichage visuel et devise de transaction."
                                : "Primary brand color, visual theme, and store transaction currency."}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
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

                        {/* Theme & Currency Dropdowns */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 pt-4 border-t">
                            {/* Default Theme */}
                            <FormField
                                control={form.control}
                                name="defaultTheme"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Palette className="h-4 w-4 text-muted-foreground" />
                                            {lang === "fr" ? "Thème par défaut" : "Default Theme"}
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="w-full cursor-pointer">
                                                    <SelectValue placeholder="Select a default theme" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="system">{lang === "fr" ? "Préférence système" : "System Preference"}</SelectItem>
                                                <SelectItem value="light">{lang === "fr" ? "Mode clair" : "Light Mode"}</SelectItem>
                                                <SelectItem value="dark">{lang === "fr" ? "Mode sombre" : "Dark Mode"}</SelectItem>
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

                            {/* Typography / Font Family */}
                            <FormField
                                control={form.control}
                                name="fontFamily"
                                render={({ field }) => {
                                    const normalizedFontValue = (() => {
                                        const val = (field.value || "").trim().toLowerCase();
                                        if (val === "space grotesk" || val === "space-grotesk") return "Space Grotesk";
                                        if (val === "manrope") return "Manrope";
                                        if (val === "jersey 25" || val === "jersey-25" || val === "jersey" || val === "pixelify sans" || val === "pixelify-sans" || val === "pixelify") return "Jersey 25";
                                        if (val === "inter") return "Inter";
                                        return "Geist";
                                    })();

                                    return (
                                        <FormItem>
                                            <FormLabel className="flex items-center gap-2">
                                                <Type className="h-4 w-4 text-muted-foreground" />
                                                {lang === "fr" ? "Typographie" : "Typography"}
                                            </FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={normalizedFontValue}
                                                value={normalizedFontValue}
                                            >
                                                <FormControl>
                                                    <SelectTrigger className="w-full cursor-pointer">
                                                        <SelectValue placeholder="Select typography" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Geist">Geist</SelectItem>
                                                    <SelectItem value="Inter">Inter</SelectItem>
                                                    <SelectItem value="Space Grotesk">Space Grotesk</SelectItem>
                                                    <SelectItem value="Manrope">Manrope</SelectItem>
                                                    <SelectItem value="Jersey 25">Jersey 25</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormDescription className="text-xs">
                                                {lang === "fr"
                                                    ? "Police d'écriture globale appliquée à l'ensemble de la boutique."
                                                    : "Global typography applied across the entire storefront."}
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    );
                                }}
                            />

                            {/* Border Style */}
                            <FormField
                                control={form.control}
                                name="borderStyle"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Square className="h-4 w-4 text-muted-foreground" />
                                            {lang === "fr" ? "Style des bordures" : "Border Style"}
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value || "rounded"} value={field.value || "rounded"}>
                                            <FormControl>
                                                <SelectTrigger className="w-full cursor-pointer">
                                                    <SelectValue placeholder="Select border style" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="rounded">{lang === "fr" ? "Arrondi" : "Rounded"}</SelectItem>
                                                <SelectItem value="squared">{lang === "fr" ? "Carré" : "Squared"}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription className="text-xs">
                                            {lang === "fr"
                                                ? "Désactive tous les arrondis (0px) pour un look pixel art ou rétro."
                                                : "Completely disables border-radius (0px) for pixel art or retro aesthetics."}
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
                                            {lang === "fr" ? "Devise par défaut" : "Default Currency"}
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

                            {/* Product Image Ratio */}
                            <FormField
                                control={form.control}
                                name="productImageRatio"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                            {lang === "fr" ? "Ratio d'image produit" : "Product Image Ratio"}
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value || "default"} value={field.value || "default"}>
                                            <FormControl>
                                                <SelectTrigger className="w-full cursor-pointer">
                                                    <SelectValue placeholder={lang === "fr" ? "Sélectionner un ratio" : "Select image ratio"} />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="default">{lang === "fr" ? "Défaut (Rectangulaire)" : "Default (Rectangular)"}</SelectItem>
                                                <SelectItem value="square">{lang === "fr" ? "Carré (1:1)" : "Square (1:1)"}</SelectItem>
                                                <SelectItem value="portrait">{lang === "fr" ? "Portrait (3:4)" : "Portrait (3:4)"}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription className="text-xs">
                                            {lang === "fr"
                                                ? "Format d'affichage des visuels produits dans le catalogue et les grilles."
                                                : "Visual aspect ratio for product cards in catalog grids."}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Brand Identity Section (Positioned Below Theme, Color & Currency) */}
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
                                ? "Nom de boutique et logos officiels." 
                                : "Store name and brand logos."}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="brandName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{lang === "fr" ? "Nom de la marque" : "Brand Name"}</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Green Ghost" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            {lang === "fr"
                                                ? "Le nom public de la marque affiché dans les en-têtes, pieds de page et métadonnées."
                                                : "The public brand name displayed in headers, footers, and metadata."}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Schema.org Entity Type */}
                            <FormField
                                control={form.control}
                                name="seoEntityType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            {lang === "fr" ? "Entité Schema.org" : "Schema.org Entity"}
                                        </FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value || "Store"} value={field.value || "Store"}>
                                            <FormControl>
                                                <SelectTrigger className="w-full cursor-pointer">
                                                    <SelectValue placeholder="Store" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="Store">Store</SelectItem>
                                                <SelectItem value="Dispensary">Dispensary</SelectItem>
                                                <SelectItem value="ArtGallery">ArtGallery</SelectItem>
                                                <SelectItem value="LocalBusiness">LocalBusiness</SelectItem>
                                                <SelectItem value="Organization">Organization</SelectItem>
                                                <SelectItem value="ShoppingCenter">ShoppingCenter</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            {lang === "fr"
                                                ? "Type d'entreprise (@type) pour le Rich Snippet Google."
                                                : "Business schema (@type) for Google Rich Snippets."}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

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
                                                <Badge variant="outline" className="text-xs">Active</Badge>
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
                                                        ? "PNG, SVG, WebP ou AVIF recommandé"
                                                        : "PNG, SVG, WebP, or AVIF recommended"
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
                                                <Badge variant="outline" className="text-xs">Active</Badge>
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
                <Card id="homepage-hero" className="scroll-mt-8 relative">
                    <span id="hero" className="sr-only scroll-mt-8" />
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

                        {/* Hero Background Image Upload */}
                        <FormField
                            control={form.control}
                            name="heroBackgroundImageUrl"
                            render={({ field }) => (
                                <FormItem className="pt-4 border-t">
                                    <FormLabel className="flex items-center justify-between">
                                        <span>{lang === "fr" ? "Image d'arrière-plan Hero (Parallaxe)" : "Hero Background Image (Parallax)"}</span>
                                        {field.value && (
                                            <Badge variant="outline" className="text-xs">Active</Badge>
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
                                                    ? "Paysage haute résolution (1920×1080px+, WebP/JPEG/AVIF)"
                                                    : "High resolution landscape (1920×1080px+, WebP/JPEG/AVIF)"
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
                    </CardContent>
                </Card>

                {/* Categories Section Title (Optional) */}
                <Card id="categories-title" className="scroll-mt-8 relative">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 mb-1">
                                <LayoutGrid className="w-5 h-5 text-muted-foreground" />
                                <h2 className="text-lg font-medium tracking-tight">
                                    {lang === "fr" ? "Titre des Catégories" : "Categories Title"}
                                </h2>
                            </div>
                            <Badge variant="outline" className="text-xs text-muted-foreground font-normal">
                                {lang === "fr" ? "Facultatif" : "Optional"}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            {lang === "fr"
                                ? "Titre d'accroche et sous-titre facultatifs affichés entre le Hero et les cartes de catégories sur la page d'accueil."
                                : "Optional headline title and subtitle displayed between the Hero and the category preview cards on the homepage."}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
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
                                            name={`categoriesTitle.${loc}`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{lang === "fr" ? "Titre de la section" : "Section Title"}</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder={lang === "fr" ? "ex: Nos Univers" : `Categories title in ${getLocaleDisplayName(loc)}`}
                                                            {...field}
                                                            value={field.value || ""}
                                                            disabled={isPending}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`categoriesSubtitle.${loc}`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{lang === "fr" ? "Sous-titre / Description" : "Section Subtitle / Description"}</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            rows={2}
                                                            placeholder={lang === "fr" ? "ex: Découvrez l'ensemble de nos collections artistiques" : `Categories subtitle in ${getLocaleDisplayName(loc)}`}
                                                            {...field}
                                                            value={field.value || ""}
                                                            disabled={isPending}
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
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name={`categoriesTitle.${defaultLocale}`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{lang === "fr" ? "Titre de la section" : "Section Title"}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder={lang === "fr" ? "ex: Nos Univers" : "Categories title"}
                                                    {...field}
                                                    value={field.value || ""}
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`categoriesSubtitle.${defaultLocale}`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{lang === "fr" ? "Sous-titre / Description" : "Section Subtitle / Description"}</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    rows={2}
                                                    placeholder={lang === "fr" ? "ex: Découvrez l'ensemble de nos collections artistiques" : "Categories subtitle"}
                                                    {...field}
                                                    value={field.value || ""}
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Products Section Title (Optional) */}
                <Card id="products-title" className="scroll-mt-8 relative">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 mb-1">
                                <Package className="w-5 h-5 text-muted-foreground" />
                                <h2 className="text-lg font-medium tracking-tight">
                                    {lang === "fr" ? "Titre des Produits" : "Products Title"}
                                </h2>
                            </div>
                            <Badge variant="outline" className="text-xs text-muted-foreground font-normal">
                                {lang === "fr" ? "Facultatif" : "Optional"}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            {lang === "fr"
                                ? "Titre d'accroche et sous-titre facultatifs affichés pour la section des produits sur la page d'accueil (valeur par défaut : 'Solutions')."
                                : "Optional headline title and subtitle displayed for the products section on the homepage (defaults to 'Solutions')."}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
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
                                            name={`productsTitle.${loc}`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{lang === "fr" ? "Titre de la section" : "Section Title"}</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            placeholder={lang === "fr" ? "ex: Solutions" : `Products title in ${getLocaleDisplayName(loc)}`}
                                                            {...field}
                                                            value={field.value || ""}
                                                            disabled={isPending}
                                                        />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name={`productsSubtitle.${loc}`}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{lang === "fr" ? "Sous-titre / Description" : "Section Subtitle / Description"}</FormLabel>
                                                    <FormControl>
                                                        <Textarea
                                                            rows={2}
                                                            placeholder={lang === "fr" ? "ex: Découvrez l'ensemble de nos services et réalisations" : `Products subtitle in ${getLocaleDisplayName(loc)}`}
                                                            {...field}
                                                            value={field.value || ""}
                                                            disabled={isPending}
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
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name={`productsTitle.${defaultLocale}`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{lang === "fr" ? "Titre de la section" : "Section Title"}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder={lang === "fr" ? "ex: Solutions" : "Products title"}
                                                    {...field}
                                                    value={field.value || ""}
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`productsSubtitle.${defaultLocale}`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{lang === "fr" ? "Sous-titre / Description" : "Section Subtitle / Description"}</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    rows={2}
                                                    placeholder={lang === "fr" ? "ex: Découvrez l'ensemble de nos services et réalisations" : "Products subtitle"}
                                                    {...field}
                                                    value={field.value || ""}
                                                    disabled={isPending}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Footer & Socials Section */}
                {/* Contact & Location Section */}
                <Card id="contact-location" className="scroll-mt-8 relative">
                    <CardHeader>
                        <div className="flex items-center gap-2 mb-1">
                            <Building2 className="w-5 h-5 text-muted-foreground" />
                            <h2 className="text-lg font-medium tracking-tight">
                                {lang === "fr" ? "Contact & Localisation" : "Contact & Location"}
                            </h2>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                            {lang === "fr"
                                ? "Coordonnées directes, horaires d'ouverture et adresse physique pour vos clients et le SEO local."
                                : "Direct contact info, operating hours, and physical storefront address for customers and local SEO."}
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Email & Phone */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="contactEmail"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1.5">
                                            <Mail className="w-4 h-4 text-muted-foreground" />
                                            {lang === "fr" ? "Email de contact" : "Contact Email"}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder="contact@brand.com"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            {lang === "fr" ? "Email affiché ou utilisé pour le support." : "Email displayed for customer inquiries."}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="contactPhone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1.5">
                                            <Phone className="w-4 h-4 text-muted-foreground" />
                                            {lang === "fr" ? "Numéro de téléphone" : "Phone Number"}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="+33 1 23 45 67 89"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                            {lang === "fr" ? "Format international recommandé (+33...)." : "International format recommended (+33... / +66...)."}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Support Hours */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
                            <FormField
                                control={form.control}
                                name="supportHoursEn"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                            {lang === "fr" ? "Horaires de support (Anglais)" : "Support Hours (English)"}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Monday - Friday, 9am - 6pm CET"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="supportHoursFr"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center gap-1.5">
                                            <Clock className="w-4 h-4 text-muted-foreground" />
                                            {lang === "fr" ? "Horaires de support (Français)" : "Support Hours (French)"}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Lundi - Vendredi, 9h - 18h CET"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Physical Address (LocalBusiness) */}
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" />
                                <h4 className="text-sm font-semibold">
                                    {lang === "fr" ? "Adresse physique de l'établissement" : "Physical Business Address"}
                                </h4>
                            </div>

                            <FormField
                                control={form.control}
                                name="seoAddressStreet"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{lang === "fr" ? "Numéro et nom de voie" : "Street Address"}</FormLabel>
                                        <FormControl>
                                            <Input placeholder="10 Place de la Madeleine" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <FormField
                                    control={form.control}
                                    name="seoAddressLocality"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{lang === "fr" ? "Ville / Localité" : "City / Locality"}</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Paris" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="seoPostalCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{lang === "fr" ? "Code Postal" : "Postal Code"}</FormLabel>
                                            <FormControl>
                                                <Input placeholder="75008" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="seoCountry"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{lang === "fr" ? "Pays (ou Code ISO)" : "Country"}</FormLabel>
                                            <FormControl>
                                                <Input placeholder="France ou FR" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer & Social Links Section */}
                <Card id="footer-social-links" className="scroll-mt-8 relative">
                    <span id="footer" className="sr-only scroll-mt-8" />
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
                                                        <FormDescription className="text-xs text-muted-foreground">
                                                            HTML is supported (e.g., &lt;a href=&quot;...&quot;&gt;, &lt;br&gt;, &lt;strong&gt;).
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
                                    name={`footerDescription.${defaultLocale}`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Textarea rows={3} placeholder="Brand description for the footer" {...field} />
                                            </FormControl>
                                            <FormDescription className="text-xs text-muted-foreground">
                                                HTML is supported (e.g., &lt;a href=&quot;...&quot;&gt;, &lt;br&gt;, &lt;strong&gt;).
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        {/* Social Links (Custom) */}
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
                            <FormLabel className="text-base font-semibold">
                                {lang === "fr" ? "Titre de la colonne de droite du pied de page" : "Footer Right Menu Title"}
                            </FormLabel>
                            <FormDescription>
                                {lang === "fr"
                                    ? "Titre affiché au-dessus des liens de pages dans la colonne de droite du footer (ex: Legal, Pages, Informations)."
                                    : "Title displayed above the custom page links in the right column of the footer (e.g. Legal, Pages, Information)."}
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
                                                name={`footerRightMenuTitle.${loc}`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <Input placeholder="Legal" {...field} />
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
                                    name={`footerRightMenuTitle.${defaultLocale}`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input placeholder="Legal" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
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
